import React, { useState } from 'react';
import { Officer, Patrol, ShiftAssignment, ShiftCode } from '../types/quadrant';
import { SHIFT_DEFINITIONS } from '../data/initialData';
import { DayInfo } from '../utils/dateUtils';
import { triggerPrintReport } from '../utils/printReport';
import { downloadOfficialPdf } from '../utils/exportPdf';
import { 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Plus,
  Share2,
  Mail,
  Phone,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';
import { 
  buildOfficerQuadrantShareText, 
  openWhatsApp, 
  openEmail,
  copyQuadrantText 
} from '../utils/shareQuadrant';

interface IndividualViewProps {
  officers: Officer[];
  activeOfficerId: string;
  onSelectOfficer: (id: string) => void;
  patrols: Patrol[];
  assignments: ShiftAssignment[];
  days: DayInfo[];
  year: number;
  month: number;
  monthName: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCellClick: (officer: Officer, dayInfo: DayInfo) => void;
  onOpenQuickFill: () => void;
  onOpenDirectory?: () => void;
  isReadOnly?: boolean;
}

export const IndividualView: React.FC<IndividualViewProps> = ({
  officers,
  activeOfficerId,
  onSelectOfficer,
  patrols,
  assignments,
  days,
  year,
  month,
  monthName,
  onPrevMonth,
  onNextMonth,
  onCellClick,
  onOpenDirectory,
  isReadOnly = false
}) => {
  const activeOfficer = officers.find(o => o.id === activeOfficerId) || officers[0];
  const patrolMap = new Map<string, Patrol>(patrols.map(p => [p.id, p]));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleShareWhatsApp = () => {
    if (!activeOfficer.phone && onOpenDirectory) {
      onOpenDirectory();
      return;
    }
    const text = buildOfficerQuadrantShareText(
      activeOfficer,
      month,
      year,
      monthName,
      assignments,
      patrolMap
    );
    openWhatsApp(activeOfficer.phone, text);
  };

  const handleShareEmail = () => {
    if (!activeOfficer.email && onOpenDirectory) {
      onOpenDirectory();
      return;
    }
    const subject = `Cuadrante Oficial ADIF - ${monthName} ${year} - ${activeOfficer.name} (${activeOfficer.badgeNumber})`;
    const body = buildOfficerQuadrantShareText(
      activeOfficer,
      month,
      year,
      monthName,
      assignments,
      patrolMap
    ).replace(/\*/g, '');
    openEmail(activeOfficer.email, subject, body);
  };

  const handleCopyText = async () => {
    const text = buildOfficerQuadrantShareText(
      activeOfficer,
      month,
      year,
      monthName,
      assignments,
      patrolMap
    );
    const success = await copyQuadrantText(text);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadPdf = async () => {
    const cleanName = activeOfficer.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Cuadrante_Individual_${cleanName}_${monthName.replace(/\s+/g, '_')}_${year}.pdf`;
    const endpoint = `/api/pdf/officer/${activeOfficer.id}?month=${month}&year=${year}`;
    await downloadOfficialPdf(endpoint, filename, setIsGeneratingPdf);
  };

  // Prev / next officer navigation
  const currentIndex = officers.findIndex(o => o.id === activeOfficer.id);
  const handlePrevOfficer = () => {
    const nextIdx = (currentIndex - 1 + officers.length) % officers.length;
    onSelectOfficer(officers[nextIdx].id);
  };
  const handleNextOfficer = () => {
    const nextIdx = (currentIndex + 1) % officers.length;
    onSelectOfficer(officers[nextIdx].id);
  };

  // Month assignments for active officer
  const officerMonthAsgs = assignments.filter(
    a => a.officerId === activeOfficer.id && a.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
  );

  const totalHours = officerMonthAsgs.reduce((sum, a) => sum + (a.hours || 0), 0);

  // Vacation calculation (Convenio: 5.2h per vacation day)
  const vacationAsgs = officerMonthAsgs.filter(a => a.shiftCode === 'V');
  const vacationDaysCount = vacationAsgs.length;
  const vacationHours = vacationAsgs.reduce((sum, a) => sum + (a.hours || 5.2), 0);

  // Breakdown of services by patrol
  const patrolBreakdown = patrols.map(p => {
    const pAsgs = officerMonthAsgs.filter(a => a.patrolId === p.id);
    const pHours = pAsgs.reduce((sum, a) => sum + (a.hours || 0), 0);
    const pDiurno = pAsgs.filter(a => ['06-18', '08-20', '07-19', 'M', 'D'].includes(a.shiftCode)).length;
    const pNocturno = pAsgs.filter(a => ['18-06', '20-08', 'N'].includes(a.shiftCode)).length;
    return {
      patrol: p,
      count: pAsgs.length,
      hours: pHours,
      diurnoCount: pDiurno,
      nocturnoCount: pNocturno
    };
  });

  // Calculate official ADIF / ILUNION laborable / festivo hours for this officer
  const isHolidayOrSunday = (dayNumber: number, dayOfWeekIndex: number) => {
    return dayOfWeekIndex === 0 || dayOfWeekIndex === 6 || dayNumber === 12;
  };

  let labDiurHours = 0;
  let labNoctHours = 0;
  let festDiurHours = 0;
  let festNoctHours = 0;

  days.forEach(day => {
    const isFest = isHolidayOrSunday(day.dayNumber, day.dayOfWeekIndex);
    const dayAsgs = officerMonthAsgs.filter(a => a.date === day.dateStr);
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
      {/* Web Controls Bar (No-Print) */}
      <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-2xs no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">
            Vigilante:
          </span>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded p-1">
            <button
              onClick={handlePrevOfficer}
              className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
              title="Vigilante anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <select
              value={activeOfficer.id}
              onChange={e => onSelectOfficer(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-slate-900 py-0.5 px-2 focus:outline-none cursor-pointer max-w-[280px] sm:max-w-none truncate"
            >
              <optgroup label="Patrulla Barcelona I">
                {officers.filter(o => o.defaultPatrolId === 'p1').map(o => (
                  <option key={o.id} value={o.id}>
                    {o.badgeNumber} · {o.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Patrulla Barcelona II">
                {officers.filter(o => o.defaultPatrolId === 'p2').map(o => (
                  <option key={o.id} value={o.id}>
                    {o.badgeNumber} · {o.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Patrulla Barcelona III">
                {officers.filter(o => o.defaultPatrolId === 'p3').map(o => (
                  <option key={o.id} value={o.id}>
                    {o.badgeNumber} · {o.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <button
              onClick={handleNextOfficer}
              className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
              title="Vigilante siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs px-2 py-1 rounded font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Patrulla Base: <strong>{patrolMap.get(activeOfficer.defaultPatrolId)?.code}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded p-1 text-xs">
            <button onClick={onPrevMonth} className="p-0.5 hover:bg-white rounded">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold px-1.5">{monthName}</span>
            <button onClick={onNextMonth} className="p-0.5 hover:bg-white rounded">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={`/api/pdf/officer/${activeOfficer.id}?month=${month}&year=${year}`}
            download={`Cuadrante_Individual_${activeOfficer.name.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}_${year}.pdf`}
            title="Descarga e imprime directamente el cuadrante individual en formato oficial A4 Apaisado"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Imprimir PDF</span>
          </a>

          {/* Share via WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            title={activeOfficer.phone ? `Enviar cuadrante por WhatsApp a ${activeOfficer.phone}` : 'Enviar cuadrante por WhatsApp'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Share via Email */}
          <button
            onClick={handleShareEmail}
            title={activeOfficer.email ? `Enviar cuadrante por correo a ${activeOfficer.email}` : 'Enviar cuadrante por correo'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          {/* Copy official text */}
          <button
            onClick={handleCopyText}
            title={isCopied ? '¡Texto oficial copiado al portapapeles!' : 'Copiar texto oficial del cuadrante'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
              isCopied 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          {/* Open full Directory - Admin only */}
          {!isReadOnly && onOpenDirectory && (
            <button
              onClick={onOpenDirectory}
              title="Abrir fichas personales de los componentes (teléfonos y correos)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-lg transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Fichas Personal</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* OFFICIAL INDIVIDUAL GRAPHIC SHEET (STYLE OF OFFICIAL PDF)     */}
      {/* ============================================================ */}
      <div id="official-individual-sheet" className="official-pdf-sheet bg-white border border-slate-400 shadow-md p-4 sm:p-7 text-slate-950 font-sans print:p-0 print:border-none print:shadow-none mx-auto max-w-[1720px]">
        {/* Top date */}
        <div className="flex justify-end text-[11px] font-mono text-slate-700 font-semibold mb-1">
          26/09/2026
        </div>

        {/* Centered underlined title */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-center underline uppercase mb-4 decoration-1 underline-offset-4">
          Informe Cuadrante Grafico por Vigilante
        </h1>

        {/* Vigilante & Client Information Box */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-1 text-xs leading-relaxed border-b border-slate-300 pb-3 mb-3">
          {/* Left Column */}
          <div className="md:col-span-8 space-y-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">VIGILANTE:</span>
              <span className="font-mono font-bold text-slate-900">{activeOfficer.badgeNumber}</span>
              <span className="font-extrabold text-slate-950 text-sm">{activeOfficer.name}</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">EMPRESA:</span>
              <span className="font-semibold text-slate-900">{activeOfficer.company}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700">DELEGACIÓN: <strong className="font-mono text-slate-900">{activeOfficer.delegation}</strong></span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">CLIENTE:</span>
              <span className="font-semibold text-slate-900">138173 ADMINISTRADOR DE INFRAESTRUCTURAS F (ADIF)</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-slate-700 text-[11px]">DESTINO HABITUAL:</span>
              <span className="font-bold text-slate-900">
                {patrolMap.get(activeOfficer.defaultPatrolId)?.name} ({patrolMap.get(activeOfficer.defaultPatrolId)?.zone})
              </span>
            </div>

            {/* Contact details: Phone/WhatsApp & Email */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-700">
              <span className="flex items-center gap-1 font-mono">
                📱 <strong>WhatsApp:</strong> 
                <span className={activeOfficer.phone ? 'font-bold text-slate-900' : 'italic text-slate-400'}>
                  {activeOfficer.phone || 'Sin registrar'}
                </span>
              </span>
              <span className="flex items-center gap-1 font-sans">
                ✉️ <strong>Email:</strong> 
                <span className={activeOfficer.email ? 'font-bold text-slate-900' : 'italic text-slate-400'}>
                  {activeOfficer.email || 'Sin registrar'}
                </span>
              </span>
              {onOpenDirectory && (
                <button
                  type="button"
                  onClick={onOpenDirectory}
                  className="text-[10px] text-blue-600 hover:text-blue-800 underline font-bold"
                >
                  Editar ficha de contacto
                </button>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-4 space-y-1 text-left md:text-right flex flex-col justify-between">
            <div className="flex md:justify-end items-center gap-4 font-mono font-bold text-sm">
              <span>MES: <strong className="text-slate-950 underline">{monthName.split(' ')[0].toUpperCase()}</strong></span>
              <span>AÑO: <strong className="text-slate-950 underline">{year}</strong></span>
            </div>

            <div className="text-xs text-slate-800">
              <span className="font-bold">INSPECTOR:</span> <span className="font-semibold">Pedro Pueyo Balboa</span>
            </div>

            <div className="text-xs text-slate-900 font-bold">
              TOTAL HORAS COMPUTADAS: <span className="font-mono text-sm underline">{totalHours.toFixed(2).replace('.', ',')}h</span>
            </div>

            {vacationDaysCount > 0 && (
              <div className="text-[11px] font-bold text-teal-900 bg-teal-50 border border-teal-300 px-2.5 py-1 rounded-md flex items-center justify-between mt-1">
                <span>🏖️ Vacaciones ({vacationDaysCount} días):</span>
                <span className="font-mono font-black underline">{vacationHours.toFixed(2).replace('.', ',')}h (5,2h/día)</span>
              </div>
            )}
          </div>
        </div>

        {/* Notification notice of all patrols consolidation */}
        <div className="mb-2 p-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-700 flex items-center justify-between no-print">
          <div>
            <strong>Consolidación Integral:</strong> En esta hoja oficial se reflejan <strong>todos los servicios asignados a {activeOfficer.name} en cualquiera de las patrullas ADIF</strong>. {isReadOnly ? 'Modo Consulta Oficial (solo lectura, sin edición).' : 'Haz clic en cualquier casilla para editar o asignar.'}
          </div>
          {isReadOnly && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shrink-0 ml-2">
              Solo Lectura
            </span>
          )}
        </div>

        {/* MONTHLY LINE GRID TABLE (EXACT VISUAL FORMAT OF PDF) */}
        <div className="overflow-x-auto border border-black mb-4">
          <table className="w-full border-collapse text-left border-black">
            <thead>
              {/* Row 1: Day of Week initials */}
              <tr className="bg-slate-100 text-[11px] font-bold text-center border-b border-black">
                <th className="border-r border-black p-1 text-left pl-2 font-bold min-w-[180px] text-slate-900 text-xs">
                  PATRULLA / SERVICIO
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

              {/* Row 2: Day numbers */}
              <tr className="bg-slate-50 text-xs font-mono font-bold text-center border-b border-black">
                <th className="border-r border-black p-1 text-left pl-2 text-[10px] text-slate-500 font-sans font-normal">
                  DÍAS DEL MES
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
              {/* Main row showing services across ANY patrol */}
              <tr className="hover:bg-blue-50/20 transition-colors">
                <td className="border-r border-black p-1 pl-2 text-xs leading-tight">
                  <div className="font-extrabold text-slate-950 text-xs">
                    {activeOfficer.name}
                  </div>
                  <div className="font-mono text-[10px] text-slate-600">
                    {activeOfficer.badgeNumber} · {activeOfficer.company}
                  </div>
                </td>

                {days.map(day => {
                  const dayAsgs = officerMonthAsgs.filter(a => a.date === day.dateStr);
                  const isConflict = dayAsgs.filter(a => SHIFT_DEFINITIONS[a.shiftCode]?.isWorkShift && a.patrolId !== null).length > 1;

                  return (
                    <td
                      key={day.dateStr}
                      onClick={() => {
                        if (!isReadOnly) {
                          onCellClick(activeOfficer, day);
                        }
                      }}
                      className={`border-r border-black p-0 text-center relative select-none transition-all ${
                        isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-blue-100/60'
                      } ${
                        isConflict 
                          ? 'bg-rose-200' 
                          : day.isWeekend 
                          ? 'bg-slate-100/50' 
                          : 'bg-white'
                      }`}
                      style={{ height: '44px' }}
                      title={isReadOnly ? 'Modo Consulta Oficial: Turnos protegidos (Solo lectura)' : undefined}
                    >
                      {isConflict ? (
                        <div 
                          title="¡Alerta de Solapamiento! Múltiples turnos asignados este día"
                          className="w-full h-full flex flex-col items-center justify-center font-mono text-[8px] font-black text-rose-950 leading-none bg-rose-200 border-2 border-rose-600 animate-pulse p-0.5"
                        >
                          <span className="font-black text-rose-900 uppercase">!SOLAPE!</span>
                          <span>{dayAsgs[0].startTime.slice(0, 5)}</span>
                          <span>{dayAsgs[1]?.startTime.slice(0, 5)}</span>
                        </div>
                      ) : dayAsgs.length > 0 ? (
                        (() => {
                          const asg = dayAsgs[0];
                          const patrol = asg.patrolId ? patrolMap.get(asg.patrolId) : null;
                          const isVacation = asg.shiftCode === 'V';

                          if (isVacation) {
                            return (
                              <div 
                                title={`${activeOfficer.name} · Vacaciones (5,2h computadas)`}
                                className="w-full h-full flex flex-col items-center justify-center font-bold text-xs bg-teal-50 text-teal-900 py-0.5"
                              >
                                <span className="text-xs font-black text-teal-800">VAC</span>
                                <span className="text-[8px] font-mono font-black text-teal-700 leading-none">
                                  5,2h
                                </span>
                              </div>
                            );
                          }

                          if (asg.startTime === '-' || !asg.patrolId) {
                            return (
                              <div 
                                title={`${activeOfficer.name} · ${asg.shiftCode}`}
                                className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500"
                              >
                                <span>{asg.shiftCode}</span>
                              </div>
                            );
                          }

                          return (
                            <div 
                              title={`${activeOfficer.name} · ${asg.startTime} a ${asg.endTime} en ${patrol?.name || 'Descanso'}`}
                              className="w-full h-full flex flex-col items-center justify-center font-mono text-[9px] font-black text-slate-950 leading-tight py-0.5"
                            >
                              <span>{asg.startTime}</span>
                              <span>{asg.endTime}</span>
                              {patrol && (
                                <span className={`text-[7px] font-black px-1 rounded leading-none mt-0.5 ${
                                  patrol.id === 'p1' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                                  patrol.id === 'p2' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                  'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                }`}>
                                  {patrol.code}
                                </span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="w-full h-full flex items-center justify-center group/cell">
                          <span className="text-[10px] text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                            +
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}

                <td className="p-1 text-center font-mono font-black text-xs text-slate-950 tabular-nums">
                  {totalHours.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BREAKDOWN BY PATROL (DETALLE POR PATRULLA ADIF) */}
        <div className="border border-black mb-3 overflow-hidden text-xs">
          <div className="bg-slate-100 p-1.5 font-bold border-b border-black text-slate-900 flex justify-between items-center">
            <span>DESGLOSE DE SERVICIOS POR PATRULLA ({monthName})</span>
            <span className="font-mono">Vigilante: {activeOfficer.name}</span>
          </div>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-black text-[11px] font-bold text-slate-700">
                <th className="p-1.5 pl-3 border-r border-black">Patrulla Operativa</th>
                <th className="p-1.5 border-r border-black">Servicio y Ubicación</th>
                <th className="p-1.5 border-r border-black text-center">Nº Turnos</th>
                <th className="p-1.5 border-r border-black text-center">Diurnos (12h)</th>
                <th className="p-1.5 border-r border-black text-center">Nocturnos (12h)</th>
                <th className="p-1.5 text-right pr-3">Total Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-xs font-mono">
              {patrolBreakdown.map(({ patrol, count, hours, diurnoCount, nocturnoCount }) => (
                <tr key={patrol.id} className={count > 0 ? 'bg-white' : 'bg-slate-50/50 text-slate-400'}>
                  <td className="p-1.5 pl-3 font-sans font-bold border-r border-black">
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: patrol.color === 'blue' ? '#2563eb' : patrol.color === 'emerald' ? '#059669' : '#4f46e5' }} />
                    {patrol.code} - {patrol.name.replace('ADIF - ', '')}
                  </td>
                  <td className="p-1.5 font-sans text-[11px] border-r border-black">
                    {patrol.serviceCode} · {patrol.zone}
                  </td>
                  <td className="p-1.5 text-center font-bold border-r border-black">
                    {count}
                  </td>
                  <td className="p-1.5 text-center border-r border-black">
                    {diurnoCount}
                  </td>
                  <td className="p-1.5 text-center border-r border-black">
                    {nocturnoCount}
                  </td>
                  <td className="p-1.5 text-right pr-3 font-black text-slate-950 text-sm">
                    {hours > 0 ? hours.toFixed(2).replace('.', ',') : '0,00'}h
                  </td>
                </tr>
              ))}

              {/* Vacations row if officer has any vacation days */}
              {vacationDaysCount > 0 && (
                <tr className="bg-teal-50/70 text-teal-950 font-bold border-t-2 border-teal-300">
                  <td className="p-1.5 pl-3 font-sans font-bold border-r border-black flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-teal-600 align-middle" />
                    <span>VACACIONES REGLAMENTARIAS (V)</span>
                  </td>
                  <td className="p-1.5 font-sans text-[11px] border-r border-black text-teal-800">
                    5,20 horas computables / día
                  </td>
                  <td className="p-1.5 text-center font-bold border-r border-black">
                    {vacationDaysCount}
                  </td>
                  <td className="p-1.5 text-center border-r border-black text-slate-400">
                    -
                  </td>
                  <td className="p-1.5 text-center border-r border-black text-slate-400">
                    -
                  </td>
                  <td className="p-1.5 text-right pr-3 font-black text-teal-950 text-sm">
                    {vacationHours.toFixed(2).replace('.', ',')}h
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* OFFICIAL SUMMARY FOOTER BOX (LAB DIUR, LAB NOCT, FEST DIUR, FEST NOCT, TOTAL) */}
        <div className="border border-black text-[11px] font-mono font-bold text-slate-900 divide-x divide-black flex flex-wrap bg-slate-50">
          <div className="p-1.5 flex-1 min-w-[110px] text-center">
            LAB. DIUR. <span className="font-black underline ml-1">{labDiurHours.toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[110px] text-center">
            LAB. NOCT. <span className="font-black underline ml-1">{labNoctHours.toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[110px] text-center">
            FEST. DIUR. <span className="font-black underline ml-1">{festDiurHours.toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[110px] text-center">
            FEST. NOCT. <span className="font-black underline ml-1">{festNoctHours.toFixed(2)}</span>
          </div>
          {vacationDaysCount > 0 && (
            <div className="p-1.5 flex-1 min-w-[115px] text-center bg-teal-50 text-teal-950">
              VACAC. <span className="font-black underline ml-1">{vacationHours.toFixed(2)}</span>
            </div>
          )}
          <div className="p-1.5 flex-1 min-w-[90px] text-center">
            NOCT. <span className="font-black underline ml-1">{(labNoctHours + festNoctHours).toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[90px] text-center">
            FEST. <span className="font-black underline ml-1">{(festDiurHours + festNoctHours).toFixed(2)}</span>
          </div>
          <div className="p-1.5 flex-1 min-w-[130px] text-center bg-slate-200 text-slate-950 font-black text-xs">
            TOTAL <span className="font-black underline ml-1">{totalHours.toFixed(2)}</span>
          </div>
        </div>

        {/* Page indicator */}
        <div className="flex justify-between items-center text-[10px] text-slate-600 font-sans mt-2">
          <span>Informe oficial generado para administración y cómputo de nómina</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
};
