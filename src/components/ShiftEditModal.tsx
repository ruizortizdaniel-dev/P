import React, { useState, useEffect } from 'react';
import { Officer, Patrol, ShiftAssignment, ShiftCode } from '../types/quadrant';
import { SHIFT_DEFINITIONS } from '../data/initialData';
import { previewConflictRisk } from '../utils/conflicts';
import { AlertTriangle, Clock, Shield, Trash2, X, Check, Lock } from 'lucide-react';

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  officer: Officer | null;
  date: string; // YYYY-MM-DD
  dayNumber: number;
  existingAssignments: ShiftAssignment[];
  allAssignments: ShiftAssignment[];
  patrols: Patrol[];
  defaultPatrolId?: string;
  onSaveAssignment: (assignment: Partial<ShiftAssignment> & { id?: string }) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  readOnly?: boolean;
}

export const ShiftEditModal: React.FC<ShiftEditModalProps> = ({
  isOpen,
  onClose,
  officer,
  date,
  dayNumber,
  existingAssignments,
  allAssignments,
  patrols,
  defaultPatrolId,
  onSaveAssignment,
  onDeleteAssignment,
  readOnly = false
}) => {
  if (!isOpen || !officer) return null;

  // Selected existing assignment to edit or creating new
  const [selectedAsgId, setSelectedAsgId] = useState<string | 'new'>(
    existingAssignments.length > 0 ? existingAssignments[0].id : 'new'
  );

  const activeAsg = existingAssignments.find(a => a.id === selectedAsgId);

  const [shiftCode, setShiftCode] = useState<ShiftCode>(
    activeAsg ? activeAsg.shiftCode : 'M'
  );

  const [patrolId, setPatrolId] = useState<string | null>(
    activeAsg !== undefined 
      ? activeAsg.patrolId 
      : (defaultPatrolId || officer.defaultPatrolId || 'p1')
  );

  const [role, setRole] = useState<string>(
    activeAsg?.role || (officer.rank === 'Jefe de Equipo' ? 'Jefe de Dotación / Equipo' : 'Vigilante de Seguridad')
  );

  const [notes, setNotes] = useState<string>(activeAsg?.notes || '');
  const [isAuthorizedDouble, setIsAuthorizedDouble] = useState<boolean>(
    activeAsg?.isAuthorizedDouble || false
  );

  // When switching selected assignment in modal
  useEffect(() => {
    if (activeAsg) {
      setShiftCode(activeAsg.shiftCode);
      setPatrolId(activeAsg.patrolId);
      setRole(activeAsg.role || 'Vigilante de Seguridad');
      setNotes(activeAsg.notes || '');
      setIsAuthorizedDouble(activeAsg.isAuthorizedDouble || false);
    } else {
      setShiftCode('18-06');
      setPatrolId(defaultPatrolId || officer.defaultPatrolId || 'p1');
      setRole(officer.rank === 'Jefe de Equipo' ? 'Jefe de Dotación / Equipo' : 'Vigilante de Seguridad');
      setNotes('');
      setIsAuthorizedDouble(false);
    }
  }, [selectedAsgId, activeAsg, defaultPatrolId, officer]);

  // Evaluate conflict risk in real-time
  const conflictRisk = previewConflictRisk(
    officer.id,
    date,
    patrolId,
    shiftCode,
    allAssignments,
    selectedAsgId !== 'new' ? selectedAsgId : undefined
  );

  const shiftDef = SHIFT_DEFINITIONS[shiftCode];

  // If selecting a non-work shift (L, V, AP, B), patrolId becomes null automatically
  const handleShiftSelect = (code: ShiftCode) => {
    setShiftCode(code);
    const def = SHIFT_DEFINITIONS[code];
    if (!def.isWorkShift) {
      setPatrolId(null);
    } else if (patrolId === null) {
      setPatrolId(defaultPatrolId || officer.defaultPatrolId || 'p1');
    }
  };

  const handleSave = () => {
    const hours = shiftDef?.hours ?? 8;
    onSaveAssignment({
      id: selectedAsgId !== 'new' ? selectedAsgId : undefined,
      officerId: officer.id,
      date,
      shiftCode,
      patrolId: shiftDef.isWorkShift ? (patrolId as any) : null,
      startTime: shiftDef.startTime,
      endTime: shiftDef.endTime,
      hours,
      role: shiftDef.isWorkShift ? role : undefined,
      notes: notes.trim() || undefined,
      isAuthorizedDouble
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Shield className={`w-4 h-4 ${readOnly ? 'text-emerald-600' : 'text-blue-600'}`} />
              <span>{readOnly ? 'Detalle de Turno Oficial (Solo Lectura)' : 'Editar Asignación de Turno'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {officer.name} ({officer.badgeNumber}) · Día {dayNumber} ({date})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {readOnly && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Modo Consulta: Los cuadrantes oficiales son de solo lectura para el personal de servicio.</span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Multiple assignments switcher if officer has >1 assignment on this day */}
          {existingAssignments.length > 1 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-xs font-medium text-amber-900 block mb-2">
                ⚠️ Este efectivo tiene {existingAssignments.length} servicios registrados este día:
              </span>
              <div className="flex gap-2">
                {existingAssignments.map((asg, idx) => (
                  <button
                    key={asg.id}
                    onClick={() => setSelectedAsgId(asg.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      selectedAsgId === asg.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Servicio {idx + 1}: {asg.shiftCode} ({asg.patrolId ? patrols.find(p => p.id === asg.patrolId)?.code : 'Descanso'})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conflict Risk Warning Banner if triggered */}
          {conflictRisk.hasConflict && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">¡Alerta de Solapamiento Detectada!</span>
                <p>{conflictRisk.reason}</p>
                <div className="pt-1 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={isAuthorizedDouble}
                      onChange={e => setIsAuthorizedDouble(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs">Autorizar expresamente como doble servicio / refuerzo</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Shift Code Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Tipo de Turno / Servicio
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Object.values(SHIFT_DEFINITIONS).map(def => {
                const isSelected = shiftCode === def.code;
                return (
                  <button
                    key={def.code}
                    type="button"
                    onClick={() => handleShiftSelect(def.code)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {def.label || def.code}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate w-full mt-0.5">
                      {def.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{shiftDef.description}</span> · <span className="font-mono font-bold text-slate-800 tabular-nums">{shiftDef.hours}h</span> {shiftDef.startTime !== '-' ? `(${shiftDef.startTime} - ${shiftDef.endTime})` : ''}
            </p>
          </div>

          {/* Patrol Selector (only if work shift) */}
          {shiftDef.isWorkShift && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Patrulla Asignada (4 Patrullas Operativas)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {patrols.map(p => {
                  const isSelected = patrolId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPatrolId(p.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                        p.color === 'blue' ? 'bg-blue-600' :
                        p.color === 'emerald' ? 'bg-emerald-600' :
                        p.color === 'indigo' ? 'bg-indigo-600' : 'bg-amber-600'
                      }`} />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {p.code} · {p.callsign}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {p.name.split('-')[1]?.trim() || p.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                💡 Nota: Al guardar en una patrulla, el cuadrante general de esa patrulla y el individual del agente se sincronizan en ambas direcciones.
              </p>
            </div>
          )}

          {/* Role & Notes */}
          {shiftDef.isWorkShift && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Puesto Operativo
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Vigilante de Seguridad">Vigilante de Seguridad</option>
                  <option value="Vigilante Conductor (Móvil Z)">Vigilante Conductor (Móvil Z)</option>
                  <option value="Vigilante Acompañante">Vigilante Acompañante</option>
                  <option value="Jefe de Dotación / Equipo">Jefe de Dotación / Equipo</option>
                  <option value="Vigilante de Refuerzo">Vigilante de Refuerzo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Refuerzo evento..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div>
            {activeAsg && (
              <button
                type="button"
                onClick={() => {
                  onDeleteAssignment(activeAsg.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar servicio
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar y Sincronizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
