import { PkPoint } from './kmzParser';

/**
 * Extracts a numeric kilometer value from a string (e.g., "PK 42+800" -> 42.8, "652+300" -> 652.3, "42" -> 42.0)
 */
export function extractNumericPk(str: string): number | null {
  if (!str) return null;
  
  // Format: 42+800 or 42+80 or 42+8
  const plusMatch = str.match(/(\d+)\s*\+\s*(\d+)/);
  if (plusMatch) {
    const km = parseInt(plusMatch[1], 10);
    const rawMeters = plusMatch[2];
    // Pad or truncate to 3 decimals (meters)
    let meters = 0;
    if (rawMeters.length === 1) meters = parseInt(rawMeters, 10) * 100;
    else if (rawMeters.length === 2) meters = parseInt(rawMeters, 10) * 10;
    else meters = parseInt(rawMeters.substring(0, 3), 10);

    return km + meters / 1000;
  }

  // Format: "PK 42.8" or "PK: 42" or "42.800"
  const pkMatch = str.match(/(?:pk|p\.k\.|punto)?\s*[:\.]?\s*(\d+(?:[.,]\d+)?)/i);
  if (pkMatch) {
    const val = parseFloat(pkMatch[1].replace(',', '.'));
    if (!isNaN(val)) return val;
  }

  // Plain number
  const numMatch = str.trim().match(/^(\d+(?:[.,]\d+)?)$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1].replace(',', '.'));
    if (!isNaN(val)) return val;
  }

  return null;
}

/**
 * Formats difference between target PK and point PK in human readable format
 * e.g. "+200 metros (más adelante)" or "-350 metros (más atrás)"
 */
export function formatPkDifference(targetKm: number, candidateKm: number): { text: string; meters: number; isAhead: boolean } {
  const diffKm = candidateKm - targetKm;
  const meters = Math.round(Math.abs(diffKm) * 1000);
  const isAhead = diffKm > 0;

  if (meters === 0) {
    return { text: 'PK Exacto', meters: 0, isAhead: false };
  }

  const text = isAhead 
    ? `+${meters} m (dirección creciente)` 
    : `-${meters} m (dirección decreciente)`;

  return { text, meters, isAhead };
}

/**
 * Finds the closest PK points by kilometer value
 */
export function findClosestPkPoints(
  points: PkPoint[],
  targetKm: number,
  selectedLine?: string,
  limit: number = 6
): Array<{ point: PkPoint; diffText: string; diffMeters: number }> {
  const lineFiltered = selectedLine && selectedLine !== 'all'
    ? points.filter(p => p.linea === selectedLine || p.folder === selectedLine)
    : points;

  const validCandidates: Array<{ point: PkPoint; candidateKm: number }> = [];

  lineFiltered.forEach(p => {
    const pkNum = extractNumericPk(p.pk || p.name);
    if (pkNum !== null) {
      validCandidates.push({ point: p, candidateKm: pkNum });
    }
  });

  if (validCandidates.length === 0) return [];

  // Sort by absolute distance to targetKm
  validCandidates.sort((a, b) => {
    const diffA = Math.abs(a.candidateKm - targetKm);
    const diffB = Math.abs(b.candidateKm - targetKm);
    return diffA - diffB;
  });

  return validCandidates.slice(0, limit).map(c => {
    const diff = formatPkDifference(targetKm, c.candidateKm);
    return {
      point: c.point,
      diffText: diff.text,
      diffMeters: diff.meters
    };
  });
}

/**
 * Haversine formula to calculate distance in meters between two GPS coordinates
 */
export function calculateGpsDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Basic fuzzy string matching score (0 to 1)
 */
function stringSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  if (b.includes(a)) return 0.85;

  // Dice coefficient on bigrams
  const getBigrams = (str: string) => {
    const s = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      s.add(str.substring(i, i + 2));
    }
    return s;
  };

  const b1 = getBigrams(a);
  const b2 = getBigrams(b);
  let intersection = 0;
  b1.forEach(bg => {
    if (b2.has(bg)) intersection++;
  });

  const total = b1.size + b2.size;
  return total > 0 ? (2.0 * intersection) / total : 0;
}

/**
 * Finds closest text matches for typo tolerance
 */
export function findClosestTextMatches(
  points: PkPoint[],
  searchTerm: string,
  limit: number = 6
): PkPoint[] {
  const term = searchTerm.trim().toLowerCase();
  if (term.length < 3) return [];

  const scored = points.map(p => {
    const scoreName = stringSimilarity(term, p.name);
    const scoreDesc = stringSimilarity(term, p.description || '');
    const maxScore = Math.max(scoreName, scoreDesc);
    return { point: p, score: maxScore };
  });

  return scored
    .filter(s => s.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.point);
}
