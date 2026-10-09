import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  FileText, 
  Share2, 
  Copy, 
  Check, 
  Trash2,
  Navigation,
  Compass,
  Filter,
  User,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { Incident, IncidentSeverity, IncidentStatus, IncidentType, Patrol, PatrolId, AppUser } from '../types/quadrant';

interface IncidentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onAddIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  onUpdateIncidentStatus: (id: string, status: IncidentStatus, actionsTaken?: string) => Promise<void>;
  onDeleteIncident?: (id: string) => Promise<void>;
  currentUser: AppUser | null;
  patrols: Patrol[];
  onOpenPkFinder?: () => void;
  onOpenDictionary?: () => void;
}

const INCIDENT_TYPE_LABELS: Record<IncidentType, { label: string; icon: string }> = {
  intrusion: { label: 'Intrusión en vía', icon: '🚶' },
  grafiti: { label: 'Grafiti / Vandalismo', icon: '🎨' },
  averia_infraestructura: { label: 'Avería / Cerramientos', icon: '⚠️' },
  robo_material: { label: 'Robo de cable / Material', icon: '🚨' },
  orden_publico: { label: 'Alteración Orden Público', icon: '🛑' },
  identificacion: { label: 'Identificación sospechosa', icon: '🆔' },
  control_acceso: { label: 'Control de accesos / Gálibo', icon: '🚧' },
  otra: { label: 'Otra novedad de servicio', icon: '📋' }
};

const SEVERITY_LABELS: Record<IncidentSeverity, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  media: { label: 'Media', color: 'text-amber-800 bg-amber-50 border-amber-200' },
  alta: { label: 'Alta', color: 'text-orange-800 bg-orange-50 border-orange-200' },
  critica: { label: 'Crítica', color: 'text-rose-900 bg-rose-100 border-rose-300 font-bold' }
};

export const IncidentsModal: React.FC<IncidentsModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onAddIncident,
  onUpdateIncidentStatus,
  onDeleteIncident,
  currentUser,
  patrols,
  onOpenPkFinder,
  onOpenDictionary
}) => {
  const [filterScope, setFilterScope] = useState<'all' | 'mine'>('all');
  const [selectedPatrol, setSelectedPatrol] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New incident modal state
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newType, setNewType] = useState<IncidentType>('intrusion');
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPk, setNewPk] = useState('');
  const [newPatrolId, setNewPatrolId] = useState<PatrolId>(
    (currentUser?.defaultPatrolId as PatrolId) || 'p1'
  );
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('media');
  const [newDescription, setNewDescription] = useState('');
  const [newActionsTaken, setNewActionsTaken] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const patrolMap = useMemo(() => new Map(patrols.map(p => [p.id, p])), [patrols]);

  // Filtered list
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      // Scope: mine vs all
      if (filterScope === 'mine' && currentUser?.email) {
        if (inc.reporterEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
          return false;
        }
      }

      // Patrol
      if (selectedPatrol !== 'all' && inc.patrolId !== selectedPatrol) {
        return false;
      }

      // Status
      if (selectedStatus === 'open_only' && inc.status === 'resuelta') {
        return false;
      }
      if (selectedStatus === 'resolved_only' && inc.status !== 'resuelta') {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = 
          inc.title.toLowerCase().includes(q) ||
          inc.location.toLowerCase().includes(q) ||
          (inc.pk && inc.pk.toLowerCase().includes(q)) ||
          inc.description.toLowerCase().includes(q) ||
          inc.reporterName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [incidents, filterScope, selectedPatrol, selectedStatus, searchTerm, currentUser]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newLocation.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddIncident({
        reporterEmail: currentUser?.email || 'vigilante@ilunion.com',
        reporterName: currentUser?.name || 'Vigilante de Seguridad',
        reporterBadge: currentUser?.badgeNumber,
        patrolId: newPatrolId,
        type: newType,
        title: newTitle.trim(),
        location: newLocation.trim(),
        pk: newPk.trim() || undefined,
        description: newDescription.trim(),
        actionsTaken: newActionsTaken.trim() || undefined,
        severity: newSeverity
      });

      // Reset form
      setNewTitle('');
      setNewLocation('');
      setNewPk('');
      setNewDescription('');
      setNewActionsTaken('');
      setIsCreating(false);
    } catch (err) {
      console.error('Error adding incident:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyIncident = async (inc: Incident) => {
    const text = [
      `🚨 *NOVEDAD DE SERVICIO ADIF - ILUNION*`,
      `📅 Fecha/Hora: ${new Date(inc.timestamp).toLocaleString('es-ES')}`,
      `🏢 Patrulla: ${patrolMap.get(inc.patrolId)?.code || inc.patrolId}`,
      `👤 Actuante: ${inc.reporterName} ${inc.reporterBadge ? `(TIP ${inc.reporterBadge})` : ''}`,
      `📍 Ubicación: ${inc.location} ${inc.pk ? `[${inc.pk}]` : ''}`,
      `🏷️ Tipo: ${INCIDENT_TYPE_LABELS[inc.type]?.label || inc.type}`,
      `⚠️ Gravedad: ${inc.severity.toUpperCase()} · Estado: ${inc.status.toUpperCase()}`,
      `📝 Descripción: ${inc.description}`,
      inc.actionsTaken ? `🛡️ Medidas Adoptadas: ${inc.actionsTaken}` : ''
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(inc.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base md:text-lg font-bold">
                  Libro de Incidencias y Novedades de Seguridad
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  {incidents.length} Registros
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Control oficial de actuaciones en vía, estaciones e infraestructura ADIF Barcelona
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDictionary && (
              <button
                onClick={onOpenDictionary}
                title="Consultar Diccionario Ferroviario de ADIF y preguntar a la IA"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-700 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>Diccionario ADIF</span>
              </button>
            )}

            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Novedad</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Scope Toggle: All vs Mine */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300 text-xs shrink-0">
            <button
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterScope === 'all' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({incidents.length})
            </button>
            <button
              onClick={() => setFilterScope('mine')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                filterScope === 'mine' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Mis Incidencias</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por PK, ubicación, texto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Patrol & Status Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPatrol}
              onChange={e => setSelectedPatrol(e.target.value)}
              className="text-xs font-semibold py-2 px-2.5 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">Todas Patrullas</option>
              {patrols.map(p => (
                <option key={p.id} value={p.id}>{p.code}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs font-semibold py-2 px-2.5 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">Todos Estados</option>
              <option value="open_only">Abiertas / En curso</option>
              <option value="resolved_only">Resueltas</option>
            </select>
          </div>
        </div>

        {/* Incidents List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">Sin incidencias pendientes</p>
              <p className="text-xs">No hay novedades registradas con los filtros seleccionados.</p>
            </div>
          ) : (
            filteredIncidents.map(inc => {
              const patrol = patrolMap.get(inc.patrolId);
              const typeInfo = INCIDENT_TYPE_LABELS[inc.type] || INCIDENT_TYPE_LABELS.otra;
              const severityInfo = SEVERITY_LABELS[inc.severity] || SEVERITY_LABELS.media;
              const isResolved = inc.status === 'resuelta';
              const isCopied = copiedId === inc.id;

              return (
                <div
                  key={inc.id}
                  className={`bg-white border rounded-xl p-4 transition-all shadow-2xs ${
                    isResolved 
                      ? 'border-slate-200 opacity-85' 
                      : inc.severity === 'critica' || inc.severity === 'alta'
                        ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                        : 'border-slate-300'
                  }`}
                >
                  {/* Top row: Type, Severity, Patrol & Timestamp */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold flex items-center gap-1.5 text-slate-900">
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </span>

                      <span className="text-slate-300">·</span>

                      {patrol && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          patrol.id === 'p1' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          patrol.id === 'p2' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          patrol.id === 'p3' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {patrol.code}
                        </span>
                      )}

                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${severityInfo.color}`}>
                        Gravedad {severityInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {/* Status indicator */}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        isResolved 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      }`}>
                        {isResolved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Resuelta</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>En Curso</span>
                          </>
                        )}
                      </span>

                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(inc.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(inc.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Title & Location */}
                  <h3 className="text-sm font-extrabold text-slate-950 mb-1 leading-snug">
                    {inc.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-2.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{inc.location}</span>
                    </span>

                    {inc.pk && (
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                        {inc.pk}
                      </span>
                    )}

                    <span className="text-slate-400">·</span>

                    <span className="text-[11px] text-slate-500">
                      Reportado por: <strong>{inc.reporterName}</strong> {inc.reporterBadge ? `(TIP ${inc.reporterBadge})` : ''}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap mb-2">
                    {inc.description}
                  </p>

                  {/* Actions Taken if any */}
                  {inc.actionsTaken && (
                    <div className="text-xs text-emerald-950 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 mb-2">
                      <strong className="text-emerald-800">Medidas adoptadas:</strong> {inc.actionsTaken}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Resolve toggle button */}
                      {!isResolved ? (
                        <button
                          onClick={() => onUpdateIncidentStatus(inc.id, 'resuelta', 'Servicio normalizado')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Marcar como Resuelta</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateIncidentStatus(inc.id, 'en_curso')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <span>Reabrir Novedad</span>
                        </button>
                      )}

                      {/* Copy Incident format */}
                      <button
                        onClick={() => handleCopyIncident(inc)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                          isCopied 
                            ? 'bg-emerald-500 text-white border-emerald-500' 
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? '¡Copiado!' : 'Copiar Parte'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* If has PK, allow searching in PK finder */}
                      {inc.pk && onOpenPkFinder && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenPkFinder();
                          }}
                          title="Abrir en buscador de PKs de vía"
                          className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 underline"
                        >
                          <Compass className="w-3 h-3" />
                          <span>Localizar PK</span>
                        </button>
                      )}

                      {/* Admin delete */}
                      {currentUser?.isAdmin && onDeleteIncident && (
                        <button
                          onClick={() => {
                            if (window.confirm('¿Eliminar esta incidencia permanentemente?')) {
                              onDeleteIncident(inc.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Eliminar incidencia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-3 px-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>Las novedades registradas quedan registradas cronológicamente para el parte diario de servicio ADIF.</span>
          <span className="font-mono text-[10px] font-bold text-slate-600">ILUNION SEGURIDAD · JEFATURA DE PATRULLAS</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NEW INCIDENT CREATION MODAL                              */}
      {/* ======================================================== */}
      {isCreating && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Registrar Novedad / Incidencia en Vía</span>
                </h3>
                <p className="text-xs text-slate-300">Parte oficial de intervención para patrullas ADIF</p>
              </div>
              <button 
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Incidencia:*
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as IncidentType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    {Object.entries(INCIDENT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Patrulla Actuante:*
                  </label>
                  <select
                    value={newPatrolId}
                    onChange={e => setNewPatrolId(e.target.value as PatrolId)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    {patrols.map(p => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name.replace('ADIF - ', '')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Título Breve de la Novedad:*
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Presencia de intrusos en gálibo ferroviario"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Ubicación / Estación / Tramo:*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Estación Castelldefels Platja, vía mango"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PK en Vía:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: PK 652+300"
                    value={newPk}
                    onChange={e => setNewPk(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nivel de Gravedad:*
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['baja', 'media', 'alta', 'critica'] as IncidentSeverity[]).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setNewSeverity(sev)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border capitalize transition-all ${
                        newSeverity === sev 
                          ? sev === 'critica' ? 'bg-rose-600 text-white border-rose-600' :
                            sev === 'alta' ? 'bg-orange-600 text-white border-orange-600' :
                            sev === 'media' ? 'bg-amber-500 text-white border-amber-500' :
                            'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descripción Detallada de los Hechos:*
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Relato cronológico de lo observado durante la patrulla..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Medidas Adoptadas / Actuación:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Aviso a CECOM ADIF, desalojo de personas, precintado de acceso..."
                  value={newActionsTaken}
                  onChange={e => setNewActionsTaken(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Registrar Novedad'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
