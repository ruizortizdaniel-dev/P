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
 * Extracts text content from a potential CDATA or XML node
 */
function getNodeText(node: Element | null | undefined): string {
  if (!node) return '';
  return node.textContent?.trim() || '';
}

/**
 * Safely extracts folder name by traversing up the parent nodes
 * (Avoids Element.closest() which throws in XMLDocument on some mobile browsers)
 */
function getParentFolderName(el: Element): string {
  let curr: Node | null = el.parentNode;
  while (curr && curr.nodeType === 1) {
    const parentEl = curr as Element;
    const tagName = (parentEl.tagName || parentEl.nodeName || '').toLowerCase();
    if (tagName.endsWith('folder')) {
      // Find direct or first name element
      const names = parentEl.getElementsByTagName('name');
      if (names && names.length > 0 && names[0].textContent) {
        return names[0].textContent.trim();
      }
    }
    curr = curr.parentNode;
  }
  return '';
}

/**
 * Fallback regex-based parser for Placemarks
 * Used when DOMParser fails due to unescaped XML or XML syntax errors
 */
function parseKmlWithRegex(kmlText: string): PkPoint[] {
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

    // Check standard <coordinates> tag
    const coordsMatch = content.match(/<(?:[\w-]+:)?coordinates[\s>]([\s\S]*?)<\/(?:[\w-]+:)?coordinates>/i);
    if (coordsMatch) {
      const cleaned = coordsMatch[1].replace(/\s*,\s*/g, ',').trim();
      const tuples = cleaned.split(/\s+/);
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

    // Check Google Earth <gx:coord> tag (lon lat alt space-separated)
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
      // Extract PK and Line from content
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
 * Extracts and parses Placemark nodes from KML XML text
 */
export function parseKmlText(rawKmlText: string): PkPoint[] {
  if (!rawKmlText || typeof rawKmlText !== 'string') return [];

  // 1. Sanitize common XML errors (unescaped ampersands)
  const sanitizedKml = rawKmlText.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

  let xmlDoc: Document | null = null;
  try {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(sanitizedKml, 'text/xml');

    // Check if DOMParser produced a parsererror element
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError && parserError.length > 0) {
      xmlDoc = null; // Will trigger regex fallback below
    }
  } catch (err) {
    xmlDoc = null;
  }

  // If DOMParser failed or returned null, use regex parser
  if (!xmlDoc) {
    return parseKmlWithRegex(rawKmlText);
  }

  // Extract all placemarks (supporting namespace prefixes like kml:Placemark)
  let placemarkNodes: Element[] = [];
  const tagNamesToTry = ['Placemark', 'placemark', 'kml:Placemark', 'kml:placemark'];
  for (const tagName of tagNamesToTry) {
    const found = xmlDoc.getElementsByTagName(tagName);
    if (found && found.length > 0) {
      placemarkNodes = Array.from(found);
      break;
    }
  }

  // If getElementsByTagName found nothing, try querySelectorAll or regex fallback
  if (placemarkNodes.length === 0) {
    try {
      const queried = xmlDoc.querySelectorAll('Placemark, *|Placemark');
      if (queried.length > 0) {
        placemarkNodes = Array.from(queried);
      }
    } catch {}
  }

  // If DOM still found no placemarks, try regex fallback
  if (placemarkNodes.length === 0) {
    const regexResults = parseKmlWithRegex(rawKmlText);
    if (regexResults.length > 0) {
      return regexResults;
    }
  }

  const points: PkPoint[] = [];

  placemarkNodes.forEach((pm, index) => {
    // Extract name
    let name = '';
    const nameNodes = pm.getElementsByTagName('name');
    if (nameNodes.length > 0) {
      name = getNodeText(nameNodes[0]);
    }
    if (!name) name = `Punto ${index + 1}`;

    // Extract description
    let rawDescription = '';
    const descNodes = pm.getElementsByTagName('description');
    if (descNodes.length > 0) {
      rawDescription = getNodeText(descNodes[0]);
    }
    const description = cleanDescription(rawDescription);

    // Folder context via safe parent traversal
    const folder = getParentFolderName(pm);

    let pkStr = '';
    let lineaStr = '';

    // Check ExtendedData / SimpleData attributes
    const simpleDataNodes = pm.getElementsByTagName('SimpleData');
    for (let i = 0; i < simpleDataNodes.length; i++) {
      const node = simpleDataNodes[i];
      const attrName = (node.getAttribute('name') || '').toLowerCase();
      const val = getNodeText(node);
      if (!val) continue;

      if (!pkStr && (attrName === 'pk' || attrName.includes('punto') || attrName.includes('kilom'))) {
        pkStr = val;
      }
      if (!lineaStr && (attrName === 'linea' || attrName === 'linia' || attrName === 'line' || attrName.includes('tramo'))) {
        lineaStr = val;
      }
    }

    // Check Data nodes with <value>
    const dataNodes = pm.getElementsByTagName('Data');
    for (let i = 0; i < dataNodes.length; i++) {
      const node = dataNodes[i];
      const attrName = (node.getAttribute('name') || '').toLowerCase();
      const valNodes = node.getElementsByTagName('value');
      const val = valNodes.length > 0 ? getNodeText(valNodes[0]) : '';
      if (!val) continue;

      if (!pkStr && (attrName === 'pk' || attrName.includes('punto') || attrName.includes('kilom'))) {
        pkStr = val;
      }
      if (!lineaStr && (attrName === 'linea' || attrName === 'linia' || attrName === 'line' || attrName.includes('tramo'))) {
        lineaStr = val;
      }
    }

    // Fallback extraction from name & description
    if (!pkStr) {
      const pkMatch = name.match(/PK\s*[:\.]?\s*(\d+[+\.]\d+|\d+)/i) || 
                      rawDescription.match(/PK\s*[:\.]?\s*(\d+[+\.]\d+|\d+)/i) ||
                      name.match(/(\d+\+\d+)/);
      if (pkMatch) pkStr = pkMatch[1];
    }

    if (!lineaStr) {
      const lineMatch = name.match(/L[íi]nea\s*(\d+|[A-Z0-9]+)/i) ||
                        rawDescription.match(/L[íi]nea\s*(\d+|[A-Z0-9]+)/i) ||
                        folder.match(/L[íi]nea\s*(\d+|[A-Z0-9]+)/i);
      if (lineMatch) lineaStr = lineMatch[1];
      else if (folder) lineaStr = folder;
    }

    // Coordinates extraction: handle multiple spaces, commas, gx:coord
    let lat: number | null = null;
    let lon: number | null = null;
    let alt: number | undefined = undefined;

    const coordinatesNodes = pm.getElementsByTagName('coordinates');
    if (coordinatesNodes.length > 0 && coordinatesNodes[0].textContent) {
      // Clean up whitespace around commas: "1.23, 4.56, 0" -> "1.23,4.56,0"
      const cleanCoords = coordinatesNodes[0].textContent.replace(/\s*,\s*/g, ',').trim();
      const coordTuples = cleanCoords.split(/\s+/);
      if (coordTuples.length > 0) {
        const parts = coordTuples[0].split(',');
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

    // Fallback to <gx:coord> if standard coordinates not found
    if (lat === null || lon === null) {
      const gxNodes = pm.getElementsByTagName('coord');
      if (gxNodes.length > 0 && gxNodes[0].textContent) {
        const parts = gxNodes[0].textContent.trim().split(/\s+/);
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
      points.push({
        id: `pk-${index + 1}-${Math.floor(Math.abs(lat) * 10000)}`,
        name,
        pk: pkStr,
        linea: lineaStr,
        description,
        latitude: lat,
        longitude: lon,
        altitude: alt,
        folder: folder || undefined
      });
    }
  });

  // If DOMParser produced 0 points but file has content, try regex parser as backup
  if (points.length === 0 && rawKmlText.includes('Placemark')) {
    return parseKmlWithRegex(rawKmlText);
  }

  return points;
}

/**
 * Parses a File or Blob that is either .kmz (zipped) or .kml (plain XML)
 */
export async function parseKmzOrKmlFile(file: File | Blob, filenameHint?: string): Promise<PkPoint[]> {
  const fileName = (filenameHint || (file instanceof File ? file.name : 'puntos.kmz')).toLowerCase();
  const isKmz = fileName.endsWith('.kmz') || (!fileName.endsWith('.kml') && !fileName.endsWith('.xml'));

  if (isKmz) {
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);

      // Look for all .kml or .xml files inside (excluding directories)
      const kmlFileNames = Object.keys(loadedZip.files).filter(name => {
        const lower = name.toLowerCase();
        return (lower.endsWith('.kml') || lower.endsWith('.xml')) && !loadedZip.files[name].dir;
      });

      if (kmlFileNames.length > 0) {
        let allPoints: PkPoint[] = [];
        for (const kmlName of kmlFileNames) {
          const kmlText = await loadedZip.files[kmlName].async('string');
          const pts = parseKmlText(kmlText);
          allPoints = allPoints.concat(pts);
        }

        if (allPoints.length > 0) {
          return allPoints;
        }
      }

      // If no file ending in .kml or .xml found, inspect any text file in zip
      const allFileNames = Object.keys(loadedZip.files).filter(n => !loadedZip.files[n].dir);
      for (const name of allFileNames) {
        try {
          const content = await loadedZip.files[name].async('string');
          if (content.includes('Placemark') || content.includes('<kml')) {
            const pts = parseKmlText(content);
            if (pts.length > 0) {
              return pts;
            }
          }
        } catch {}
      }
    } catch (zipErr) {
      console.warn('JSZip could not unpack archive, attempting plain text fallback:', zipErr);
      // The file might be a plain KML file that was named .kmz
      try {
        const text = await file.text();
        if (text.includes('Placemark') || text.includes('<kml')) {
          const pts = parseKmlText(text);
          if (pts.length > 0) return pts;
        }
      } catch {}
    }
  }

  // Plain KML / XML text parsing
  const text = await file.text();
  const pts = parseKmlText(text);
  if (pts.length === 0) {
    // Try regex fallback directly
    return parseKmlWithRegex(text);
  }
  return pts;
}
