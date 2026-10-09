import { 
  loadPointsFromIndexedDB, 
  savePointsToIndexedDB, 
  getLocalPointsCount, 
  getStorageMeta, 
  requestPersistentStorage,
  PK_UPDATED_EVENT
} from '../utils/pkStorage';
import { PkPoint } from '../utils/kmzParser';

export type SyncStatusType = 'idle' | 'checking' | 'syncing' | 'synced' | 'offline' | 'error';
export type SyncDirection = 'none' | 'upload' | 'download';

export interface PkSyncState {
  status: SyncStatusType;
  direction: SyncDirection;
  localCount: number;
  serverCount: number;
  lastSyncTime: Date | null;
  message: string;
  filename?: string;
  isOnline: boolean;
  lastError?: string;
}

type SyncListener = (state: PkSyncState) => void;

class PkSyncService {
  private state: PkSyncState = {
    status: 'idle',
    direction: 'none',
    localCount: 0,
    serverCount: 0,
    lastSyncTime: null,
    message: 'Servicio de sincronización listo',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  };

  private listeners: Set<SyncListener> = new Set();
  private worker: Worker | null = null;
  private isInitialized = false;
  private syncInProgress = false;
  private heartbeatInterval: any = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('../workers/pkSyncWorker.ts', import.meta.url), {
          type: 'module'
        });
        this.worker.onerror = (err) => {
          console.warn('[PK Worker] Worker error, continuing with main-thread processing:', err);
        };
      } catch (err) {
        console.warn('[PK Worker] Could not initialize Web Worker, falling back to main thread:', err);
      }
    }
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Request persistent storage from browser so mobile OS won't evict 12,000 points
    requestPersistentStorage().catch(() => {});

    // 2. Read initial local count
    getLocalPointsCount().then(cnt => {
      this.updateState({
        localCount: cnt,
        message: cnt > 0 ? `${cnt.toLocaleString()} puntos disponibles en almacenamiento local` : 'Esperando datos de puntos PK'
      });
    });

    // 3. Online / Offline listeners
    window.addEventListener('online', () => {
      console.log('[PK SYNC] Conexión detectada (online). Verificando y resincronizando puntos PK...');
      this.updateState({ isOnline: true });
      this.syncNow({ reason: 'online_event' });
    });

    window.addEventListener('offline', () => {
      console.log('[PK SYNC] Conexión perdida (offline). Activando modo local autónomo.');
      this.updateState({
        isOnline: false,
        status: 'offline',
        message: `Modo sin conexión: ${this.state.localCount.toLocaleString()} puntos PK disponibles localmente en el dispositivo.`
      });
    });

    // 4. Page visibility change (device wake up / returning to app tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        // Debounce slightly to avoid rapid tab switching triggers
        setTimeout(() => {
          this.syncNow({ reason: 'visibility_change' });
        }, 1000);
      }
    });

    // 5. Listen to internal PK updates (e.g. user manually imported KMZ in UI)
    window.addEventListener(PK_UPDATED_EVENT, ((e: CustomEvent) => {
      const count = e.detail?.count || 0;
      const filename = e.detail?.filename;
      this.updateState({
        localCount: count,
        filename: filename || this.state.filename,
        lastSyncTime: new Date(),
        message: `${count.toLocaleString()} puntos actualizados en el dispositivo local.`
      });
    }) as EventListener);

    // 6. Periodic heartbeat check (every 60s when online)
    this.heartbeatInterval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && !this.syncInProgress) {
        this.syncNow({ reason: 'heartbeat' });
      }
    }, 60000);

    // Initial sync trigger after startup
    setTimeout(() => {
      if (navigator.onLine) {
        this.syncNow({ reason: 'initial_startup' });
      }
    }, 2000);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately invoke with current state
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): PkSyncState {
    return { ...this.state };
  }

  private updateState(partial: Partial<PkSyncState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (e) {
        console.error('Error in PK sync listener:', e);
      }
    });
  }

  /**
   * Main synchronization routine:
   * Verifies IndexedDB points against the server and synchronizes both ways automatically.
   */
  public async syncNow(options?: { force?: boolean; reason?: string }): Promise<void> {
    if (this.syncInProgress) {
      console.log('[PK SYNC] Sincronización en curso, omitiendo petición simultánea.');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState({
        isOnline: false,
        status: 'offline',
        message: `Modo sin conexión: ${this.state.localCount.toLocaleString()} puntos disponibles localmente.`
      });
      return;
    }

    this.syncInProgress = true;
    this.updateState({
      status: 'checking',
      direction: 'none',
      isOnline: true,
      message: 'Comprobando sincronización con el servidor...'
    });

    try {
      // 1. Get local points count & metadata
      const localCount = await getLocalPointsCount();
      const localMeta = getStorageMeta();

      // 2. Fetch server metadata (lightweight, minimal bandwidth)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const metaRes = await fetch('/api/pk/meta', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!metaRes.ok) {
        throw new Error(`Servidor devolvió código HTTP ${metaRes.status}`);
      }

      const serverMeta = await metaRes.json();
      const serverCount = typeof serverMeta.count === 'number' ? serverMeta.count : 0;
      const hostedFilename = serverMeta.filename || localMeta?.filename;

      this.updateState({
        localCount,
        serverCount,
        filename: hostedFilename
      });

      console.log(`[PK SYNC] Verificación: Local=${localCount} pts | Servidor=${serverCount} pts (Motivo: ${options?.reason || 'manual'})`);

      // -----------------------------------------------------------------------
      // SCENARIO A: Local has points (>= 50), but Server has 0 (or lost on restart)
      // -> Auto-restore local points up to server so server database stays intact!
      // -----------------------------------------------------------------------
      if (localCount >= 50 && serverCount === 0) {
        console.log(`[PK SYNC] Servidor vacío. Subiendo y restaurando ${localCount} puntos locales al servidor...`);
        this.updateState({
          status: 'syncing',
          direction: 'upload',
          message: `Restaurando ${localCount.toLocaleString()} puntos en el servidor...`
        });

        const cachedPoints = await loadPointsFromIndexedDB();
        if (cachedPoints && cachedPoints.length > 0) {
          const syncRes = await fetch('/api/pk/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientCount: cachedPoints.length,
              points: cachedPoints,
              filename: hostedFilename || 'adif_red_ferroviaria.kmz',
              adminEmail: 'sistema@adif.es',
              adminName: 'Sincronizador Persistente'
            })
          });

          if (syncRes.ok) {
            const syncData = await syncRes.json();
            this.updateState({
              status: 'synced',
              direction: 'none',
              serverCount: syncData.serverCount || cachedPoints.length,
              localCount: cachedPoints.length,
              lastSyncTime: new Date(),
              message: `Sincronizado: ${cachedPoints.length.toLocaleString()} puntos asegurados en el servidor y en el dispositivo.`
            });
            console.log('[PK SYNC] Servidor restaurado con éxito con puntos locales.');
            return;
          }
        }
      }

      // -----------------------------------------------------------------------
      // SCENARIO B: Server has points (> localCount or localCount is 0/stale)
      // -> Download full database to phone without total page reload!
      // -----------------------------------------------------------------------
      if (serverCount > localCount || (serverCount > 0 && localCount === 0) || options?.force) {
        console.log(`[PK SYNC] Servidor tiene ${serverCount} puntos (local=${localCount}). Descargando a almacenamiento persistente...`);
        this.updateState({
          status: 'syncing',
          direction: 'download',
          message: `Descargando ${serverCount.toLocaleString()} puntos para almacenamiento permanente...`
        });

        const dataRes = await fetch('/api/pk');
        if (!dataRes.ok) throw new Error('Error al descargar puntos desde /api/pk');

        const pkData = await dataRes.json();
        if (Array.isArray(pkData.points) && pkData.points.length > 0) {
          // Persist directly to phone storage (Memory + Cache API + Chunked IndexedDB)
          await savePointsToIndexedDB(pkData.points, pkData.metadata?.filename);

          this.updateState({
            status: 'synced',
            direction: 'none',
            localCount: pkData.points.length,
            serverCount: pkData.points.length,
            filename: pkData.metadata?.filename || hostedFilename,
            lastSyncTime: new Date(),
            message: `Sincronizado: ${pkData.points.length.toLocaleString()} puntos guardados localmente sin recargas.`
          });
          console.log(`[PK SYNC] ${pkData.points.length} puntos descargados y guardados en IndexedDB.`);
          return;
        }
      }

      // -----------------------------------------------------------------------
      // SCENARIO C: Both in sync (both counts match and > 0)
      // -----------------------------------------------------------------------
      if (localCount > 0 && (serverCount === localCount || Math.abs(serverCount - localCount) < 5)) {
        this.updateState({
          status: 'synced',
          direction: 'none',
          lastSyncTime: new Date(),
          message: `Sincronización completa: ${localCount.toLocaleString()} puntos disponibles offline y en servidor.`
        });
        return;
      }

      // -----------------------------------------------------------------------
      // SCENARIO D: Local has more points than server (localCount > serverCount > 0)
      // -----------------------------------------------------------------------
      if (localCount > serverCount && serverCount > 0) {
        console.log(`[PK SYNC] Dispositivo local tiene más puntos (${localCount}) que el servidor (${serverCount}). Sincronizando servidor...`);
        const cachedPoints = await loadPointsFromIndexedDB();
        if (cachedPoints && cachedPoints.length > 0) {
          await fetch('/api/pk/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientCount: cachedPoints.length,
              points: cachedPoints,
              filename: hostedFilename,
              adminEmail: 'sistema@adif.es',
              adminName: 'Sincronizador Persistente'
            })
          });
          this.updateState({
            status: 'synced',
            serverCount: cachedPoints.length,
            lastSyncTime: new Date(),
            message: `Sincronizado: ${cachedPoints.length.toLocaleString()} puntos actualizados.`
          });
          return;
        }
      }

      // Fallback state
      this.updateState({
        status: 'synced',
        direction: 'none',
        lastSyncTime: new Date(),
        message: localCount > 0 ? `${localCount.toLocaleString()} puntos listos en el dispositivo.` : 'Base de datos lista para importar KMZ.'
      });

    } catch (err: any) {
      console.warn('[PK SYNC] Error en verificación de sincronización:', err);
      // NEVER delete local points! Always keep local IndexedDB accessible!
      const currentLocal = await getLocalPointsCount();
      this.updateState({
        status: currentLocal > 0 ? 'synced' : 'error',
        lastError: err?.message || 'Error de conexión',
        message: currentLocal > 0 
          ? `Operando con ${currentLocal.toLocaleString()} puntos locales (servidor temporalmente no disponible).`
          : 'No se pudo conectar con el servidor para sincronizar puntos.'
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Helper to manually push local points up to server (e.g. from admin tools)
   */
  public async uploadLocalDatabaseToServer(adminEmail?: string, adminName?: string): Promise<boolean> {
    const points = await loadPointsFromIndexedDB();
    if (!points || points.length === 0) return false;

    this.updateState({
      status: 'syncing',
      direction: 'upload',
      message: `Enviando ${points.length.toLocaleString()} puntos al servidor...`
    });

    try {
      const res = await fetch('/api/pk/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCount: points.length,
          points,
          filename: this.state.filename || 'adif_red_ferroviaria.kmz',
          adminEmail: adminEmail || 'sistema@adif.es',
          adminName: adminName || 'Administrador'
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.updateState({
          status: 'synced',
          direction: 'none',
          serverCount: data.serverCount || points.length,
          lastSyncTime: new Date(),
          message: `Servidor sincronizado con éxito (${points.length.toLocaleString()} puntos).`
        });
        return true;
      }
      return false;
    } catch (e: any) {
      this.updateState({
        status: 'error',
        lastError: e?.message,
        message: 'Error al enviar puntos al servidor'
      });
      return false;
    }
  }
}

export const pkSyncService = new PkSyncService();
