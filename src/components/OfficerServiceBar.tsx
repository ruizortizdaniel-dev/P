import React, { useMemo } from 'react';
import { 
  User, 
  Users, 
  Layers, 
  Compass, 
  AlertTriangle, 
  MessageSquare, 
  Printer, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Lock,
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { AppUser, ViewMode, Officer, ShiftAssignment, Patrol } from '../types/quadrant';
import { DayInfo } from '../utils/dateUtils';
import { SHIFT_DEFINITIONS } from '../data/initialData';

interface OfficerServiceBarProps {
  currentUser: AppUser;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeOfficerId: string;
  onSelectOfficerForView: (officerId: string) => void;
  officers: Officer[];
  assignments: ShiftAssignment[];
  days: DayInfo[];
  month: number;
  year: number;
  monthName: string;
  incidentsCount: number;
  onlineCount: number;
  onOpenPkFinder: () => void;
  onOpenIncidents: () => void;
  onOpenChat: () => void;
  onOpenDictionary: () => void;
  onDownloadPdf: () => void;
  patrols: Patrol[];
}

export const OfficerServiceBar: React.FC<OfficerServiceBarProps> = ({
  currentUser,
  currentView,
  onViewChange,
  activeOfficerId,
  onSelectOfficerForView,
  officers,
  assignments,
  days,
  month,
  year,
  monthName,
  incidentsCount,
  onlineCount,
  onOpenPkFinder,
  onOpenIncidents,
  onOpenChat,
  onOpenDictionary,
  onDownloadPdf,
  patrols
}) => {
  // Find linked officer profile
  const linkedOfficer = useMemo(() => {
    if (currentUser.officerId) {
      const found = officers.find(o => o.id === currentUser.officerId);
      if (found) return found;
    }
    if (currentUser.email) {
      const found = officers.find(
        o => o.email && o.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (found) return found;
    }
    if (currentUser.badgeNumber) {
      const found = officers.find(o => o.badgeNumber === currentUser.badgeNumber);
      if (found) return found;
    }
    // Fallback: match name
    const namePart = currentUser.name.split(' ')[0].toLowerCase();
    return officers.find(o => o.name.toLowerCase().includes(namePart)) || officers[0];
  }, [currentUser, officers]);

  const assignedPatrol = useMemo(() => {
    if (!linkedOfficer) return null;
    return patrols.find(p => p.id === linkedOfficer.defaultPatrolId) || patrols[0];
  }, [linkedOfficer, patrols]);

  // Compute this officer's personal monthly stats
  const personalStats = useMemo(() => {
    if (!linkedOfficer) return { totalHours: 0, workDaysCount: 0, todayShift: null };

    const officerAssignments = assignments.filter(
      a => a.officerId === linkedOfficer.id && a.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
    );

    let totalHours = 0;
    let workDaysCount = 0;

    officerAssignments.forEach(asg => {
      const def = SHIFT_DEFINITIONS[asg.shiftCode];
      if (def?.isWorkShift) {
        totalHours += asg.hours || def.hours || 0;
        workDaysCount += 1;
      } else if (asg.shiftCode === 'V') {
        totalHours += 5.2; // 5.2h standard vacation day
      }
    });

    // Check today's shift
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayAsg = officerAssignments.find(a => a.date === todayStr);

    let todayShift: string | null = null;
    if (todayAsg) {
      const def = SHIFT_DEFINITIONS[todayAsg.shiftCode];
      todayShift = `${def?.name || todayAsg.shiftCode} (${todayAsg.startTime} - ${todayAsg.endTime})`;
    }

    return { totalHours, workDaysCount, todayShift };
  }, [linkedOfficer, assignments, year, month]);

  const isViewingMyOwnQuadrant = 
    currentView === 'individual' && linkedOfficer && activeOfficerId === linkedOfficer.id;

  const handleGoToMyQuadrant = () => {
    if (linkedOfficer) {
      onSelectOfficerForView(linkedOfficer.id);
    }
    onViewChange('individual');
  };

  return (
    <div className="bg-white border-b border-slate-300 shadow-xs mb-4">
      {/* Upper Bar: Officer Profile & Status */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
            {linkedOfficer?.badgeNumber?.slice(-3) || 'VIG'}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 leading-tight">
                {linkedOfficer ? linkedOfficer.name : currentUser.name}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                TIP {linkedOfficer?.badgeNumber || currentUser.badgeNumber || '101.653'}
              </span>
              {assignedPatrol && (
                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {assignedPatrol.name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-0.5">
              <span>ILUNION Seguridad · Servicio ADIF Barcelona</span>
              <span className="hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Servicio Conectado
              </span>
            </div>
          </div>
        </div>

        {/* Quick Month Metrics for the Officer */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 px-3 self-start md:self-auto">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-600 font-medium">Horas mes:</span>
            <span className="font-mono font-extrabold text-slate-900 text-sm">
              {personalStats.totalHours.toFixed(1).replace('.', ',')}h
            </span>
          </div>

          <div className="hidden sm:block text-slate-300">|</div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-600 font-medium">Turnos:</span>
            <span className="font-mono font-extrabold text-slate-900">
              {personalStats.workDaysCount} días
            </span>
          </div>

          <div className="hidden sm:block text-slate-300">|</div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
            <Lock className="w-3 h-3 text-emerald-700" />
            <span>Solo Lectura</span>
          </div>
        </div>
      </div>

      {/* Lower Bar: Simple, Intuitive Sub-Menu for Non-Admin */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between gap-3 min-w-max">
          {/* Main Action Tabs */}
          <div className="flex items-center gap-1.5">
            {/* 1. MI CUADRANTE PERSONAL (DIRECT TO THIS OFFICER) */}
            <button
              onClick={handleGoToMyQuadrant}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                isViewingMyOwnQuadrant
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Ver mi cuadrante individual oficial consolidado"
            >
              <User className="w-4 h-4" />
              <span>Mi Cuadrante Personal</span>
              {isViewingMyOwnQuadrant && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              )}
            </button>

            {/* 2. VER CUADRANTE POR PATRULLA */}
            <button
              onClick={() => onViewChange('patrol')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'patrol'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
              title="Consultar los cuadrantes oficiales de las 4 patrullas de servicio"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Ver por Patrullas</span>
            </button>

            {/* 3. VER MATRIZ GLOBAL */}
            <button
              onClick={() => onViewChange('global')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'global'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
              title="Consultar la matriz global de todo el personal"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Matriz Global</span>
            </button>

            <span className="h-5 w-px bg-slate-200 mx-1"></span>

            {/* 4. BUSCADOR DE PK (KMZ) */}
            <button
              onClick={onOpenPkFinder}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Buscador de Puntos Kilométricos ferroviarios con archivo KMZ, navegación GPS a Waze / Maps"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Buscador PK (KMZ)</span>
            </button>

            {/* 5. APARTADO DE INCIDENCIAS */}
            <button
              onClick={onOpenIncidents}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 transition-colors shadow-2xs"
              title="Registrar o consultar novedades e incidencias de seguridad en vía"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Incidencias</span>
              {incidentsCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                  {incidentsCount}
                </span>
              )}
            </button>

            {/* 6. CHAT OPERATIVO */}
            <button
              onClick={onOpenChat}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-800 border border-slate-300 hover:bg-slate-100 transition-colors shadow-2xs"
              title="Chat online con los miembros de dotación y mandos"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Chat de Servicio</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                {onlineCount}
              </span>
            </button>

            {/* 7. DICCIONARIO FERROVIARIO ADIF (IA) */}
            <button
              onClick={onOpenDictionary}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-900 border border-teal-300 hover:bg-teal-100 transition-colors shadow-2xs"
              title="Consultar Diccionario Ferroviario Oficial de ADIF y preguntar a la IA"
            >
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>Diccionario ADIF</span>
              <span className="bg-teal-200/80 text-teal-900 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-teal-700" />
                <span>IA</span>
              </span>
            </button>
          </div>

          {/* Right Action: Download My PDF */}
          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Descargar cuadrante en formato oficial PDF A4 Apaisado"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Descargar Mi PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
