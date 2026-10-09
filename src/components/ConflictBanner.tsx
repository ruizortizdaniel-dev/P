import React from 'react';
import { ConflictAlert } from '../types/quadrant';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ConflictBannerProps {
  conflicts: ConflictAlert[];
  onOpenConflictsModal: () => void;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  conflicts,
  onOpenConflictsModal
}) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-rose-900 font-medium">
          <span className="p-1 rounded bg-rose-200 text-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
          <span>
            <strong>Atención:</strong> Se han detectado <span className="font-mono font-bold underline">{conflicts.length}</span> solapamiento(s) de turnos o colisiones entre patrullas este mes.
          </span>
          <span className="hidden md:inline text-rose-700">
            ({conflicts.map(c => `${c.officerName} el ${c.date.split('-')[2]}`).slice(0, 2).join(', ')}{conflicts.length > 2 ? '...' : ''})
          </span>
        </div>

        <button
          onClick={onOpenConflictsModal}
          className="flex items-center gap-1.5 px-3 py-1 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-2xs transition-colors"
        >
          <span>Revisar y Resolver</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
