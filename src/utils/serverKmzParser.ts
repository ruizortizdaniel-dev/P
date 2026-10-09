import JSZip from 'jszip';

export interface PkPoint {
  id: string;
  name: string;
  linea?: string;
  pk?: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  folder?: string;
}

/**
 * Strips HTML tags and excessive whitespace from KML descriptions
 */
function cleanDescription(html: string): string {
  if (!html) return '';
  const text = html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 300 ? text.substring(0, 297) + '...' : text;
}

/**
 * Robust regex-based KML parser that runs cleanly in Node.js (no DOMParser needed)
 */
export function parseKmlString(kmlText: string): PkPoint[] {
  if (!kmlText || typeof kmlText !== 'string') return [];

  const points: PkPoint[] = [];
  const placemarkRegex = /<(?:[\w-]+:)?Placemark[\s>]([\s\S]*?)<\/(?:[\w-]+:)?Placemark>/gi;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = placemarkRegex.exec(kmlText)) !== null) {
    index++;
    const content = match[1];

    // Extract name
    const nameMatch = content.match(/<(?:[\w-]+:)?name[\s>](?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:[\w-]+:)?name>/i);
    const name = (nameMatch ? (nameMatch[1] || nameMatch[2]) : `Punto ${index}`).trim();

    // Extract description
    const descMatch = content.match(/<(?:[\w-]+:)?description[\s>](?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:[\w-]+:)?description>/i);
    const rawDesc = descMatch ? (descMatch[1] || descMatch[2]) : '';
    const description = cleanDescription(rawDesc);

    // Extract coordinates
    let lat: number | null = null;
    let lon: number | null = null;
    let alt: number | undefined = undefined;

    // Standard <coordinates> tag
    const coordsMatch = content.match(/<(?:[\w-]+:)?coordinates[\s>]([\s\S]*?)<\/(?:[\w-]+:)?coordinates>/i);
    if (coordsMatch) {
      const cleanCoords = coordsMatch[1].replace(/\s*,\s*/g, ',').trim();
      const tuples = cleanCoords.split(/\s+/);
      if (tuples.length > 0) {
        const parts = tuples[0].split(',');
        if (parts.length >= 2) {
          const parsedLon = parseFloat(parts[0]);
          const parsedLat = parseFloat(parts[1]);
          if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
            lon = parsedLon;
            lat = parsedLat;
            if (parts[2]) {
              const parsedAlt = parseFloat(parts[2]);
              if (!isNaN(parsedAlt)) alt = parsedAlt;
            }
          }
        }
      }
    }

    // Google Earth <gx:coord> tag fallback
    if (lat === null || lon === null) {
      const gxMatch = content.match(/<(?:[\w-]+:)?(?:gx:)?coord[\s>]([\s\S]*?)<\/(?:[\w-]+:)?(?:gx:)?coord>/i);
      if (gxMatch) {
        const parts = gxMatch[1].trim().split(/\s+/);
        if (parts.length >= 2) {
          const parsedLon = parseFloat(parts[0]);
          const parsedLat = parseFloat(parts[1]);
          if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
            lon = parsedLon;
            lat = parsedLat;
            if (parts[2]) {
              const parsedAlt = parseFloat(parts[2]);
              if (!isNaN(parsedAlt)) alt = parsedAlt;
            }
          }
        }
      }
    }

    if (lat !== null && lon !== null) {
      let pkStr = '';
      let lineaStr = '';

      // SimpleData attributes
      const simpleDataRegex = /<(?:\w+:)?SimpleData[^>]*name=["']([^"']+)["'][^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:\w+:)?SimpleData>/gi;
      let sdMatch: RegExpExecArray | null;
      while ((sdMatch = simpleDataRegex.exec(content)) !== null) {
        const attrName = sdMatch[1].toLowerCase();
        const val = (sdMatch[2] || sdMatch[3] || '').trim();
        if (!val) continue;

        if (!pkStr && (attrName === 'pk' || attrName.includes('punto') || attrName.includes('kilom'))) {
          pkStr = val;
        }
        if (!lineaStr && (attrName === 'linea' || attrName === 'linia' || attrName === 'line' || attrName.includes('tramo'))) {
          lineaStr = val;
        }
      }

      // Fallback extraction
      if (!pkStr) {
        const pkMatch = name.match(/PK\s*[:\.]?\s*(\d+[+\.]\d+|\d+)/i) || 
                        rawDesc.match(/PK\s*[:\.]?\s*(\d+[+\.]\d+|\d+)/i) ||
                        name.match(/(\d+\+\d+)/);
        if (pkMatch) pkStr = pkMatch[1];
      }

      if (!lineaStr) {
        const lineMatch = name.match(/L[íi]nea\s*(\d+|[A-Z0-9]+)/i) ||
                          rawDesc.match(/L[íi]nea\s*(\d+|[A-Z0-9]+)/i);
        if (lineMatch) lineaStr = lineMatch[1];
      }

      points.push({
        id: `pk-${index}-${Math.floor(Math.abs(lat) * 10000)}`,
        name,
        pk: pkStr,
        linea: lineaStr,
        description,
        latitude: lat,
        longitude: lon,
        altitude: alt
      });
    }
  }

  return points;
}

/**
 * Parses a buffer of KMZ (zipped) or plain KML file in Node.js
 */
export async function parseKmzOrKmlBuffer(buffer: Buffer, filename: string): Promise<PkPoint[]> {
  const isKmz = filename.toLowerCase().endsWith('.kmz');

  if (isKmz) {
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(buffer);
      const kmlNames = Object.keys(loadedZip.files).filter(name => {
        const lower = name.toLowerCase();
        return (lower.endsWith('.kml') || lower.endsWith('.xml')) && !loadedZip.files[name].dir;
      });

      if (kmlNames.length > 0) {
        let allPoints: PkPoint[] = [];
        for (const name of kmlNames) {
          const kmlText = await loadedZip.files[name].async('string');
          const pts = parseKmlString(kmlText);
          allPoints = allPoints.concat(pts);
        }
        if (allPoints.length > 0) return allPoints;
      }

      // Inspect any file in archive
      const otherNames = Object.keys(loadedZip.files).filter(n => !loadedZip.files[n].dir);
      for (const name of otherNames) {
        const text = await loadedZip.files[name].async('string');
        if (text.includes('Placemark') || text.includes('<kml')) {
          const pts = parseKmlString(text);
          if (pts.length > 0) return pts;
        }
      }
    } catch (e) {
      console.warn('Failed unzipping buffer, trying plain text fallback:', e);
      // Fall through to plain text
    }
  }

  const text = buffer.toString('utf-8');
  return parseKmlString(text);
}
