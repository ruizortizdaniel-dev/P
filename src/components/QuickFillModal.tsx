import React, { useState } from 'react';
import { Officer, Patrol, ShiftCode, ShiftAssignment } from '../types/quadrant';
import { SHIFT_DEFINITIONS } from '../data/initialData';
import { DayInfo } from '../utils/dateUtils';
import { Sparkles, X, Check, Calendar } from 'lucide-react';

interface QuickFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  officers: Officer[];
  patrols: Patrol[];
  days: DayInfo[];
  onApplyPattern: (newAssignments: ShiftAssignment[]) => void;
}

const PRESET_PATTERNS = [
  {
    name: 'Secuencia Policial 8 Días (M-M-T-T-N-N-L-L)',
    pattern: ['M', 'M', 'T', 'T', 'N', 'N', 'L', 'L'] as ShiftCode[],
    description: '2 Mañanas, 2 Tardes, 2 Noches, 2 Libres'
  },
  {
    name: 'Turno Fijo Mañanas (5x2: L-V Mañanas, S-D Libres)',
    pattern: ['M', 'M', 'M', 'M', 'M', 'L', 'L'] as ShiftCode[],
    description: 'Lunes a Viernes turno de mañana, fines de semana libres'
  },
  {
    name: 'Turno Fijo Tardes (5x2: L-V Tardes, S-D Libres)',
    pattern: ['T', 'T', 'T', 'T', 'T', 'L', 'L'] as ShiftCode[],
    description: 'Lunes a Viernes turno de tarde, fines de semana libres'
  },
  {
    name: 'Semana de Refuerzo Intensivo (R-R-R-R-L-L-L)',
    pattern: ['R', 'R', 'R', 'R', 'L', 'L', 'L'] as ShiftCode[],
    description: '4 días de refuerzo operativo, 3 libres'
  }
];

export const QuickFillModal: React.FC<QuickFillModalProps> = ({
  isOpen,
  onClose,
  officers,
  patrols,
  days,
  onApplyPattern
}) => {
  if (!isOpen) return null;

  const [targetScope, setTargetScope] = useState<'officer' | 'patrol'>('officer');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(officers[0]?.id || '');
  const [selectedPatrolId, setSelectedPatrolId] = useState<string>(patrols[0]?.id || '');
  const [selectedPatternIdx, setSelectedPatternIdx] = useState<number>(0);
  const [offsetDays, setOffsetDays] = useState<number>(0);

  const activePattern = PRESET_PATTERNS[selectedPatternIdx];

  const handleApply = () => {
    const newAsgs: ShiftAssignment[] = [];
    const targetOfficers = targetScope === 'officer'
      ? officers.filter(o => o.id === selectedOfficerId)
      : officers.filter(o => o.defaultPatrolId === selectedPatrolId);

    targetOfficers.forEach((officer, oIdx) => {
      // Stagger offset if applying to whole squad
      const officerOffset = offsetDays + (targetScope === 'patrol' ? oIdx * 2 : 0);

      days.forEach((day, dIdx) => {
        const patternIdx = (dIdx + officerOffset) % activePattern.pattern.length;
        const code = activePattern.pattern[patternIdx];
        const def = SHIFT_DEFINITIONS[code];
        const isWork = def.isWorkShift;

        newAsgs.push({
          id: `gen-${officer.id}-${day.dateStr}-${Date.now()}-${dIdx}`,
          officerId: officer.id,
          date: day.dateStr,
          shiftCode: code,
          patrolId: isWork ? (targetScope === 'patrol' ? (selectedPatrolId as any) : officer.defaultPatrolId) : null,
          startTime: def.startTime,
          endTime: def.endTime,
          hours: def.hours,
          role: officer.rank === 'Jefe de Equipo' ? 'Jefe de Dotación / Equipo' : 'Vigilante de Seguridad'
        });
      });
    });

    onApplyPattern(newAsgs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Generador de Patrones de Turno
              </h3>
              <p className="text-xs text-slate-500">
                Aplica ciclos continuos de servicio a un agente o patrulla completa
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Target Scope */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Aplicar a:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetScope('officer')}
                className={`py-2 px-3 rounded-lg border text-center font-medium ${
                  targetScope === 'officer'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Un solo efectivo
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('patrol')}
                className={`py-2 px-3 rounded-lg border text-center font-medium ${
                  targetScope === 'patrol'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Patrulla completa (rotación escalonada)
              </button>
            </div>
          </div>

          {/* Target Selection */}
          {targetScope === 'officer' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Selecciona Efectivo:
              </label>
              <select
                value={selectedOfficerId}
                onChange={e => setSelectedOfficerId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-800"
              >
                {officers.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.badgeNumber}) · {o.rank}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Selecciona Patrulla:
              </label>
              <select
                value={selectedPatrolId}
                onChange={e => setSelectedPatrolId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-800"
              >
                {patrols.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preset Patterns */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Patrón o Ciclo:
            </label>
            <div className="space-y-2">
              {PRESET_PATTERNS.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPatternIdx(idx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPatternIdx === idx
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <div className="flex gap-1">
                      {p.pattern.map((code, cIdx) => (
                        <span key={cIdx} className="w-5 h-5 flex items-center justify-center font-bold text-[10px] rounded bg-slate-100 text-slate-800">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Offset days */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Desfase inicial del ciclo (días):
            </label>
            <input
              type="number"
              min="0"
              max="7"
              value={offsetDays}
              onChange={e => setOffsetDays(parseInt(e.target.value) || 0)}
              className="w-24 rounded-lg border border-slate-200 py-1.5 px-3 bg-white text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            Aplicar y Sincronizar
          </button>
        </div>
      </div>
    </div>
  );
};
