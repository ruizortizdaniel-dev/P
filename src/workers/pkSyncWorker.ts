/**
 * Web Worker for Railway PK Data & Background Sync
 * Runs heavy data operations (processing, verification, chunking) in a background thread
 * to guarantee that the main UI never drops frames when working with 12,000+ points.
 */

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data || {};

  try {
    switch (type) {
      case 'VERIFY_POINTS': {
        const points = payload?.points || [];
        const count = points.length;
        let validCount = 0;
        let linesSet = new Set<string>();

        for (let i = 0; i < count; i++) {
          const p = points[i];
          if (p && typeof p.latitude === 'number' && typeof p.longitude === 'number') {
            validCount++;
            if (p.linea) linesSet.add(p.linea);
          }
        }

        const lines = Array.from(linesSet).sort();
        const firstPoint = points[0];
        const lastPoint = points[count - 1];
        const checksum = `${count}_${firstPoint?.id || ''}_${lastPoint?.id || ''}`;

        self.postMessage({
          id,
          type: 'VERIFY_POINTS_SUCCESS',
          result: {
            total: count,
            validCount,
            uniqueLinesCount: lines.length,
            lines,
            checksum
          }
        });
        break;
      }

      case 'CHUNK_POINTS': {
        const points = payload?.points || [];
        const chunkSize = payload?.chunkSize || 2000;
        const totalChunks = Math.ceil(points.length / chunkSize);
        const chunks = [];

        for (let i = 0; i < totalChunks; i++) {
          chunks.push(points.slice(i * chunkSize, (i + 1) * chunkSize));
        }

        self.postMessage({
          id,
          type: 'CHUNK_POINTS_SUCCESS',
          result: {
            totalChunks,
            totalPoints: points.length,
            chunks
          }
        });
        break;
      }

      case 'PING': {
        self.postMessage({ id, type: 'PONG', timestamp: Date.now() });
        break;
      }

      default:
        self.postMessage({
          id,
          type: 'UNKNOWN_MESSAGE',
          error: `Unknown action: ${type}`
        });
    }
  } catch (err: any) {
    self.postMessage({
      id,
      type: 'ERROR',
      error: err?.message || 'Error executing worker task'
    });
  }
};
