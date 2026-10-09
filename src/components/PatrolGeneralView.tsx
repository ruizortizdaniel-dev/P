import React, { useState } from 'react';
import { Officer, Patrol, PatrolId, ShiftAssignment, ShiftCode } from '../types/quadrant';
import { SHIFT_DEFINITIONS } from '../data/initialData';
import { DayInfo } from '../utils/dateUtils';
import { getOtherPatrolAssignmentsForDay } from '../utils/conflicts';
import { triggerPrintReport } from '../utils/printReport';
import { downloadOfficialPdf } from '../utils/exportPdf';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  AlertTriangle,
  Printer, 
  SlidersHorizontal,
  Building2,
  Calendar,
  Layers,
  Share2,
  Mail,
  Phone,
  Users,
  FileText,
  UserCheck
} from 'lucide-react';
import { 
  buildOfficerQuadrantShareText, 
  openWhatsApp, 
  openEmail 
} from '../utils/shareQuadrant';

interface PatrolGeneralViewProps {
  patrols: Patrol[];
  activePatrolId: PatrolId;
  onSelectPatrol: (id: PatrolId) => void;
  officers: Officer[];
  assignments: ShiftAssignment[];
  days: DayInfo[];
  year: number;
  month: number;
  monthName: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCellClick: (officer: Officer, dayInfo: DayInfo) => void;
  onQuickShiftSet: (officerId: string, date: string, patrolId: PatrolId, shiftCode: ShiftCode) => void;
  onOpenOfficerDirectory?: () => void;
  onSelectOfficerForView?: (officerId: string) => void;
  isReadOnly?: boolean;
}

export const PatrolGeneralView: React.FC<PatrolGeneralViewProps> = ({
  patrols,
  activePatrolId,
  onSelectPatrol,
  officers,
  assignments,
  days,
  year,
  month,
  monthName,
  onPrevMonth,
  onNextMonth,
  onCellClick,
  onOpenOfficerDirectory,
  onSelectOfficerForView,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScope, setFilterScope] = useState<'squad_only' | 'all'>('squad_only');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const activePatrol = patrols.find(p => p.id === activePatrolId) || patrols[0];

  const handleDownloadPdf = async () => {
    const cleanCode = activePatrol.code.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Cuadrante_Oficial_Patrulla_${cleanCode}_${monthName.replace(/\s+/g, '_')}_${year}.pdf`;
    const endpoint = `/api/pdf/patrol/${activePatrol.id}?month=${month}&year=${year}`;
    await downloadOfficialPdf(endpoint, filename, setIsGeneratingPdf);
  };
  const patrolMap = new Map<string, Patrol>(patrols.map(p => [p.id, p]));

  // Filter officers: By default show officers belonging to this patrol or with any assignment in this patrol
  const filteredOfficers = officers.filter(o => {
    const matchesSearch = 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterScope === 'squad_only') {
      const hasAssignmentInPatrol = assignments.some(
        a => a.officerId === o.id && a.patrolId === activePatrolId
      );
      return o.defaultPatrolId === activePatrolId || hasAssignmentInPatrol;
    }

    return true;
  });

  // Calculate daily patrol coverage totals & hours matching the PDF footer
  const dailyCoverage = days.map(day => {
    const dayAsgs = assignments.filter(
      a => a.date === day.dateStr && a.patrolId === activePatrolId
    );

    const dayHoursTotal = dayAsgs.reduce((sum, a) => sum + (a.hours || 0), 0);
    const dayShiftsCount = dayAsgs.filter(a => {
      const def = SHIFT_DEFINITIONS[a.shiftCode];
      return def && def.isWorkShift;
    }).length;

    // Diurnos: 06-18, 08-20, 07-19, M
    const diurnos = dayAsgs.filter(a => 
      ['06-18', '08-20', '07-19', 'M', 'D'].includes(a.shiftCode)
    ).length;

    // Nocturnos: 18-06, 20-08, N
    const nocturnos = dayAsgs.filter(a => 
      ['18-06', '20-08', 'N'].includes(a.shiftCode)
    ).length;

    return {
      dateStr: day.dateStr,
      dayHoursTotal,
      dayShiftsCount,
      diurnos,
      nocturnos
    };
  });

  const totalPatrolHoursMonth = dailyCoverage.reduce((s, c) => s + c.dayHoursTotal, 0);

  // Exact calculations for the ADIF / ILUNION footer summary box
  // For October 2026: weekends are 3,4, 10,11, 12(Festivo Nacional), 17,18, 24,25, 31
  const isHolidayOrSunday = (dayNumber: number, dayOfWeekIndex: number) => {
    return dayOfWeekIndex === 0 || dayOfWeekIndex === 6 || dayNumber === 12;
  };

  let labDiurHours = 0;
  let labNoctHours = 0;
  let festDiurHours = 0;
  let festNoctHours = 0;

  days.forEach(day => {
    const isFest = isHolidayOrSunday(day.dayNumber, day.dayOfWeekIndex);
    const dayAsgs = assignments.filter(
      a => a.date === day.dateStr && a.patrolId === activePatrolId
    );
    dayAsgs.forEach(asg => {
      const isNight = ['18-06', '20-08', 'N'].includes(asg.shiftCode);
      if (isFest) {
        if (isNight) festNoctHours += asg.hours;
        else festDiurHours += asg.hours;
      } else {
        if (isNight) labNoctHours += asg.hours;
        else labDiurHours += asg.hours;
      }
    });
  });

  return (
    <div className="space-y-4">
      {/* Quick Navigation & Patrol Switcher Bar (Web UI Controls) */}
      <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-2xs no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1 shrink-0">
            Patrulla ADIF:
          </span>
          {patrols.map(p => {
            const isActive = p.id === activePatrolId;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPatrol(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  p.color === 'blue' ? 'bg-blue-500' :
                  p.color === 'emerald' ? 'bg-emerald-500' :
                  p.color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
                }`} />
                <span>{p.code}</span>
                <span className="opacity-75 text-[10px]">({p.name.replace('ADIF - ', '')})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar vigilante o TIP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-500 w-44"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded text-xs border border-slate-300">
            <button
              onClick={() => setFilterScope('squad_only')}
              className={`px-2 py-0.5 rounded font-medium ${
                filterScope === 'squad_only' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Dotación {activePatrol.code}
            </button>
            <button
              onClick={() => setFilterScope('all')}
              className={`px-2 py-0.5 rounded font-medium ${
                filterScope === 'all' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Todos ({officers.length})
            </button>
          </div>

          {/* Share Quadrant with Patrol Officers */}
          {onOpenOfficerDirectory && (
            <button
              onClick={onOpenOfficerDirectory}
              title="Compartir cuadrante oficial por WhatsApp o Email a cada componente de la patrulla"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Compartir con Patrulla</span>
            </button>
          )}

          {/* Fichas Personal button */}
          {onOpenOfficerDirectory && (
            <button
              onClick={onOpenOfficerDirectory}
              title="Directorio de fichas personales y teléfonos/emails de los componentes"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-lg shadow-xs transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Fichas Dotación</span>
            </button>
          )}

          <a
            href={`/api/pdf/patrol/${activePatrol.id}?month=${month}&year=${year}`}
            download={`Cuadrante_Oficial_Patrulla_${activePatrol.code.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}_${year}.pdf`}
            title="Descarga e imprime directamente el cuadrante oficial en formato A4 Apaisado"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Descargar / Imprimir PDF</span>
          </a>
        </div>
      </div>

      {/* ============================================================ */}
      {/* OFFICIAL GRAPHIC QUADRANT SHEET (EXACT REPLICA OF THE PDF)   */}
      {/* ============================================================ */}
      <div id="official-patrol-sheet" className="official-pdf-sheet bg-white border border-slate-400 shadow-md p-4 sm:p-7 text-slate-950 font-sans print:p-0 print:border-none print:shadow-none mx-auto max-w-[1720px]">
        {/* Top date on right */}
        <div className="flex justify-end text-[11px] font-mono text-slate-700 font-semibold mb-1">
          26/09/2026
        </div>

        {/* Big centered underlined title matching PDF */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-center underline uppercase mb-4 decoration-1 underline-offset-4">
          Informe Cuadrante Grafico por Servicio
        </h1>

        {/* Metadata Information Box (2 Columns exactly like official PDF) */}
        {isReadOnly && (
          <div className="mb-3 p-2.5 px-3.5 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Modo Consulta Oficial:
              </span>
              <span>Puedes consultar los cuadrantes oficiales de todas las patrullas ADIF Barcelona. Edición restringida a Jefatura.</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              Solo Lectura
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-1 text-xs leading-relaxed border-b border-slate-300 pb-3 mb-3">
          {/* Left Column */}
          <div className="md:col-span-8 space-y-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">EMPRESA</span>
              <span className="font-bold text-slate-900">50, ILUNION SEGURIDAD, S.A.</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">CLIENTE:</span>
              <span className="font-semibold text-slate-900">138173 ADMINISTRADOR DE INFRAESTRUCTURAS F</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">DESTINATARIO DE MERCANCÍAS:</span>
              <span className="font-semibold text-slate-900">{activePatrol.zone}</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">CONTRATO:</span>
              <span className="font-mono text-slate-800">00000000000030052106 LOTE 3: EXP. Nº 2.25/43110.0053</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">SERVICIO :</span>
              <span className="font-bold text-slate-950 font-mono">
                {activePatrol.serviceCode} {activePatrol.name} (Pl. dels Països Catalans, 1, 7)
              </span>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-4 space-y-1 text-left md:text-right flex flex-col justify-between">
            <div className="flex md:justify-end items-center gap-4 font-mono font-bold text-sm">
              <span>MES: <strong className="text-slate-950 underline">{monthName.split(' ')[0].toUpperCase()}</strong></span>
              <span>AÑO: <strong className="text-slate-950 underline">{year}</strong></span>
            </div>

            <div className="text-xs text-slate-700">
              <span className="font-bold">TELÉFONO:</span> <span>-</span>
            </div>

            <div className="text-xs text-slate-800">
              <span className="font-bold">INSPECTOR:</span> <span className="font-semibold">Pedro Pueyo Balboa</span>
            </div>

            <div className="text-[11px] text-slate-600 italic">
              (Pl. dels Països Catalans, 1, 7)
            </div>
          </div>
        </div>

        {/* Month Selector in Web View */}
        <div className="flex items-center justify-between no-print mb-2 text-xs text-slate-600 bg-slate-50 p-2 border border-slate-200 rounded">
          <div className="flex items-center gap-2">
            <button onClick={onPrevMonth} className="p-1 hover:bg-white rounded border border-slate-300">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-slate-900">{monthName}</span>
            <button onClick={onNextMonth} className="p-1 hover:bg-white rounded border border-slate-300">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] text-slate-500">
            💡 Haz clic en cualquier celda para editar el turno, cambiar de patrulla o autorizar servicios.
          </div>
        </div>

        {/* MAIN OFFICIAL MATRIX TABLE */}
        <div className="overflow-x-auto border border-black">
          <table className="w-full border-collapse text-left border-black">
            <thead>
              {/* Row 1: Day of Week initials (J, V, S, D, L, M, X...) */}
              <tr className="bg-slate-100 text-[11px] font-bold text-center border-b border-black">
                <th className="border-r border-black p-1 text-left pl-2 font-bold min-w-[210px] text-slate-900 text-xs">
                  VIGILANTE / EMPLEADO
                </th>
                {days.map(day => (
                  <th
                    key={`dow-${day.dateStr}`}
                    className={`border-r border-black p-0.5 min-w-[34px] font-bold ${
                      day.isWeekend ? 'bg-slate-200/90 text-slate-950 font-black' : 'text-slate-800'
                    }`}
                  >
                    {day.dayOfWeekShort}
                  </th>
                ))}
                <th className="p-1 min-w-[55px] font-black text-center text-xs">
                  TOT
                </th>
              </tr>

              {/* Row 2: Day numbers (01, 02, 03... 31) */}
              <tr className="bg-slate-50 text-xs font-mono font-bold text-center border-b border-black">
                <th className="border-r border-black p-1 text-left pl-2 text-[10px] text-slate-500 font-sans font-normal">
                  EMPRESA: 50 - DELEGACIÓN: 08
                </th>
                {days.map(day => (
                  <th
                    key={`num-${day.dateStr}`}
                    className={`border-r border-black p-0.5 min-w-[34px] tabular-nums ${
                      day.isWeekend ? 'bg-slate-200/90 font-black text-slate-950' : 'text-slate-900'
                    }`}
                  >
                    {String(day.dayNumber).padStart(2, '0')}
                  </th>
                ))}
                <th className="p-1 text-center font-sans text-[10px] text-slate-600 font-bold">
                  HORAS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black text-xs">
              {filteredOfficers.map((officer) => {
                // Monthly computable hours for this officer in this patrol (including 5.2h for vacation days)
                const officerPatrolHours = assignments
                  .filter(a => {
                    if (a.officerId !== officer.id) return false;
                    if (!a.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) return false;
                    if (a.patrolId === activePatrolId) return true;
                    if (a.patrolId === null && officer.defaultPatrolId === activePatrolId) return true;
                    return false;
                  })
                  .reduce((sum, a) => sum + (a.hours || 0), 0);

                return (
                  <tr key={officer.id} className="hover:bg-blue-50/20 transition-colors">
                    {/* Fixed Officer Column formatted exactly like the PDF */}
                    <td className="border-r border-black p-1 pl-2 text-xs leading-tight">
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-mono font-bold text-[11px] text-slate-900">
                          {officer.badgeNumber}
                        </div>

                        {/* Quick WhatsApp & Email buttons for screen view */}
                        <div className="flex items-center gap-1 no-print">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (officer.phone) {
                                const msg = buildOfficerQuadrantShareText(
                                  officer,
                                  month,
                                  year,
                                  monthName,
                                  assignments,
                                  patrolMap
                                );
                                openWhatsApp(officer.phone, msg);
                              } else if (onOpenOfficerDirectory) {
                                onOpenOfficerDirectory();
                              }
                            }}
                            title={officer.phone ? `Enviar cuadrante por WhatsApp a ${officer.name} (${officer.phone})` : `Sin teléfono guardado. Haz clic para abrir su ficha.`}
                            className={`p-0.5 rounded transition-colors ${
                              officer.phone 
                                ? 'text-emerald-700 hover:bg-emerald-100' 
                                : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Share2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (officer.email) {
                                const subject = `Cuadrante Oficial ADIF - ${monthName} ${year} - ${officer.name} (${officer.badgeNumber})`;
                                const body = buildOfficerQuadrantShareText(
                                  officer,
                                  month,
                                  year,
                                  monthName,
                                  assignments,
                                  patrolMap
                                ).replace(/\*/g, '');
                                openEmail(officer.email, subject, body);
                              } else if (onOpenOfficerDirectory) {
                                onOpenOfficerDirectory();
                              }
                            }}
                            title={officer.email ? `Enviar cuadrante por email a ${officer.name} (${officer.email})` : `Sin correo guardado. Haz clic para abrir su ficha.`}
                            className={`p-0.5 rounded transition-colors ${
                              officer.email 
                                ? 'text-blue-700 hover:bg-blue-100' 
                                : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Mail className="w-3 h-3" />
                          </button>

                          {onSelectOfficerForView && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectOfficerForView(officer.id);
                              }}
                              title={`Ver cuadrante individual de ${officer.name}`}
                              className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="font-extrabold text-slate-950 text-xs truncate max-w-[210px] leading-snug">
                        {officer.name}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        EMPRESA: 50 - DELEGACIÓN: 08
                      </div>
                    </td>

                    {/* Day Cells: Stacked Start & End Times (Exact PDF Look) */}
                    {days.map(day => {
                      // 1. Current patrol assignment
                      const currentPatrolAsgs = assignments.filter(
                        a => a.officerId === officer.id && a.date === day.dateStr && a.patrolId === activePatrolId
                      );

                      // 2. Other patrol assignment (CRITICAL USER REQUIREMENT)
                      const otherPatrolAsgs = getOtherPatrolAssignmentsForDay(
                        officer.id,
                        day.dateStr,
                        activePatrolId,
                        assignments
                      );

                      // 3. Leave without patrol
                      const leaveAsg = assignments.find(
                        a => a.officerId === officer.id && a.date === day.dateStr && a.patrolId === null
                      );

                      const hasCurrentService = currentPatrolAsgs.length > 0;
                      const hasOtherService = otherPatrolAsgs.length > 0;
                      const hasConflict = hasCurrentService && hasOtherService;

                      return (
                        <td
                          key={day.dateStr}
                          onClick={() => {
                            if (!isReadOnly) {
                              onCellClick(officer, day);
                            }
                          }}
                          className={`border-r border-black p-0 text-center relative select-none transition-all ${
                            isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-blue-100/60'
                          } ${day.isWeekend ? 'bg-slate-100/50' : 'bg-white'}`}
                          style={{ height: '42px' }}
                          title={isReadOnly ? 'Modo Consulta Oficial: Turnos asignados protegidos (Solo lectura)' : undefined}
                        >
                          {/* Case A: OVERLAP CONFLICT */}
                          {hasConflict ? (
                            <div 
                              title={`¡Alerta de Solapamiento! Asignado en ${activePatrol.code} y en ${otherPatrolAsgs.map(a => patrolMap.get(a.patrolId!)?.code).join(', ')}`}
                              className="w-full h-full flex flex-col items-center justify-center bg-rose-200 text-rose-950 font-mono text-[9px] font-black leading-none border-2 border-rose-600 animate-pulse"
                            >
                              <span>{currentPatrolAsgs[0].startTime}</span>
                              <span className="text-[7px] text-rose-800 font-bold uppercase">!Solape!</span>
                              <span>{currentPatrolAsgs[0].endTime}</span>
                            </div>
                          ) : hasCurrentService ? (
                            /* Case B: Working in THIS PATROL -> EXACT 2-LINE STACK FROM PDF */
                            (() => {
                              const asg = currentPatrolAsgs[0];
                              return (
                                <div 
                                  title={`${officer.name} · ${asg.startTime} a ${asg.endTime} (${asg.hours}h) en ${activePatrol.name}`}
                                  className="w-full h-full flex flex-col items-center justify-center font-mono text-[10px] font-black text-slate-950 leading-tight py-0.5"
                                >
                                  <span>{asg.startTime}</span>
                                  <span>{asg.endTime}</span>
                                </div>
                              );
                            })()
                          ) : hasOtherService ? (
                            /* Case C: Working in ANOTHER PATROL (Prompt requirement: solo se ven los servicios de esta patrulla, pero avisa si está en otra) */
                            (() => {
                              const otherAsg = otherPatrolAsgs[0];
                              const otherPatrol = otherAsg.patrolId ? patrolMap.get(otherAsg.patrolId) : null;
                              const otherCode = otherPatrol?.code || 'Otra';
                              return (
                                <div 
                                  title={`Aviso: ${officer.name} está asignado este día en ${otherPatrol?.name || otherCode} (${otherAsg.startTime} - ${otherAsg.endTime}). Haz clic para gestionar o transferir.`}
                                  className="w-full h-full flex flex-col items-center justify-center bg-amber-100 text-amber-950 font-mono text-[8px] font-bold leading-tight border border-dashed border-amber-400 p-0.5"
                                >
                                  <span className="text-[7px] font-black uppercase text-amber-900 bg-amber-200 px-0.5 rounded leading-none">
                                    {otherCode}
                                  </span>
                                  <span className="font-black text-[9px] text-amber-950">{otherAsg.startTime.slice(0, 5)}</span>
                                  <span className="font-black text-[9px] text-amber-950">{otherAsg.endTime.slice(0, 5)}</span>
                                </div>
                              );
                            })()
                          ) : leaveAsg ? (
                            /* Case D: Standard Leave (L, V, B, AP) */
                            (() => {
                              const def = SHIFT_DEFINITIONS[leaveAsg.shiftCode];
                              const isVacation = leaveAsg.shiftCode === 'V';
                              return (
                                <div 
                                  title={`${officer.name} · ${def?.name || leaveAsg.shiftCode}${isVacation ? ' (5,2h computadas)' : ''}`}
                                  className={`w-full h-full flex flex-col items-center justify-center font-bold text-xs ${
                                    isVacation ? 'bg-teal-50 text-teal-800' : 'text-slate-400'
                                  }`}
                                >
                                  <span>{leaveAsg.shiftCode}</span>
                                  {isVacation && (
                                    <span className="text-[8px] font-mono font-black text-teal-700 leading-none">
                                      5,2h
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            /* Case E: Empty cell */
                            <div className="w-full h-full flex items-center justify-center group/cell">
                              <span className="text-[10px] text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                +
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Hours Column */}
                    <td className="p-1 text-center font-mono font-bold text-xs text-slate-950 tabular-nums">
                      {officerPatrolHours > 0 ? officerPatrolHours.toFixed(2).replace('.', ',') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Bottom Summary Row exactly matching official ADIF report */}
            <tfoot>
              {/* Daily total hours across all vigilantes */}
              <tr className="border-t-2 border-black bg-slate-100 text-xs font-mono font-bold text-center">
                <td className="border-r border-black p-1 text-left pl-2 font-sans font-bold text-slate-900">
                  TOTAL HORAS DÍA
                </td>
                {dailyCoverage.map((c, idx) => (
                  <td key={idx} className="border-r border-black p-0.5 tabular-nums text-slate-950 font-black text-[10px]">
                    {c.dayHoursTotal > 0 ? c.dayHoursTotal.toFixed(2) : '-'}
                  </td>
                ))}
                <td className="p-1 font-mono font-black text-xs text-slate-950 tabular-nums">
                  {totalPatrolHoursMonth.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* OFFICIAL FOOTER BREAKDOWN (EXACT MATCH OF THE ADIF / ILUNION SUMMARY BOX) */}
        <div className="mt-3 border border-black text-[11px] font-mono font-bold text-slate-900 divide-x divide-black flex flex-wrap bg-slate-50">
          <div className="p-1.5 flex-1 min-w-[120px] text-center">
            LAB. DIUR. <span className="font-black underline ml-1">{labDiurHours.toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[120px] text-center">
            LAB. NOCT. <span className="font-black underline ml-1">{labNoctHours.toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[120px] text-center">
            FEST. DIUR. <span className="font-black underline ml-1">{festDiurHours.toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[120px] text-center">
            FEST. NOCT. <span className="font-black underline ml-1">{festNoctHours.toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[100px] text-center">
            NOCT. <span className="font-black underline ml-1">{(labNoctHours + festNoctHours).toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[100px] text-center">
            FEST. <span className="font-black underline ml-1">{(festDiurHours + festNoctHours).toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[130px] text-center bg-slate-200 text-slate-950 font-black text-xs">
            TOTAL <span className="font-black underline ml-1">{totalPatrolHoursMonth.toFixed(2)}</span>
          </div>
        </div>

        {/* Page indicator like in the PDF */}
        <div className="flex justify-end text-[10px] text-slate-600 font-sans mt-2">
          Página 1 de 1
        </div>
      </div>
    </div>
  );
};
