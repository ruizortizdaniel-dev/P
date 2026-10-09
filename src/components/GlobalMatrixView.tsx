import React, { useState } from 'react';
import { Officer, Patrol, ShiftAssignment } from '../types/quadrant';
import { SHIFT_DEFINITIONS } from '../data/initialData';
import { DayInfo } from '../utils/dateUtils';
import { Shield, ChevronLeft, ChevronRight, Search, AlertTriangle, Layers } from 'lucide-react';

interface GlobalMatrixViewProps {
  patrols: Patrol[];
  officers: Officer[];
  assignments: ShiftAssignment[];
  days: DayInfo[];
  year: number;
  month: number;
  monthName: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCellClick: (officer: Officer, dayInfo: DayInfo) => void;
  isReadOnly?: boolean;
}

export const GlobalMatrixView: React.FC<GlobalMatrixViewProps> = ({
  patrols,
  officers,
  assignments,
  days,
  year,
  month,
  monthName,
  onPrevMonth,
  onNextMonth,
  onCellClick,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patrolFilter, setPatrolFilter] = useState<string>('all');

  const patrolMap = new Map<string, Patrol>(patrols.map(p => [p.id, p]));

  const filteredOfficers = officers.filter(o => {
    const matchesSearch = 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (patrolFilter !== 'all' && o.defaultPatrolId !== patrolFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Matriz Global Unificada (4 Patrullas)</h2>
              <p className="text-xs text-slate-500">Supervisión integrada de todo el personal y despliegue operativo</p>
            </div>
          </div>
        </div>

        {/* Month Navigation & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Patrol Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setPatrolFilter('all')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                patrolFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            {patrols.map(p => (
              <button
                key={p.id}
                onClick={() => setPatrolFilter(p.id)}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  patrolFilter === p.id ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.code}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button
              onClick={onPrevMonth}
              className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 min-w-[110px] text-center">
              {monthName}
            </span>
            <button
              onClick={onNextMonth}
              className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 select-none">
                <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2.5 font-bold text-slate-800 border-r border-slate-200 min-w-[200px] shadow-xs">
                  Efectivo / Base
                </th>
                {days.map(day => (
                  <th
                    key={day.dateStr}
                    className={`px-1 py-1 text-center font-bold min-w-[42px] border-r border-slate-200/70 ${
                      day.isToday
                        ? 'bg-blue-100 text-blue-900'
                        : day.isWeekend
                        ? 'bg-slate-100 text-slate-800'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-normal text-slate-500 uppercase">
                      {day.dayOfWeekShort}
                    </div>
                    <div className="font-mono text-xs tabular-nums">
                      {day.dayNumber}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center font-bold text-slate-800 min-w-[65px] bg-slate-100 border-l border-slate-200">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredOfficers.map((officer, oIdx) => {
                const monthAsgs = assignments.filter(
                  a => a.officerId === officer.id && a.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
                );
                const totalMonthHours = monthAsgs.reduce((s, a) => s + (a.hours || 0), 0);

                return (
                  <tr 
                    key={officer.id}
                    className={`group hover:bg-slate-50/70 transition-colors ${
                      oIdx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Fixed Officer Cell */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-2 border-r border-slate-200 font-medium shadow-xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{officer.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{officer.badgeNumber} · {officer.rank}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                          officer.defaultPatrolId === 'p1' ? 'bg-blue-100 text-blue-800' :
                          officer.defaultPatrolId === 'p2' ? 'bg-emerald-100 text-emerald-800' :
                          officer.defaultPatrolId === 'p3' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {patrolMap.get(officer.defaultPatrolId)?.code}
                        </span>
                      </div>
                    </td>

                    {/* Day Cells */}
                    {days.map(day => {
                      const dayAsgs = assignments.filter(
                        a => a.officerId === officer.id && a.date === day.dateStr
                      );

                      const workAsgs = dayAsgs.filter(a => SHIFT_DEFINITIONS[a.shiftCode]?.isWorkShift && a.patrolId !== null);
                      const hasConflict = workAsgs.length > 1;

                      return (
                        <td
                          key={day.dateStr}
                          onClick={() => {
                            if (!isReadOnly) {
                              onCellClick(officer, day);
                            }
                          }}
                          className={`p-1 text-center border-r border-slate-100 relative select-none transition-colors ${
                            isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-blue-50/40'
                          } ${day.isWeekend ? 'bg-slate-50/40' : ''}`}
                          title={isReadOnly ? 'Modo Consulta Oficial (Solo lectura)' : undefined}
                        >
                          {hasConflict ? (
                            <div 
                              title={`¡Solapamiento! Asignado en: ${workAsgs.map(a => `${a.shiftCode} en ${patrolMap.get(a.patrolId!)?.code}`).join(', ')}`}
                              className="w-full h-8 flex flex-col items-center justify-center rounded bg-rose-100 border border-rose-400 text-rose-900 font-bold shadow-2xs animate-pulse"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span className="text-[8px] font-mono leading-none">!Solape!</span>
                            </div>
                          ) : dayAsgs.length > 0 ? (
                            (() => {
                              const asg = dayAsgs[0];
                              const def = SHIFT_DEFINITIONS[asg.shiftCode];
                              const patrol = asg.patrolId ? patrolMap.get(asg.patrolId) : null;

                              let cellColor = def.bgColor;
                              let textColor = def.textColor;
                              let border = def.borderColor;

                              // Patrol specific border dot
                              return (
                                <div 
                                  title={`${officer.name} · ${def.name} ${patrol ? `(${patrol.code})` : ''}`}
                                  className={`w-full h-8 flex flex-col items-center justify-center rounded border font-bold text-xs shadow-2xs transition-transform hover:scale-105 ${cellColor} ${textColor} ${border}`}
                                >
                                  <span className="leading-tight">{asg.shiftCode}</span>
                                  {asg.shiftCode === 'V' ? (
                                    <span className="text-[8px] font-mono font-black leading-none">
                                      5,2h
                                    </span>
                                  ) : patrol ? (
                                    <span className="text-[8px] font-mono opacity-80 leading-none">
                                      {patrol.code}
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })()
                          ) : (
                            <div className="w-full h-8 rounded border border-transparent hover:border-slate-200" />
                          )}
                        </td>
                      );
                    })}

                    {/* Total month hours */}
                    <td className="px-2 py-1.5 text-center font-mono font-bold text-xs text-slate-800 bg-slate-50/50 border-l border-slate-200 tabular-nums">
                      {totalMonthHours % 1 === 0 ? totalMonthHours : totalMonthHours.toFixed(1)}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
