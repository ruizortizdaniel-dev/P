import React from 'react';
import { Officer, Patrol, ShiftAssignment } from '../types/quadrant';
import { DayInfo } from '../utils/dateUtils';
import { Download, Printer, X, FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patrols: Patrol[];
  officers: Officer[];
  assignments: ShiftAssignment[];
  days: DayInfo[];
  year: number;
  month: number;
  monthName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  patrols,
  officers,
  assignments,
  days,
  year,
  month,
  monthName
}) => {
  if (!isOpen) return null;

  const patrolMap = new Map<string, Patrol>(patrols.map(p => [p.id, p]));

  // Generate CSV data
  const handleExportCSV = () => {
    const headers = ['Efectivo', 'TIP', 'Rango', 'Patrulla Base', ...days.map(d => `${d.dayNumber}/${month}`), 'Total Horas'];
    
    const rows = officers.map(officer => {
      const officerMonthAsgs = assignments.filter(
        a => a.officerId === officer.id && a.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
      );
      const totalHours = officerMonthAsgs.reduce((s, a) => s + (a.hours || 0), 0);

      const dayCells = days.map(d => {
        const asgs = assignments.filter(a => a.officerId === officer.id && a.date === d.dateStr);
        if (asgs.length === 0) return '';
        return asgs.map(a => `${a.shiftCode}${a.patrolId ? `(${patrolMap.get(a.patrolId)?.code})` : ''}`).join(' + ');
      });

      return [
        `"${officer.name}"`,
        `"${officer.badgeNumber}"`,
        `"${officer.rank}"`,
        `"${patrolMap.get(officer.defaultPatrolId)?.code || ''}"`,
        ...dayCells.map(c => `"${c}"`),
        totalHours
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cuadrante_Patrullas_${monthName.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Exportar / Imprimir Cuadrante
              </h3>
              <p className="text-xs text-slate-500">
                Mes de {monthName} ({officers.length} efectivos, 4 patrullas)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="space-y-3">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">
                    Descargar en formato CSV / Excel
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Exporta la tabla completa con turnos, patrullas y horas computadas.
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">
                    Imprimir o Guardar en PDF
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Abre el diálogo de impresión con plantilla limpia para tablón oficial.
                  </span>
                </div>
              </div>
              <Printer className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
