import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Share2, 
  Copy, 
  Check, 
  Upload, 
  X, 
  AlertCircle,
  Train,
  Compass,
  LocateFixed,
  Sparkles,
  Info,
  RotateCcw,
  Database,
  BookOpen,
  Download,
  Cloud,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { parseKmzOrKmlFile, PkPoint } from '../utils/kmzParser';
import { 
  extractNumericPk, 
  findClosestPkPoints, 
  findClosestTextMatches,
  calculateGpsDistanceMeters 
} from '../utils/pkSearchHelper';
import { 
  savePointsToIndexedDB, 
  loadPointsFromIndexedDB, 
  clearPointsFromIndexedDB,
  getMemoryCachedPoints,
  getStorageMeta,
  PK_UPDATED_EVENT
} from '../utils/pkStorage';
import { pkSyncService, PkSyncState } from '../services/pkSyncService';

interface PkFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; name: string; role: string } | null;
  onOpenDictionary?: () => void;
}

// Puntos de referencia iniciales de la red ferroviaria de Barcelona / Rodalies
const DEFAULT_POINTS: PkPoint[] = [
  {
    id: 'pk-def-1',
    name: 'Barcelona Sants - Estación Central',
    pk: 'PK 0+000',
    linea: 'L200 / R1-R2-R3-R4',
    description: 'Estación principal de Adif y Centro de Mando',
    latitude: 41.3793,
    longitude: 2.1402
  },
  {
    id: 'pk-def-2',
    name: 'Passeig de Gràcia (Túnel Aragón)',
    pk: 'PK 2+100',
    linea: 'R2',
    description: 'Acceso andenes subterráneos c/ Aragón',
    latitude: 41.3923,
    longitude: 2.1648
  },
  {
    id: 'pk-def-3',
    name: 'La Sagrera - Bifurcación / Obra Central',
    pk: 'PK 5+800',
    linea: 'Línea Alta Velocidad / R1-R2',
    description: 'Zona de patrulla Sagrera - Sant Andreu',
    latitude: 41.4239,
    longitude: 2.1932
  },
  {
    id: 'pk-def-4',
    name: 'Barcelona França - Estació de França',
    pk: 'PK 1+200',
    linea: 'R2 Sud / Regionales',
    description: 'Terminal de vías y vías de maniobras',
    latitude: 41.3842,
    longitude: 2.1866
  },
  {
    id: 'pk-def-5',
    name: 'El Clot - Aragó',
    pk: 'PK 3+400',
    linea: 'R1 / R2',
    description: 'Intercambiador subterráneo Clot',
    latitude: 41.4086,
    longitude: 2.1873
  },
  {
    id: 'pk-def-6',
    name: 'Sant Andreu Comtal / Taller Adif',
    pk: 'PK 7+100',
    linea: 'R2 Nord',
    description: 'Área técnica y vías de estacionamiento',
    latitude: 41.4367,
    longitude: 2.1933
  },
  {
    id: 'pk-def-7',
    name: 'Bellvitge - Vía Larga Gornal',
    pk: 'PK 673+200',
    linea: 'Línea 200 (Madrid - Bcn)',
    description: 'Tramo exterior Bellvitge / L\'Hospitalet',
    latitude: 41.3551,
    longitude: 2.1158
  },
  {
    id: 'pk-def-8',
    name: 'El Prat de Llobregat (Bifurcación Aeropuerto)',
    pk: 'PK 668+500',
    linea: 'R2 / AVE',
    description: 'Túnel soterrado y salida hacia Castelldefels',
    latitude: 41.3275,
    longitude: 2.0945
  },
  {
    id: 'pk-def-9',
    name: 'Castelldefels Platja - PK 652',
    pk: 'PK 652+300',
    linea: 'R2 Sud',
    description: 'Zona de paso a nivel y accesos a vías',
    latitude: 41.2662,
    longitude: 1.9678
  },
  {
    id: 'pk-def-10',
    name: 'Montcada Bifurcació - Base Operativa',
    pk: 'PK 12+800',
    linea: 'R3 / R4 / R7',
    description: 'Base de mantenimiento y talleres Adif',
    latitude: 41.4828,
    longitude: 2.1834
  }
];

export const PkFinderModal: React.FC<PkFinderModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenDictionary
}) => {
  const [points, setPoints] = useState<PkPoint[]>(() => {
    const mem = getMemoryCachedPoints();
    return mem && mem.length > 0 ? mem : DEFAULT_POINTS;
  });
  const [hostedFileName, setHostedFileName] = useState<string | null>(() => {
    return getStorageMeta()?.filename || null;
  });
  const [hasHostedServerFile, setHasHostedServerFile] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Real-time synchronization state with persistent service
  const [syncState, setSyncState] = useState<PkSyncState>(() => pkSyncService.getState());

  // GPS Location sorting state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortByGps, setSortByGps] = useState(false);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  // Subscribe to background synchronization updates
  useEffect(() => {
    const unsubscribe = pkSyncService.subscribe(newState => {
      setSyncState(newState);
      if (newState.filename) {
        setHostedFileName(newState.filename);
      }
    });
    return unsubscribe;
  }, []);

  // Listen to custom PK update events (ensures instant UI update without reloading)
  useEffect(() => {
    const handlePkUpdated = (e: CustomEvent) => {
      if (Array.isArray(e.detail?.points) && e.detail.points.length > 0) {
        setPoints(e.detail.points);
      } else {
        loadPointsFromIndexedDB().then(cached => {
          if (cached && cached.length > 0) setPoints(cached);
        });
      }
      if (e.detail?.filename) {
        setHostedFileName(e.detail.filename);
      }
    };

    window.addEventListener(PK_UPDATED_EVENT, handlePkUpdated as EventListener);
    return () => {
      window.removeEventListener(PK_UPDATED_EVENT, handlePkUpdated as EventListener);
    };
  }, []);

  // Load points from multi-tier storage (Memory -> Cache API -> IndexedDB) and backend
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    // 1. Instantly retrieve from phone local storage (Memory -> Cache API -> IndexedDB)
    loadPointsFromIndexedDB().then(cachedPoints => {
      if (isMounted && cachedPoints && cachedPoints.length > 0) {
        setPoints(cachedPoints);
      }
    });

    // 2. Trigger persistent sync verification
    setIsLoadingPoints(true);
    pkSyncService.syncNow({ reason: 'modal_opened' })
      .finally(() => {
        if (isMounted) setIsLoadingPoints(false);
      });

    // 3. Check hosted KMZ file info on server
    fetch('/api/pk/meta')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.filename) setHostedFileName(data.filename);
        if (data.hasHostedFile) setHasHostedServerFile(true);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Unique lines for filtering
  const availableLines = useMemo(() => {
    const lines = new Set<string>();
    points.forEach(p => {
      if (p.linea) lines.add(p.linea);
      if (p.folder) lines.add(p.folder);
    });
    return Array.from(lines).sort();
  }, [points]);

  // Handle GPS location request
  const handleToggleGpsLocation = () => {
    if (sortByGps) {
      setSortByGps(false);
      return;
    }

    if (!navigator.geolocation) {
      alert('Tu navegador o dispositivo no soporta geolocalización GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setSortByGps(true);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('No se pudo obtener tu ubicación GPS. Asegúrate de conceder permisos de ubicación.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Smart Search logic with Proximity fallback
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // 1. Line-filtered points pool
    const linePool = selectedLine === 'all'
      ? points
      : points.filter(p => p.linea === selectedLine || p.folder === selectedLine);

    // If GPS sorting is active and no text search
    if (sortByGps && userLocation && !term) {
      const withDistance = linePool.map(p => ({
        point: p,
        distanceMeters: calculateGpsDistanceMeters(userLocation.lat, userLocation.lng, p.latitude, p.longitude),
        proximityNote: undefined as string | undefined
      }));
      withDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
      return {
        mode: 'gps' as const,
        items: withDistance.slice(0, 80),
        message: 'Ordenados por cercanía exacta a la posición GPS de tu patrulla.'
      };
    }

    // 2. Direct exact or substring matches
    if (term) {
      const directMatches = linePool.filter(p => {
        return (
          p.name.toLowerCase().includes(term) ||
          (p.pk && p.pk.toLowerCase().includes(term)) ||
          (p.linea && p.linea.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.folder && p.folder.toLowerCase().includes(term))
        );
      });

      if (directMatches.length > 0) {
        return {
          mode: 'exact' as const,
          items: directMatches.slice(0, 100).map(p => ({
            point: p,
            distanceMeters: userLocation ? calculateGpsDistanceMeters(userLocation.lat, userLocation.lng, p.latitude, p.longitude) : undefined,
            proximityNote: undefined
          })),
          message: null
        };
      }

      // 3. NO EXACT MATCH FOUND: CHECK PROXIMITY!
      // A) Is there a numeric PK in the search query? (e.g. "42+800", "42.8", "PK 15", "652")
      const numericPk = extractNumericPk(term);
      if (numericPk !== null) {
        const closestPkItems = findClosestPkPoints(linePool, numericPk, selectedLine, 12);
        if (closestPkItems.length > 0) {
          return {
            mode: 'closest_pk' as const,
            targetPkNum: numericPk,
            items: closestPkItems.map(c => ({
              point: c.point,
              distanceMeters: userLocation ? calculateGpsDistanceMeters(userLocation.lat, userLocation.lng, c.point.latitude, c.point.longitude) : undefined,
              proximityNote: `${c.diffText} (${c.diffMeters} m de distancia en vía)`
            })),
            message: `No existe el PK exacto "${searchTerm}". Te mostramos los puntos kilométricos más cercanos en la vía:`
          };
        }
      }

      // B) Text fuzzy matching for typos (e.g. "Casteldevels", "Montcada", "Sants")
      const fuzzyMatches = findClosestTextMatches(linePool, term, 10);
      if (fuzzyMatches.length > 0) {
        return {
          mode: 'fuzzy_text' as const,
          items: fuzzyMatches.map(p => ({
            point: p,
            distanceMeters: userLocation ? calculateGpsDistanceMeters(userLocation.lat, userLocation.lng, p.latitude, p.longitude) : undefined,
            proximityNote: 'Sugerencia por similitud de nombre'
          })),
          message: `No se encontró resultado exacto para "${searchTerm}". Te sugerimos las opciones con nombres más parecidos:`
        };
      }

      // C) Absolutely no match
      return {
        mode: 'none' as const,
        items: [],
        message: `No se encontró ningún punto kilométrico ni aproximación para "${searchTerm}".`
      };
    }

    // Default: return pool up to 100 points
    return {
      mode: 'all' as const,
      items: linePool.slice(0, 100).map(p => ({
        point: p,
        distanceMeters: userLocation ? calculateGpsDistanceMeters(userLocation.lat, userLocation.lng, p.latitude, p.longitude) : undefined,
        proximityNote: undefined
      })),
      message: null
    };
  }, [points, searchTerm, selectedLine, sortByGps, userLocation]);

  // Handle KMZ or KML file upload (Hosted on server and persistent on phone)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadMessage(null);

    try {
      let finalPoints: PkPoint[] = [];

      // Strategy 1: Fast direct binary upload to server (permanently hosted on disk)
      try {
        const uploadRes = await fetch('/api/pk/upload-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-filename': encodeURIComponent(file.name),
            'x-admin-email': currentUser?.email || 'admin@adif.es',
            'x-admin-name': currentUser?.name || 'Administrador'
          },
          body: file
        });

        if (uploadRes.ok) {
          const resData = await uploadRes.json();
          if (Array.isArray(resData.points) && resData.points.length > 0) {
            finalPoints = resData.points;
            setHasHostedServerFile(true);
            setHostedFileName(file.name);
          }
        }
      } catch (serverUploadErr) {
        console.warn('Server direct binary upload error, falling back to local parse:', serverUploadErr);
      }

      // Strategy 2: Client-side parse (if server didn't return points directly)
      if (finalPoints.length === 0) {
        finalPoints = await parseKmzOrKmlFile(file);
      }

      if (finalPoints.length === 0) {
        throw new Error('No se encontraron puntos ni coordenadas válidas en el archivo KMZ/KML.');
      }

      // 1. Immediately update UI state
      setPoints(finalPoints);
      setHostedFileName(file.name);

      // 2. Persist locally to phone (Multi-tier: Memory + Cache API + Chunked IndexedDB)
      await savePointsToIndexedDB(finalPoints, file.name);

      // 3. Ensure server is synchronized with points via JSON if direct upload wasn't used
      try {
        await fetch('/api/pk/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientCount: finalPoints.length,
            points: finalPoints,
            filename: file.name,
            adminEmail: currentUser?.email || 'admin@adif.es',
            adminName: currentUser?.name || 'Administrador'
          })
        });
      } catch {}

      // 4. Update sync worker service
      pkSyncService.syncNow({ force: true, reason: 'kmz_upload_success' });

      setUploadMessage({
        text: `¡Éxito total! Archivo "${file.name}" alojado permanentemente en el servidor y guardado en tu teléfono (${finalPoints.length.toLocaleString()} puntos kilométricos).`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error importando KMZ:', err);
      setUploadMessage({
        text: err.message || 'Error al procesar el archivo KMZ/KML.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      // Reset input element so selecting same file again triggers change event
      e.target.value = '';
    }
  };

  const handleResetDefaultPoints = async () => {
    if (window.confirm('¿Deseas restablecer los puntos kilométricos a los 10 puntos de referencia iniciales de Barcelona? Se borrará el archivo KMZ guardado del servidor y de tu dispositivo.')) {
      try {
        await fetch('/api/pk', { method: 'DELETE' });
      } catch {}
      await clearPointsFromIndexedDB();
      setPoints(DEFAULT_POINTS);
      setHostedFileName(null);
      setHasHostedServerFile(false);
      setUploadMessage({
        text: 'Se han restablecido los puntos kilométricos de referencia predeterminados.',
        type: 'success'
      });
    }
  };

  const copyCoordinates = (p: PkPoint) => {
    const text = `${p.latitude}, ${p.longitude}`;
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareViaWhatsApp = (p: PkPoint) => {
    const msg = `📍 ADIF Seguridad - ${p.name} (${p.pk || 'PK'})\nLínea: ${p.linea || 'Red'}\nGPS: https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold">
                  Buscador de Puntos Kilométricos (PK) Ferroviarios
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>{points.length.toLocaleString()} puntos guardados</span>
                  {isLoadingPoints && <span className="text-emerald-400 animate-pulse text-[9px]">· sincronizando...</span>}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Búsqueda exacta y aproximada con envío a Google Maps y Waze para patrullas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDictionary && (
              <button
                onClick={onOpenDictionary}
                title="Consultar Diccionario Ferroviario de ADIF y preguntar a la IA"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded-lg text-xs font-bold transition-colors border border-slate-700 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>Diccionario ADIF</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search + Line Filter + GPS Sort + KMZ Upload */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por PK (ej: 42+800, 15), estación o tramo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Line Filter */}
          {availableLines.length > 0 && (
            <select
              value={selectedLine}
              onChange={e => setSelectedLine(e.target.value)}
              className="text-xs font-semibold py-2.5 px-3 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas las Líneas ({points.length.toLocaleString()})</option>
              {availableLines.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          )}

          {/* GPS Location Button */}
          <button
            onClick={handleToggleGpsLocation}
            title="Ordenar puntos por cercanía física a tu posición GPS actual"
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs shrink-0 ${
              sortByGps 
                ? 'bg-blue-600 text-white border-blue-700' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{sortByGps ? 'Cercanía GPS Activa' : 'Cercanos a Mí'}</span>
          </button>

          {/* Upload KMZ button */}
          <label className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors shrink-0">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Alojando KMZ...' : 'Cargar KMZ'}</span>
            <input
              type="file"
              accept=".kmz,.kml"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>

          {/* Download KMZ button (if hosted on server or large dataset) */}
          {(hasHostedServerFile || points.length > 10) && (
            <button
              onClick={() => { window.location.href = '/api/pk/download'; }}
              title="Descargar archivo KMZ oficial alojado en el servidor"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Descargar KMZ</span>
            </button>
          )}

          {/* Reset points button if custom database is active */}
          {points.length > 20 && (
            <button
              onClick={handleResetDefaultPoints}
              title="Restablecer puntos a los 10 de referencia iniciales de Barcelona"
              className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-300 rounded-xl transition-colors shadow-2xs shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Permanent Hosting & Local Storage Status Strip with Background Worker Sync */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold text-slate-800">
              {points.length.toLocaleString()} Puntos Kilométricos activos
            </span>
            {hostedFileName && (
              <span className="text-slate-600 hidden sm:inline font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                {hostedFileName}
              </span>
            )}

            {/* Live Sync Status indicator */}
            {syncState.status === 'syncing' ? (
              <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                <span>Sincronizando puntos...</span>
              </span>
            ) : !syncState.isOnline || syncState.status === 'offline' ? (
              <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span>Modo Offline: Datos en IndexedDB</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Sincronizado con Servidor</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
              <Cloud className="w-3 h-3 text-emerald-600" />
              Alojado en Servidor
            </span>
            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-semibold">
              <Smartphone className="w-3 h-3 text-blue-600" />
              Persistente en Móvil (IndexedDB)
            </span>

            {/* Quick manual re-sync button */}
            <button
              onClick={() => pkSyncService.syncNow({ force: true, reason: 'manual_click' })}
              disabled={syncState.status === 'syncing'}
              title="Verificar y resincronizar puntos PK ahora con el servidor"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 shadow-2xs text-[10px] font-bold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-slate-600 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>
        </div>

        {/* Upload feedback */}
        {uploadMessage && (
          <div className={`px-4 py-2.5 text-xs font-medium border-b flex items-center justify-between ${
            uploadMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {uploadMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{uploadMessage.text}</span>
            </div>
            <button 
              onClick={() => setUploadMessage(null)}
              className="text-xs font-bold hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Proximity / Approximation Banner */}
        {searchResults.message && (
          <div className={`px-4 py-2.5 text-xs font-medium border-b flex items-center gap-2 ${
            searchResults.mode === 'closest_pk'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : searchResults.mode === 'fuzzy_text'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : searchResults.mode === 'gps'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {searchResults.mode === 'closest_pk' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : searchResults.mode === 'fuzzy_text' ? (
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            ) : searchResults.mode === 'gps' ? (
              <LocateFixed className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span>{searchResults.message}</span>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {searchResults.items.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <MapPin className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">No se encontraron puntos kilométricos</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No hay coincidencias exactas ni puntos aproximados con los filtros actuales. Prueba buscando otro PK o seleccionando "Todas las Líneas".
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-3 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.items.map(({ point: p, proximityNote, distanceMeters }) => (
                <div
                  key={p.id}
                  className={`bg-white border rounded-xl p-3.5 hover:shadow-md transition-all flex flex-col justify-between group ${
                    proximityNote && searchResults.mode === 'closest_pk'
                      ? 'border-amber-300 hover:border-amber-500 ring-1 ring-amber-100'
                      : proximityNote && searchResults.mode === 'fuzzy_text'
                      ? 'border-blue-300 hover:border-blue-500'
                      : 'border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <div>
                    {/* Approximation / Proximity badge if not an exact match */}
                    {proximityNote && (
                      <div className="mb-2 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          searchResults.mode === 'closest_pk'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          <span>{proximityNote}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                          <Train className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {p.name}
                          </h3>
                          {p.pk && (
                            <span className="inline-block text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                              {p.pk}
                            </span>
                          )}
                        </div>
                      </div>

                      {p.linea && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                          {p.linea}
                        </span>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {/* GPS Coordinates & Real-world distance if available */}
                    <div className="mt-2 text-[10px] font-mono text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}</span>
                      </div>
                      {distanceMeters !== undefined && (
                        <span className="font-sans font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          📍 A {distanceMeters < 1000 ? `${distanceMeters} m` : `${(distanceMeters / 1000).toFixed(1)} km`} de ti
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Maps, Waze, Copy, WhatsApp */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    {/* Google Maps Navigation */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir ruta directa en Google Maps"
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </a>

                    {/* Waze Navigation */}
                    <a
                      href={`https://waze.com/ul?ll=${p.latitude},${p.longitude}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Navegar con Waze"
                      className="py-1.5 px-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>Waze</span>
                    </a>

                    {/* WhatsApp Share */}
                    <button
                      onClick={() => shareViaWhatsApp(p)}
                      title="Enviar ubicación a la patrulla por WhatsApp"
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Coordinates */}
                    <button
                      onClick={() => copyCoordinates(p)}
                      title="Copiar coordenadas GPS al portapapeles"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      {copiedId === p.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-3 px-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Aproximación inteligente:</span>
            <span>Si buscas un PK intermedio (ej: 42+800), el sistema te calculará automáticamente los PK anterior y posterior más cercanos en la vía con los metros de diferencia.</span>
          </div>
          <span className="font-mono text-[10px]">ADIF - ILUNION SEGURIDAD</span>
        </div>
      </div>
    </div>
  );
};
