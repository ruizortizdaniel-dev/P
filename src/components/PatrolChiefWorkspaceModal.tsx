import React, { useState, useEffect } from 'react';
import { 
  X, 
  Folder, 
  Mail, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  Table, 
  FileCheck, 
  File, 
  User, 
  LogOut, 
  AlertCircle,
  Copy,
  Check,
  Shield,
  Layers
} from 'lucide-react';
import { 
  googleSignIn, 
  googleLogout, 
  getAccessToken, 
  fetchDriveFiles, 
  fetchGmailMessages, 
  DriveFile, 
  GmailMessageItem 
} from '../services/googleWorkspace';

interface PatrolChiefWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdminEmail?: string;
}

export const PatrolChiefWorkspaceModal: React.FC<PatrolChiefWorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentAdminEmail
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'gmail'>('drive');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [connectedUserEmail, setConnectedUserEmail] = useState<string | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFilter, setDriveFilter] = useState<'all' | 'sheets' | 'docs' | 'pdf'>('all');

  // Gmail state
  const [gmailMessages, setGmailMessages] = useState<GmailMessageItem[]>([]);
  const [gmailSearch, setGmailSearch] = useState('');
  const [gmailLoading, setGmailLoading] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check token on open
  useEffect(() => {
    if (!isOpen) return;

    getAccessToken().then(token => {
      if (token) {
        setIsConnected(true);
        loadDriveData();
      } else {
        setIsConnected(false);
      }
    });
  }, [isOpen]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setIsConnected(true);
        setConnectedUserEmail(res.user.email || null);
        loadDriveData();
      } else {
        // User closed or cancelled popup window
        setErrorMsg(null);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setErrorMsg(null);
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('El navegador ha bloqueado la ventana emergente. Por favor, permite las ventanas emergentes en esta página para continuar.');
        return;
      }
      console.warn('Google Sign In notice:', err?.message || err);
      setErrorMsg(err?.message || 'No se pudo iniciar sesión. Vuelve a intentarlo.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setIsConnected(false);
    setConnectedUserEmail(null);
    setDriveFiles([]);
    setGmailMessages([]);
  };

  const loadDriveData = async (query?: string) => {
    setDriveLoading(true);
    setErrorMsg(null);
    try {
      const files = await fetchDriveFiles(query !== undefined ? query : driveSearch);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Drive fetch error:', err);
      setErrorMsg(err.message || 'Error al cargar archivos de Google Drive');
    } finally {
      setDriveLoading(false);
    }
  };

  const loadGmailData = async (query?: string) => {
    setGmailLoading(true);
    setErrorMsg(null);
    try {
      const messages = await fetchGmailMessages(query !== undefined ? query : gmailSearch);
      setGmailMessages(messages);
    } catch (err: any) {
      console.error('Gmail fetch error:', err);
      setErrorMsg(err.message || 'Error al cargar mensajes de Gmail');
    } finally {
      setGmailLoading(false);
    }
  };

  const handleTabChange = (tab: 'drive' | 'gmail') => {
    setActiveTab(tab);
    if (!isConnected) return;
    if (tab === 'drive' && driveFiles.length === 0) {
      loadDriveData();
    } else if (tab === 'gmail' && gmailMessages.length === 0) {
      loadGmailData();
    }
  };

  const copyFileLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const b = parseInt(bytes, 10);
    if (isNaN(b)) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
      return <Table className="w-5 h-5 text-emerald-600" />;
    }
    if (mimeType.includes('document') || mimeType.includes('word')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileCheck className="w-5 h-5 text-rose-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  // Filter drive files by category
  const filteredDriveFiles = driveFiles.filter(f => {
    if (driveFilter === 'sheets') {
      return f.mimeType.includes('spreadsheet') || f.mimeType.includes('excel') || f.mimeType.includes('csv');
    }
    if (driveFilter === 'docs') {
      return f.mimeType.includes('document') || f.mimeType.includes('word') || f.mimeType.includes('text');
    }
    if (driveFilter === 'pdf') {
      return f.mimeType.includes('pdf');
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold">
                  Google Workspace — Jefatura de Patrulla
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isConnected 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  {isConnected ? 'Cuenta Conectada' : 'Requiere Conexión'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Acceso oficial a archivos de Google Drive y comunicados de Gmail para jefes de patrulla ADIF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Bar / Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => handleTabChange('drive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'drive'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Google Drive ({driveFiles.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('gmail')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'gmail'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Gmail Jefatura ({gmailMessages.length})</span>
            </button>
          </div>

          {/* Connection status badge / Disconnect button */}
          {isConnected && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-xs text-slate-700 shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-semibold">{connectedUserEmail || currentAdminEmail || 'Google Conectado'}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Desconectar cuenta de Google"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desconectar</span>
              </button>
            </div>
          )}
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* If NOT connected: Show Google Sign-in prompt */}
          {!isConnected ? (
            <div className="py-12 px-4 max-w-lg mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Conectar cuenta de Google (Jefes de Patrulla)
              </h3>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Inicia sesión con la cuenta de Google autorizada de jefatura de patrulla para consultar cuadrantes en Drive, actas de servicio y correos de Gmail con permiso de usuario.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Official Google Material Sign-In Button */}
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isLoggingIn ? 'Conectando con Google...' : 'Iniciar sesión con Google'}</span>
              </button>
            </div>
          ) : activeTab === 'drive' ? (
            /* GOOGLE DRIVE VIEW */
            <div className="space-y-4">
              {/* Drive Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar archivos por nombre (ej: Cuadrante, Octubre, ADIF)..."
                    value={driveSearch}
                    onChange={e => setDriveSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadDriveData(driveSearch)}
                    className="w-full text-xs font-semibold pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {driveSearch && (
                    <button
                      onClick={() => {
                        setDriveSearch('');
                        loadDriveData('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setDriveFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      driveFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setDriveFilter('sheets')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      driveFilter === 'sheets' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Hojas / Cuadrantes
                  </button>
                  <button
                    onClick={() => setDriveFilter('docs')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      driveFilter === 'docs' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Documentos
                  </button>
                  <button
                    onClick={() => setDriveFilter('pdf')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      driveFilter === 'pdf' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    PDFs
                  </button>

                  <button
                    onClick={() => loadDriveData()}
                    disabled={driveLoading}
                    title="Actualizar lista de archivos"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${driveLoading ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Files Grid / List */}
              {driveLoading ? (
                <div className="py-16 text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-2" />
                  <p className="text-xs font-semibold">Cargando archivos de Google Drive...</p>
                </div>
              ) : filteredDriveFiles.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Folder className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No se encontraron archivos en Google Drive</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Comprueba el término de búsqueda o asegúrate de que la cuenta tenga archivos compartidos.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredDriveFiles.map(file => (
                    <div
                      key={file.id}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              <span>Modificado: {new Date(file.modifiedTime).toLocaleDateString('es-ES')}</span>
                              {file.size && <span>• {formatFileSize(file.size)}</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <span>Abrir en Drive</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => copyFileLink(file.webViewLink, file.id)}
                          title="Copiar enlace para compartir con la patrulla"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          {copiedId === file.id ? (
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
          ) : (
            /* GMAIL VIEW */
            <div className="space-y-4">
              {/* Gmail Toolbar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar comunicados por asunto o remitente..."
                    value={gmailSearch}
                    onChange={e => setGmailSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadGmailData(gmailSearch)}
                    className="w-full text-xs font-semibold pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {gmailSearch && (
                    <button
                      onClick={() => {
                        setGmailSearch('');
                        loadGmailData('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => loadGmailData()}
                  disabled={gmailLoading}
                  title="Actualizar correos"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gmailLoading ? 'animate-spin text-blue-600' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
              </div>

              {/* Messages List */}
              {gmailLoading ? (
                <div className="py-16 text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-2" />
                  <p className="text-xs font-semibold">Cargando comunicados oficiales de Gmail...</p>
                </div>
              ) : gmailMessages.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Mail className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No se encontraron correos en la bandeja de entrada</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Prueba buscando por palabras clave (ej: "cuadrante", "adif", "patrulla").
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {gmailMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {msg.subject}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5 truncate">
                          De: <span className="text-slate-800">{msg.from}</span>
                        </div>
                        {msg.snippet && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {msg.snippet}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] text-slate-400">
                          {msg.date ? new Date(msg.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                        <a
                          href={`https://mail.google.com/mail/u/0/#inbox/${msg.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <span>Ver correo</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-3 px-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Seguridad ADIF:</span>
            <span>La conexión utiliza las credenciales oficiales de Google Workspace con permisos exclusivos de lectura.</span>
          </div>
          <span className="font-mono text-[10px]">ILUNION SEGURIDAD - ADIF BARCELONA</span>
        </div>
      </div>
    </div>
  );
};
