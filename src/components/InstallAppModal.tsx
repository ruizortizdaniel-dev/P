import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Monitor, 
  Smartphone, 
  Globe, 
  Copy, 
  Check, 
  X, 
  Share2, 
  Laptop, 
  AppWindow,
  ExternalLink
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl?: string;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  sharedUrl = window.location.origin
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else {
      alert('Para instalar en tu PC o móvil, pulsa el icono de instalar (pantalla con flecha) en la barra de direcciones de tu navegador (Chrome o Edge) o selecciona "Añadir a pantalla de inicio".');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate and download a standalone Windows launcher (.bat)
  const handleDownloadWindowsLauncher = () => {
    const targetUrl = sharedUrl;
    const batContent = `@echo off
:: Lanzador de Escritorio Oficial - Cuadrante Patrullas ADIF Barcelona
title Cuadrante ADIF Barcelona - ILUNION SEGURIDAD
echo Iniciando Cuadrante Oficial Patrullas ADIF...

:: Intentar abrir con Microsoft Edge en modo aplicacion de escritorio
where msedge >nul 2>&1
if %errorlevel% == 0 (
    start msedge --app="${targetUrl}"
    exit
)

:: Intentar abrir con Google Chrome en modo aplicacion de escritorio
where chrome >nul 2>&1
if %errorlevel% == 0 (
    start chrome --app="${targetUrl}"
    exit
)

:: Si no estan en PATH, abrir con el navegador por defecto
start "" "${targetUrl}"
exit
`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Cuadrante_ADIF_Barcelona.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <AppWindow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Instalar y Compartir Cuadrante ADIF
              </h2>
              <p className="text-xs text-slate-300">
                Multiplataforma: PC Windows, Mac, Android, iPhone y Web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Option 1: Native PWA Install */}
          <div className="p-3.5 rounded-xl border-2 border-blue-600 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-blue-700" />
                1. Instalar como App de Escritorio / Móvil
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Se instala directamente con su icono oficial en tu escritorio o pantalla de inicio, funcionando en ventana propia sin barra de navegador.
              </p>
            </div>

            <button
              onClick={handleInstallPWA}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Instalar App</span>
            </button>
          </div>

          {/* Option 2: Windows Executable Script (.bat) */}
          <div className="p-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-slate-700" />
                2. Descargar Lanzador de Escritorio (.bat ejecutable)
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Archivo que puedes guardar en el escritorio de tu ordenador. Con doble clic abre el cuadrante directamente en modo ventana independiente.
              </p>
            </div>

            <button
              onClick={handleDownloadWindowsLauncher}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .bat</span>
            </button>
          </div>

          {/* Option 3: Shared Web URL */}
          <div className="p-3.5 rounded-xl border border-slate-300 bg-white space-y-2">
            <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              3. Enlace Web para Compartir con Administradores
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Copia este enlace para abrir el cuadrante en cualquier navegador (Chrome, Edge, Safari, Firefox) desde cualquier dispositivo:
            </p>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-300 font-mono text-[11px]">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="flex-1 bg-transparent px-1 focus:outline-none text-slate-800 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded font-sans font-bold text-slate-700 flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Mobile instructions note */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-600" />
              Instrucciones para Teléfonos Móviles y Tablets:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
              <li><strong>Android:</strong> Abre el enlace en Chrome y pulsa los 3 puntos ⋮ &gt; <em>"Instalar aplicación"</em> o <em>"Añadir a pantalla de inicio"</em>.</li>
              <li><strong>iPhone / iPad (iOS):</strong> Abre en Safari, pulsa el botón Compartir <Share2 className="w-3 h-3 inline" /> &gt; <em>"Añadir a pantalla de inicio"</em>.</li>
            </ul>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
