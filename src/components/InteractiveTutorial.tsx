import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  EyeOff, 
  HelpCircle, 
  ShieldAlert, 
  Layers, 
  History, 
  MessageSquare,
  Clock
} from 'lucide-react';
import { ViewMode } from '../types/quadrant';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  viewRequired?: ViewMode;
  icon: React.ReactNode;
  badge: string;
  actionTip?: string;
}

interface InteractiveTutorialProps {
  currentAdminEmail: string;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenAuditLogs: () => void;
  onOpenChat: () => void;
  onOpenConflictsModal: () => void;
}

const STORAGE_TUTORIAL_DISMISSED = 'adif_tutorial_dismissed_forever_';
const SESSION_TUTORIAL_PAUSED = 'adif_tutorial_paused_session_';

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  currentAdminEmail,
  currentView,
  onViewChange,
  onOpenAuditLogs,
  onOpenChat,
  onOpenConflictsModal
}) => {
  const dismissedForeverKey = `${STORAGE_TUTORIAL_DISMISSED}${currentAdminEmail}`;
  const pausedSessionKey = `${SESSION_TUTORIAL_PAUSED}${currentAdminEmail}`;

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const isDismissedForever = localStorage.getItem(dismissedForeverKey) === 'true';
      const isPausedSession = sessionStorage.getItem(pausedSessionKey) === 'true';
      return !isDismissedForever && !isPausedSession;
    } catch {
      return true;
    }
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: TutorialStep[] = [
    {
      id: 'step-patrols',
      title: '1. Cuadrante General por Patrulla',
      description: 'Alterna entre Patrulla Barcelona I, II y III con las pestañas superiores. En cada patrulla verás únicamente sus propios servicios oficiales (con sus horarios de 12 horas: 06-18, 18-06, 08-20, 20-08 o 07-19).',
      viewRequired: 'patrol',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      badge: 'Paso 1 de 7',
      actionTip: 'Puedes pulsar sobre BCN-I, BCN-II o BCN-III para inspeccionar cada dotación.'
    },
    {
      id: 'step-cross-patrol',
      title: '2. Avisos de Servicios en Otra Patrulla',
      description: 'Si un vigilante está de servicio ese día en OTRA patrulla (por ejemplo, Cataluña ADIF 29 en BCN-II mientras miras BCN-I), la casilla muestra una tarjeta destacada con el código de la patrulla y su horario para que sepas que no está libre.',
      viewRequired: 'patrol',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      badge: 'Paso 2 de 7',
      actionTip: 'Comprueba por ejemplo las casillas de Cataluña ADIF 29 en Barcelona I: avisa de sus turnos en BCN-II y BCN-III.'
    },
    {
      id: 'step-cell-editing',
      title: '3. Edición Bidireccional en Tiempo Real',
      description: 'Haz clic en cualquier casilla para cambiar de turno, reasignar a otra patrulla o conceder permisos. Cualquier cambio se guarda al instante y se sincroniza en ambos cuadrantes (el de la patrulla y el del vigilante).',
      viewRequired: 'patrol',
      icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
      badge: 'Paso 3 de 7',
      actionTip: 'Haz clic sobre cualquier turno o casilla con "+" para probar la ventana de edición.'
    },
    {
      id: 'step-conflicts',
      title: '4. Detección y Resolución de Solapamientos',
      description: 'El sistema vigila turnos duplicados o colisiones entre patrullas (como el día 27 de Cataluña ADIF 29 con turnos en BCN-II y BCN-III). La casilla parpadea con "!SOLAPE!" y el botón superior "Solapamientos" permite resolverlo en 1 clic.',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      badge: 'Paso 4 de 7',
      actionTip: 'Pulsa el botón rojo de "Solapamientos" en el encabezado para revisar el centro de resolución.'
    },
    {
      id: 'step-individual',
      title: '5. Cuadrante Individual por Vigilante',
      description: 'En la pestaña "Individual por Vigilante", se consolidan en una sola línea mensual TODOS los servicios de un vigilante en cualquiera de las patrullas, con la tabla oficial de desglose de horas entre Barcelona I, II y III.',
      viewRequired: 'individual',
      icon: <Layers className="w-5 h-5 text-emerald-600" />,
      badge: 'Paso 5 de 7',
      actionTip: 'Selecciona a Daniel Ruiz Ortiz o a Cataluña ADIF 29 en el desplegable para ver su desglose completo.'
    },
    {
      id: 'step-audit',
      title: '6. Historial de Cambios y Deshacer Errores',
      description: 'Cada acción que realices tú, Sergio o Alejandro queda grabada en el botón "Auditoría". Si alguien comete un error, el botón "Deshacer este cambio por error" restaura de inmediato el estado anterior en todos los dispositivos.',
      icon: <History className="w-5 h-5 text-blue-600" />,
      badge: 'Paso 6 de 7',
      actionTip: 'Abre "Auditoría" en la barra superior para examinar el historial paso a paso.'
    },
    {
      id: 'step-chat',
      title: '7. Chat Online y Presencia en Vivo',
      description: 'El botón "Chat" te muestra quién está online ahora mismo (con punto verde pulsante) y permite enviar mensajes instantáneos sincronizados entre los teléfonos y ordenadores de los administradores.',
      icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
      badge: 'Paso 7 de 7',
      actionTip: '¡Todo listo! Ya dominas las funciones clave del sistema.'
    }
  ];

  const currentStep = steps[currentStepIndex];

  // If a step requires a specific view, switch to it automatically
  useEffect(() => {
    if (isOpen && currentStep.viewRequired && currentView !== currentStep.viewRequired) {
      onViewChange(currentStep.viewRequired);
    }
  }, [isOpen, currentStepIndex, currentStep, currentView, onViewChange]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    } else {
      handleDismissForever();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    }
  };

  // Close only for this moment / session
  const handlePauseSession = () => {
    try {
      sessionStorage.setItem(pausedSessionKey, 'true');
    } catch {}
    setIsOpen(false);
  };

  // Dismiss permanently
  const handleDismissForever = () => {
    try {
      localStorage.setItem(dismissedForeverKey, 'true');
    } catch {}
    setIsOpen(false);
  };

  // Re-open tutorial anytime
  const handleRestartTutorial = () => {
    try {
      localStorage.removeItem(dismissedForeverKey);
      sessionStorage.removeItem(pausedSessionKey);
    } catch {}
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  // Floating trigger button when closed so user can re-open whenever they want
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40 no-print animate-in fade-in slide-in-from-bottom-2">
        <button
          onClick={handleRestartTutorial}
          title="Abrir Tutorial Guiado para Administradores"
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg border border-slate-700 text-xs font-bold transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Tutorial Guiado</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] no-print animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-600 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-600 text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold tracking-tight">Guía Interactiva de Administración</span>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-semibold">
              {currentStep.badge}
            </span>
          </div>

          <button
            onClick={handlePauseSession}
            title="Cerrar por ahora (puedes volver a abrirlo cuando quieras)"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
              {currentStep.icon}
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-extrabold text-slate-900 leading-tight">
                {currentStep.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {currentStep.actionTip && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 font-medium">
              💡 <strong>Pruébalo ahora:</strong> {currentStep.actionTip}
            </div>
          )}

          {/* Quick interactive helpers according to step */}
          {currentStep.id === 'step-conflicts' && (
            <button
              onClick={() => onOpenConflictsModal()}
              className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-xs font-bold transition-colors text-center"
            >
              Abrir Centro de Solapamientos ahora
            </button>
          )}

          {currentStep.id === 'step-audit' && (
            <button
              onClick={() => onOpenAuditLogs()}
              className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-xs font-bold transition-colors text-center"
            >
              Abrir Panel de Auditoría y Rollback ahora
            </button>
          )}

          {currentStep.id === 'step-chat' && (
            <button
              onClick={() => onOpenChat()}
              className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-bold transition-colors text-center"
            >
              Abrir Chat de Administradores ahora
            </button>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-5 bg-blue-600'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                title={s.title}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation & Dismissal Options */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
          {/* Main buttons: Prev & Next */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <span>{currentStepIndex === steps.length - 1 ? 'Finalizar Guía' : 'Siguiente'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dismissal options requested by user */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <button
              onClick={handlePauseSession}
              className="hover:text-slate-800 underline decoration-slate-300 hover:decoration-slate-600"
              title="Cierra el tutorial durante esta sesión. Volverá a aparecer al recargar o puedes abrirlo desde el botón flotante."
            >
              Pausar por ahora
            </button>

            <button
              onClick={handleDismissForever}
              className="hover:text-rose-700 underline decoration-slate-300 hover:decoration-rose-400"
              title="No volver a mostrar automáticamente. Siempre podrás reactivarlo desde el botón inferior."
            >
              No mostrar nunca más
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
