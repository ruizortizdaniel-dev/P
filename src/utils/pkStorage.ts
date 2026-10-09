import { PkPoint } from './kmzParser';

const DB_NAME = 'AdifPkFinderDB';
const DB_VERSION = 2;
const STORE_NAME = 'pk_points_store';
const KEY_NAME = 'all_points';
const CHUNKS_PREFIX = 'pk_chunk_';
const CHUNK_SIZE = 2000;
const CACHE_NAME = 'adif-pk-cache-v2';
const CACHE_REQUEST_URL = '/__cached_adif_pk_data__';
const META_STORAGE_KEY = 'adif_pk_meta_v2';

// Global In-Memory Singleton Cache (persists as long as page is open)
let memoryCache: PkPoint[] | null = null;
let memoryMeta: { count: number; filename?: string; savedAt: string } | null = null;

export interface PkStorageMeta {
  count: number;
  filename?: string;
  savedAt: string;
}

export const PK_UPDATED_EVENT = 'adif:pk-updated';

/**
 * Requests the browser to mark storage as persistent (prevents eviction on low disk)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (isPersisted) return true;
      const granted = await navigator.storage.persist();
      console.log('Persistent storage permission granted:', granted);
      return granted;
    } catch (e) {
      console.warn('Storage persist request warning:', e);
    }
  }
  return false;
}

/**
 * Quickly checks the number of locally stored PK points without loading the entire array
 */
export async function getLocalPointsCount(): Promise<number> {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache.length;
  }
  const meta = getStorageMeta();
  if (meta && typeof meta.count === 'number' && meta.count > 0) {
    return meta.count;
  }
  try {
    const db = await openDatabase();
    return new Promise<number>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const chunksCountReq = store.get('total_chunks');
      chunksCountReq.onsuccess = () => {
        const total = chunksCountReq.result;
        if (typeof total === 'number' && total > 0) {
          // Check monolithic key for exact count
          const monoReq = store.get(KEY_NAME);
          monoReq.onsuccess = () => {
            if (Array.isArray(monoReq.result)) {
              resolve(monoReq.result.length);
            } else {
              resolve(total * CHUNK_SIZE);
            }
          };
          monoReq.onerror = () => resolve(total * CHUNK_SIZE);
        } else {
          const monoReq = store.get(KEY_NAME);
          monoReq.onsuccess = () => {
            if (Array.isArray(monoReq.result)) {
              resolve(monoReq.result.length);
            } else {
              resolve(0);
            }
          };
          monoReq.onerror = () => resolve(0);
        }
      };
      chunksCountReq.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Returns currently in-memory cached points immediately if available
 */
export function getMemoryCachedPoints(): PkPoint[] | null {
  return memoryCache && memoryCache.length > 0 ? memoryCache : null;
}

/**
 * Sets the in-memory cache directly
 */
export function setMemoryCachedPoints(points: PkPoint[], filename?: string): void {
  if (Array.isArray(points) && points.length > 0) {
    memoryCache = points;
    memoryMeta = {
      count: points.length,
      filename,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(memoryMeta));
    } catch {}
  }
}

/**
 * Opens or initializes the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves points to Cache API (High-capacity, persistent storage on iOS Safari & Android)
 */
async function saveToCacheApi(points: PkPoint[], filename?: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return false;
    const cache = await window.caches.open(CACHE_NAME);
    const data = {
      points,
      count: points.length,
      filename,
      savedAt: new Date().toISOString()
    };
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=31536000'
      }
    });
    await cache.put(new Request(CACHE_REQUEST_URL), response);
    return true;
  } catch (err) {
    console.warn('Cache API storage failed:', err);
    return false;
  }
}

/**
 * Loads points from Cache API
 */
async function loadFromCacheApi(): Promise<PkPoint[] | null> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return null;
    const cache = await window.caches.open(CACHE_NAME);
    const response = await cache.match(new Request(CACHE_REQUEST_URL));
    if (!response) return null;
    const data = await response.json();
    if (data && Array.isArray(data.points) && data.points.length > 0) {
      if (data.count) {
        memoryMeta = {
          count: data.count,
          filename: data.filename,
          savedAt: data.savedAt || new Date().toISOString()
        };
      }
      return data.points;
    }
  } catch (err) {
    console.warn('Cache API read error:', err);
  }
  return null;
}

/**
 * Saves all points to local storage (Multi-tier: Memory + Cache API + Chunked IndexedDB)
 */
export async function savePointsToIndexedDB(points: PkPoint[], filename?: string): Promise<void> {
  if (!Array.isArray(points) || points.length === 0) return;

  // 1. Keep in memory immediately
  setMemoryCachedPoints(points, filename);

  // 2. Save to Cache API
  await saveToCacheApi(points, filename);

  // 3. Save to IndexedDB with chunking to prevent mobile QuotaExceeded errors
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Save monolithic key first
      store.put(points, KEY_NAME);

      // Also save chunked keys for mobile stability
      const totalChunks = Math.ceil(points.length / CHUNK_SIZE);
      store.put(totalChunks, 'total_chunks');

      for (let i = 0; i < totalChunks; i++) {
        const chunk = points.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        store.put(chunk, `${CHUNKS_PREFIX}${i}`);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  } catch (err) {
    console.warn('IndexedDB save warning (Cache API copy still active):', err);
  }

  // 4. Notify app listeners that points were persisted
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(PK_UPDATED_EVENT, {
        detail: {
          points,
          count: points.length,
          filename
        }
      }));
    } catch {}
  }
}

/**
 * Loads all points from multi-tier storage (Memory -> Cache API -> IndexedDB)
 */
export async function loadPointsFromIndexedDB(): Promise<PkPoint[] | null> {
  // 1. Check memory cache first (instant 0ms retrieval)
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  // 2. Check Cache API (extremely reliable on mobile phones)
  const cachedFromCacheApi = await loadFromCacheApi();
  if (cachedFromCacheApi && cachedFromCacheApi.length > 0) {
    memoryCache = cachedFromCacheApi;
    return cachedFromCacheApi;
  }

  // 3. Check IndexedDB
  try {
    const db = await openDatabase();

    // Try reading the monolithic key first
    const monolithicPoints = await new Promise<PkPoint[] | null>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_NAME);

      request.onsuccess = () => {
        const result = request.result;
        if (Array.isArray(result) && result.length > 0) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });

    if (monolithicPoints && monolithicPoints.length > 0) {
      memoryCache = monolithicPoints;
      // Reseed Cache API in background
      saveToCacheApi(monolithicPoints);
      return monolithicPoints;
    }

    // Try chunked retrieval if monolithic key was empty or failed
    const chunkedPoints = await new Promise<PkPoint[] | null>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const chunksCountReq = store.get('total_chunks');

      chunksCountReq.onsuccess = async () => {
        const totalChunks = chunksCountReq.result;
        if (typeof totalChunks === 'number' && totalChunks > 0) {
          let reassembled: PkPoint[] = [];
          for (let i = 0; i < totalChunks; i++) {
            const chunkReq = store.get(`${CHUNKS_PREFIX}${i}`);
            await new Promise<void>((rChunk) => {
              chunkReq.onsuccess = () => {
                if (Array.isArray(chunkReq.result)) {
                  reassembled = reassembled.concat(chunkReq.result);
                }
                rChunk();
              };
              chunkReq.onerror = () => rChunk();
            });
          }
          if (reassembled.length > 0) {
            resolve(reassembled);
            return;
          }
        }
        resolve(null);
      };
      chunksCountReq.onerror = () => resolve(null);
    });

    if (chunkedPoints && chunkedPoints.length > 0) {
      memoryCache = chunkedPoints;
      saveToCacheApi(chunkedPoints);
      return chunkedPoints;
    }
  } catch (err) {
    console.warn('Could not read from IndexedDB:', err);
  }

  return null;
}

/**
 * Clears the stored points from all storage tiers
 */
export async function clearPointsFromIndexedDB(): Promise<void> {
  memoryCache = null;
  memoryMeta = null;

  try {
    localStorage.removeItem(META_STORAGE_KEY);
  } catch {}

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await window.caches.open(CACHE_NAME);
      await cache.delete(new Request(CACHE_REQUEST_URL));
    }
  } catch {}

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Could not clear IndexedDB:', err);
  }
}

/**
 * Gets storage metadata (count, filename, date)
 */
export function getStorageMeta(): PkStorageMeta | null {
  if (memoryMeta) return memoryMeta;
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
