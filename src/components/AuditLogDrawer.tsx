import React, { useState } from 'react';
import { History, RotateCcw, X, CheckCircle2, Clock, User, AlertCircle, ArrowRight } from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  adminName: string;
  actionType: 'create_shift' | 'update_shift' | 'delete_shift' | 'batch_pattern' | 'resolve_conflict' | 'revert_action';
  description: string;
  officerName?: string;
  date?: string;
  previousState?: any;
  newState?: any;
  reverted?: boolean;
}

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
  onRevertLog: (logId: string) => Promise<void>;
  currentAdminEmail: string;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onRevertLog,
  currentAdminEmail
}) => {
  if (!isOpen) return null;

  const [revertingId, setRevertingId] = useState<string | null>(null);

  const handleRevert = async (id: string) => {
    setRevertingId(id);
    try {
      await onRevertLog(id);
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-300 animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-blue-600 text-white shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Registro de Cambios y Auditoría</h2>
              <p className="text-xs text-slate-300">Historial paso a paso de lo que hizo cada administrador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banner */}
        <div className="p-3 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between">
          <span>
            Cada acción queda grabada con fecha, autor y estado previo para permitir modificar o revertir cualquier error.
          </span>
          <span className="font-mono font-bold bg-blue-200 px-2 py-0.5 rounded text-[11px] shrink-0 ml-2">
            {logs.length} registros
          </span>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No hay modificaciones registradas todavía.
            </div>
          ) : (
            logs.map(log => {
              const dateObj = new Date(log.timestamp);
              const formattedDate = dateObj.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              const formattedTime = dateObj.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              const isRevertible = !log.reverted && log.actionType !== 'revert_action' && (log.previousState || log.newState);

              return (
                <div 
                  key={log.id} 
                  className={`pt-3 first:pt-0 p-3 rounded-lg border transition-all ${
                    log.reverted 
                      ? 'bg-slate-50 border-slate-200 opacity-60' 
                      : log.actionType === 'revert_action'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate} a las {formattedTime}</span>
                    </div>

                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      log.reverted
                        ? 'bg-slate-200 text-slate-600'
                        : log.actionType === 'delete_shift'
                        ? 'bg-rose-100 text-rose-800'
                        : log.actionType === 'create_shift'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.actionType === 'revert_action'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.reverted ? 'Revertido' : log.actionType.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Admin info */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mt-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{log.adminName}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal">({log.adminEmail})</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-800 mt-1 font-medium leading-relaxed">
                    {log.description}
                  </p>

                  {/* Diff Details if available */}
                  {(log.previousState || log.newState) && (
                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-sans block font-bold">Estado Previo:</span>
                        {log.previousState ? (
                          <div className="text-slate-700">
                            <strong>{log.previousState.shiftCode}</strong> ({log.previousState.startTime}-{log.previousState.endTime})
                            <div className="text-[10px] text-slate-500 font-sans">{log.previousState.patrolId ? `Patrulla ${log.previousState.patrolId}` : 'Sin patrulla'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Ninguno (vacío)</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-sans block font-bold">Estado Nuevo:</span>
                        {log.newState ? (
                          <div className="text-slate-900 font-bold">
                            <strong>{log.newState.shiftCode}</strong> ({log.newState.startTime}-{log.newState.endTime})
                            <div className="text-[10px] text-blue-600 font-sans">{log.newState.patrolId ? `Patrulla ${log.newState.patrolId}` : 'Sin patrulla'}</div>
                          </div>
                        ) : (
                          <span className="text-rose-600 italic">Eliminado</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rollback / Revert Action */}
                  {isRevertible && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRevert(log.id)}
                        disabled={revertingId === log.id}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${revertingId === log.id ? 'animate-spin' : ''}`} />
                        <span>{revertingId === log.id ? 'Revirtiendo...' : 'Deshacer este cambio por error'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};
