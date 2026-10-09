import React from 'react';
import { ConflictAlert, Patrol, ShiftAssignment } from '../types/quadrant';
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, X, Clock, Calendar } from 'lucide-react';

interface ConflictAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictAlert[];
  patrols: Patrol[];
  onResolveKeepOne: (keepAssignmentId: string, removeAssignmentIds: string[]) => void;
  onAuthorizeDouble: (assignmentIds: string[]) => void;
}

export const ConflictAlertsModal: React.FC<ConflictAlertsModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  patrols,
  onResolveKeepOne,
  onAuthorizeDouble
}) => {
  if (!isOpen) return null;

  const patrolMap = new Map<string, Patrol>(patrols.map(p => [p.id, p]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                Centro de Alertas de Solapamiento y Conflictos
              </h3>
              <p className="text-xs text-slate-500">
                {conflicts.length === 0 
                  ? 'Todos los cuadrantes están sincronizados sin colisiones.'
                  : `${conflicts.length} conflicto(s) detectado(s) que requieren resolución.`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict list */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          {conflicts.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">¡Cuadrante 100% libre de solapamientos!</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Ningún agente tiene turnos duplicados o colisiones entre patrullas en las fechas configuradas.
              </p>
            </div>
          ) : (
            conflicts.map((conflict, index) => {
              const asgs = conflict.assignments;
              return (
                <div 
                  key={conflict.id}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 hover:border-rose-300 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {conflict.officerName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {conflict.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {conflict.message}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-100 rounded-md shrink-0">
                      {conflict.type === 'multi_patrol' ? 'Solapamiento de Patrullas' :
                       conflict.type === 'insufficient_rest' ? 'Descanso Insuficiente' : 'Turno Duplicado'}
                    </span>
                  </div>

                  {/* Assignments details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {asgs.map((asg, asgIdx) => {
                      const patrol = asg.patrolId ? patrolMap.get(asg.patrolId) : null;
                      return (
                        <div 
                          key={asg.id}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-800">
                                Opción {asgIdx + 1}: {patrol ? patrol.code : 'Sin Patrulla'}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {asg.startTime} - {asg.endTime}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Turno: <strong className="text-slate-900">{asg.shiftCode}</strong> ({asg.hours}h)
                              {asg.role ? ` · ${asg.role}` : ''}
                            </p>
                            {asg.notes && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">"{asg.notes}"</p>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const others = asgs.filter(a => a.id !== asg.id).map(a => a.id);
                                onResolveKeepOne(asg.id, others);
                              }}
                              className="w-full py-1 px-2 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-center"
                            >
                              Mantener sólo este turno
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick secondary action */}
                  {conflict.type === 'multi_patrol' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => onAuthorizeDouble(asgs.map(a => a.id))}
                        className="text-xs text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
                      >
                        Autorizar expresamente como doble servicio <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            La resolución actualiza bidireccionalmente todos los cuadrantes generales e individuales en tiempo real.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
