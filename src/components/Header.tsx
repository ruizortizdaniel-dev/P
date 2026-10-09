import React from 'react';
import { ViewMode, AppUser } from '../types/quadrant';
import { 
  AlertTriangle, 
  Printer, 
  MessageSquare, 
  History, 
  LogOut, 
  AppWindow, 
  Compass, 
  Folder, 
  Users,
  Shield,
  Eye,
  Lock,
  User,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { downloadOfficialPdf } from '../utils/exportPdf';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  conflictCount: number;
  onOpenConflictsModal: () => void;
  onOpenQuickFill: () => void;
  onOpenExport: () => void;
  onResetData: () => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenAuditLogs: () => void;
  onOpenInstallModal: () => void;
  onOpenPkFinder: () => void;
  onOpenWorkspace: () => void;
  onOpenOfficerDirectory?: () => void;
  onOpenIncidents: () => void;
  onOpenDictionary: () => void;
  incidentsCount?: number;
  officersCount?: number;
  onlineCount: number;
  auditCount: number;
  isSimulatingOfficer?: boolean;
  onToggleSimulateOfficer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  conflictCount,
  onOpenConflictsModal,
  currentUser,
  onLogout,
  onOpenChat,
  onOpenAuditLogs,
  onOpenInstallModal,
  onOpenPkFinder,
  onOpenWorkspace,
  onOpenOfficerDirectory,
  onOpenIncidents,
  onOpenDictionary,
  incidentsCount = 0,
  officersCount,
  onlineCount,
  auditCount,
  isSimulatingOfficer = false,
  onToggleSimulateOfficer
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const isAdmin = currentUser?.isAdmin && !isSimulatingOfficer;

  const handleHeaderPrint = async () => {
    const officerParam = currentUser?.officerId || 'of-ruiz-ortiz';
    const endpoint = currentView === 'individual' 
      ? `/api/pdf/officer/${officerParam}?month=10&year=2026`
      : '/api/pdf/patrol/p1?month=10&year=2026';
    const filename = currentView === 'individual' 
      ? `Cuadrante_Individual_${currentUser?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'ADIF'}_Octubre_2026.pdf`
      : 'Cuadrante_Oficial_Patrulla_Barcelona_I_Octubre_2026.pdf';
    
    await downloadOfficialPdf(endpoint, filename, setIsExporting);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-300 shadow-2xs">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Zone 1: Branding & Role Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onViewChange('patrol'); }}
            className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-2"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs tracking-tighter ${
              isAdmin ? 'bg-blue-700' : 'bg-emerald-700'
            }`}>
              ADIF
            </div>
            <div className="hidden md:block leading-tight text-left">
              <div className="text-xs font-bold text-slate-900">Patrullas Barcelona</div>
              <div className="text-[10px] text-slate-500 font-medium">ILUNION Seguridad</div>
            </div>
          </a>

          {/* Mode indicator badge */}
          {!isAdmin ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Modo Consulta (Solo Lectura)</span>
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              <Shield className="w-3 h-3 text-blue-600" />
              <span>Modo Jefatura / Admin</span>
            </span>
          )}
        </div>

        {/* Zone 2: Quadrant View Selectors (Accessible to ALL users, Read-Only for non-admin) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => onViewChange('patrol')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              currentView === 'patrol'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Por Patrulla
          </button>

          <button
            onClick={() => onViewChange('individual')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              currentView === 'individual'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isAdmin ? 'Por Vigilante' : 'Mi Cuadrante / Vigilantes'}
          </button>

          <button
            onClick={() => onViewChange('global')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              currentView === 'global'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Matriz Global
          </button>

          {/* Overlap conflicts button: visible to admins, or quiet notification */}
          {isAdmin && (
            <button
              onClick={onOpenConflictsModal}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                conflictCount > 0
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${conflictCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden lg:inline">Solapamientos</span>
              {conflictCount > 0 && (
                <span className="font-mono tabular-nums bg-rose-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                  {conflictCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: Actions Menu (Filtered based on user role) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 0. DICCIONARIO FERROVIARIO ADIF (IA) - ACCESSIBLE TO ALL */}
          <button
            onClick={onOpenDictionary}
            title="Diccionario Ferroviario Oficial de ADIF con Asistente IA Gemini (https://www.adif.es/comunicacion/diccionario-ferroviario#f)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-300 rounded-lg hover:bg-teal-100 transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden sm:inline">Diccionario ADIF</span>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-200/80 px-1 rounded flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-teal-700" />
              <span>IA</span>
            </span>
          </button>

          {/* 1. BUSCADOR PK (KMZ) - ACCESSIBLE TO ALL */}
          <button
            onClick={onOpenPkFinder}
            title="Buscador de Puntos Kilométricos (PK) en vía y envío a Google Maps / Waze"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Puntos PK</span>
          </button>

          {/* 2. APARTADO DE INCIDENCIAS - ACCESSIBLE TO ALL */}
          <button
            onClick={onOpenIncidents}
            title="Libro de Incidencias y Novedades de Seguridad en Vía"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-rose-900 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors shadow-2xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Incidencias</span>
            {incidentsCount > 0 && (
              <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-200/80 px-1 rounded">
                {incidentsCount}
              </span>
            )}
          </button>

          {/* 3. CHAT OPERATIVO EN TIEMPO REAL - ACCESSIBLE TO ALL */}
          <button
            onClick={onOpenChat}
            title="Chat operativo online con compañeros y administradores"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Chat</span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1 rounded font-bold">
              {onlineCount}
            </span>
          </button>

          {/* ADMIN-ONLY FEATURES */}
          {isAdmin && (
            <>
              {/* Audit Logs button */}
              <button
                onClick={onOpenAuditLogs}
                title="Historial de cambios y auditoría (revertir errores)"
                className="hidden xl:flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>Auditoría</span>
                {auditCount > 0 && (
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-200 px-1 rounded">
                    {auditCount}
                  </span>
                )}
              </button>

              {/* Fichas de Personal de Administración button */}
              <button
                onClick={onOpenOfficerDirectory}
                title="Fichas de personal completas (teléfonos, emails y envíos)"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Fichas</span>
                {officersCount !== undefined && (
                  <span className="text-[10px] font-mono text-indigo-800 bg-indigo-200/80 px-1 rounded font-bold">
                    {officersCount}
                  </span>
                )}
              </button>

              {/* Google Workspace: Drive & Gmail Jefatura button */}
              <button
                onClick={onOpenWorkspace}
                title="Google Drive y Gmail de Jefes de Patrulla"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs"
              >
                <Folder className="w-3.5 h-3.5 text-blue-600" />
                <span>Drive & Correo</span>
              </button>
            </>
          )}

          {/* Direct Print to PDF in Official Format */}
          <button
            onClick={handleHeaderPrint}
            title="Descargar e imprimir informe oficial en formato PDF A4 Apaisado"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Toggle Simulator (Allows Admin to test Non-Admin mode effortlessly) */}
          {currentUser?.isAdmin && onToggleSimulateOfficer && (
            <button
              onClick={onToggleSimulateOfficer}
              title={isSimulatingOfficer ? "Volver a modo Administrador" : "Probar vista como Vigilante (no administrador)"}
              className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 ${
                isSimulatingOfficer 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden xl:inline">{isSimulatingOfficer ? 'Modo Vigilante' : 'Simular Vigilante'}</span>
            </button>
          )}

          {/* Logged in User Profile / Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 border-l border-slate-200">
              <div 
                title={`Conectado como: ${currentUser.name} (${currentUser.email}) - ${currentUser.role}`}
                className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-300"
              >
                <div className={`w-6 h-6 rounded-full text-white font-black text-[10px] flex items-center justify-center ${
                  isAdmin ? 'bg-blue-700' : 'bg-emerald-700'
                }`}>
                  {getInitials(currentUser.name)}
                </div>
                <div className="hidden md:block text-left leading-none">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[9px] text-slate-500 truncate max-w-[110px]">
                    {isAdmin ? 'Admin' : (currentUser.badgeNumber ? `TIP ${currentUser.badgeNumber}` : 'Vigilante')}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
