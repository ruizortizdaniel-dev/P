import React, { useState, useMemo } from 'react';
import { 
  X, 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Share2, 
  Edit3, 
  Check, 
  FileText, 
  Save, 
  Plus,
  Trash2,
  Copy,
  Eye,
  AlertCircle,
  Clock,
  Shield,
  Filter
} from 'lucide-react';
import { Officer, Patrol, PatrolId, ShiftAssignment } from '../types/quadrant';
import { 
  buildOfficerQuadrantShareText, 
  openWhatsApp, 
  openEmail,
  copyQuadrantText 
} from '../utils/shareQuadrant';

interface OfficerDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  officers: Officer[];
  onUpdateOfficer: (updatedOfficer: Officer) => Promise<void>;
  onCreateOfficer?: (newOfficer: Officer) => Promise<void>;
  onDeleteOfficer?: (officerId: string) => Promise<void>;
  patrols: Patrol[];
  assignments: ShiftAssignment[];
  currentMonth: number;
  currentYear: number;
  monthName: string;
  onSelectOfficerForView?: (officerId: string) => void;
  currentUser: { email: string; name: string; role: string } | null;
}

export const OfficerDirectoryModal: React.FC<OfficerDirectoryModalProps> = ({
  isOpen,
  onClose,
  officers,
  onUpdateOfficer,
  onCreateOfficer,
  onDeleteOfficer,
  patrols,
  assignments,
  currentMonth,
  currentYear,
  monthName,
  onSelectOfficerForView,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatrolFilter, setSelectedPatrolFilter] = useState<string>('all');
  
  // Edit State
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [badgeInput, setBadgeInput] = useState('');
  const [patrolInput, setPatrolInput] = useState<PatrolId>('p1');
  const [rankInput, setRankInput] = useState<'Vigilante' | 'Jefe de Equipo' | 'Inspector'>('Vigilante');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // New Officer State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newPatrol, setNewPatrol] = useState<PatrolId>('p1');
  const [newRank, setNewRank] = useState<'Vigilante' | 'Jefe de Equipo' | 'Inspector'>('Vigilante');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Preview Message State
  const [previewOfficer, setPreviewOfficer] = useState<Officer | null>(null);
  const [copiedOfficerId, setCopiedOfficerId] = useState<string | null>(null);

  const patrolMap = useMemo(() => new Map(patrols.map(p => [p.id, p])), [patrols]);

  // Statistics
  const stats = useMemo(() => {
    const total = officers.length;
    const withPhone = officers.filter(o => Boolean(o.phone && o.phone.trim())).length;
    const withEmail = officers.filter(o => Boolean(o.email && o.email.trim())).length;
    const complete = officers.filter(o => Boolean(o.phone && o.phone.trim() && o.email && o.email.trim())).length;
    return { total, withPhone, withEmail, complete };
  }, [officers]);

  // Filter officers
  const filteredOfficers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return officers.filter(o => {
      const matchText = 
        !term ||
        o.name.toLowerCase().includes(term) ||
        o.badgeNumber.toLowerCase().includes(term) ||
        (o.phone && o.phone.toLowerCase().includes(term)) ||
        (o.email && o.email.toLowerCase().includes(term)) ||
        o.rank.toLowerCase().includes(term);

      const matchPatrol = 
        selectedPatrolFilter === 'all' || 
        o.defaultPatrolId === selectedPatrolFilter;

      return matchText && matchPatrol;
    });
  }, [officers, searchTerm, selectedPatrolFilter]);

  const handleStartEdit = (officer: Officer) => {
    setEditingOfficer(officer);
    setNameInput(officer.name);
    setBadgeInput(officer.badgeNumber);
    setPatrolInput(officer.defaultPatrolId);
    setRankInput(officer.rank);
    setPhoneInput(officer.phone || '');
    setEmailInput(officer.email || '');
    setNotesInput(officer.notes || '');
    setSaveSuccessMessage(null);
  };

  const handleSaveOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;

    setIsSaving(true);
    setSaveSuccessMessage(null);

    const updated: Officer = {
      ...editingOfficer,
      name: nameInput.trim() || editingOfficer.name,
      badgeNumber: badgeInput.trim() || editingOfficer.badgeNumber,
      defaultPatrolId: patrolInput,
      rank: rankInput,
      phone: phoneInput.trim() || undefined,
      email: emailInput.trim() || undefined,
      notes: notesInput.trim() || undefined
    };

    try {
      await onUpdateOfficer(updated);
      setSaveSuccessMessage(`Ficha de ${updated.name} actualizada correctamente.`);
      setTimeout(() => {
        setEditingOfficer(null);
        setSaveSuccessMessage(null);
      }, 900);
    } catch (err: any) {
      console.error('Error saving officer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newBadge.trim()) return;

    setIsSaving(true);
    const newOfficer: Officer = {
      id: `of-${Date.now()}`,
      name: newName.trim().toUpperCase(),
      badgeNumber: newBadge.trim(),
      defaultPatrolId: newPatrol,
      rank: newRank,
      company: '50 - ILUNION SEGURIDAD, S.A.',
      delegation: '08',
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      notes: newNotes.trim() || undefined
    };

    try {
      if (onCreateOfficer) {
        await onCreateOfficer(newOfficer);
      } else {
        await onUpdateOfficer(newOfficer);
      }
      setIsCreatingNew(false);
      setNewName('');
      setNewBadge('');
      setNewPhone('');
      setNewEmail('');
      setNewNotes('');
    } catch (err: any) {
      console.error('Error creating officer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOfficerClick = async (officer: Officer) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar la ficha de ${officer.name} (TIP: ${officer.badgeNumber})?`);
    if (!confirmDelete) return;

    if (onDeleteOfficer) {
      try {
        await onDeleteOfficer(officer.id);
      } catch (err) {
        console.error('Error deleting officer:', err);
      }
    }
  };

  const handleShareWhatsApp = (officer: Officer) => {
    const msg = buildOfficerQuadrantShareText(
      officer,
      currentMonth,
      currentYear,
      monthName,
      assignments,
      patrolMap
    );
    openWhatsApp(officer.phone, msg);
  };

  const handleShareEmail = (officer: Officer) => {
    const subject = `Cuadrante Oficial ADIF - ${monthName} ${currentYear} - ${officer.name} (${officer.badgeNumber})`;
    const body = buildOfficerQuadrantShareText(
      officer,
      currentMonth,
      currentYear,
      monthName,
      assignments,
      patrolMap
    ).replace(/\*/g, '');

    openEmail(officer.email, subject, body);
  };

  const handleCopyText = async (officer: Officer) => {
    const msg = buildOfficerQuadrantShareText(
      officer,
      currentMonth,
      currentYear,
      monthName,
      assignments,
      patrolMap
    );
    const success = await copyQuadrantText(msg);
    if (success) {
      setCopiedOfficerId(officer.id);
      setTimeout(() => setCopiedOfficerId(null), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base md:text-lg font-bold">
                  Fichas de Personal de los Componentes de Patrullas
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                  {officers.length} Componentes
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Directorio oficial para gestión de teléfonos, emails y envío del cuadrante oficial vía WhatsApp y Correo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingNew(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Ficha</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Total Dotación:</span>
              <strong className="font-mono text-slate-900">{stats.total}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500 font-medium">Con Teléfono / WhatsApp:</span>
              <strong className="font-mono text-emerald-700 font-bold">{stats.withPhone}</strong>
              <span className="text-[10px] text-slate-400">({Math.round((stats.withPhone / (stats.total || 1)) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-500 font-medium">Con Email:</span>
              <strong className="font-mono text-blue-700 font-bold">{stats.withEmail}</strong>
              <span className="text-[10px] text-slate-400">({Math.round((stats.withEmail / (stats.total || 1)) * 100)}%)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Mes activo: <strong>{monthName} {currentYear}</strong></span>
          </div>
        </div>

        {/* Toolbar: Search and Filter */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, TIP, teléfono o correo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Patrol Filter & Action */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">Filtrar:</span>
            <select
              value={selectedPatrolFilter}
              onChange={e => setSelectedPatrolFilter(e.target.value)}
              className="text-xs font-semibold py-2 px-3 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las Patrullas ({officers.length})</option>
              {patrols.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name.replace('ADIF - ', '')} ({officers.filter(o => o.defaultPatrolId === p.id).length})
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsCreatingNew(true)}
              className="sm:hidden flex items-center justify-center gap-1 py-2 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Officers Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {filteredOfficers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No se encontraron fichas de vigilantes</p>
              <p className="text-xs">Prueba con otro término de búsqueda o patrulla.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredOfficers.map(officer => {
                const patrol = patrolMap.get(officer.defaultPatrolId);
                const hasPhone = Boolean(officer.phone && officer.phone.trim());
                const hasEmail = Boolean(officer.email && officer.email.trim());
                const isCopied = copiedOfficerId === officer.id;

                return (
                  <div
                    key={officer.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Top Bar: TIP & Patrol badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            TIP {officer.badgeNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {officer.rank}
                          </span>
                        </div>

                        {patrol && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            patrol.id === 'p1' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            patrol.id === 'p2' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            patrol.id === 'p3' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                            'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {patrol.code}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-xs font-extrabold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                        {officer.name}
                      </h3>

                      {/* Phone & Email contact info cards */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        {/* Phone */}
                        <div className={`flex items-center justify-between gap-1 p-2 rounded-lg border ${
                          hasPhone ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Phone className={`w-3.5 h-3.5 shrink-0 ${hasPhone ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className={`font-mono text-[11px] truncate ${hasPhone ? 'font-bold text-slate-900' : 'italic text-slate-400'}`}>
                              {officer.phone || 'Sin teléfono guardado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {hasPhone ? (
                              <button
                                onClick={() => handleShareWhatsApp(officer)}
                                title={`Enviar cuadrante por WhatsApp a ${officer.phone}`}
                                className="p-1 text-emerald-700 hover:bg-emerald-200 rounded transition-colors"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(officer)}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                + Añadir
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Email */}
                        <div className={`flex items-center justify-between gap-1 p-2 rounded-lg border ${
                          hasEmail ? 'bg-blue-50/60 border-blue-200 text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className={`w-3.5 h-3.5 shrink-0 ${hasEmail ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className={`text-[11px] truncate ${hasEmail ? 'font-bold text-slate-900' : 'italic text-slate-400'}`}>
                              {officer.email || 'Sin correo guardado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {hasEmail ? (
                              <button
                                onClick={() => handleShareEmail(officer)}
                                title={`Enviar cuadrante por correo a ${officer.email}`}
                                className="p-1 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(officer)}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                + Añadir
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Notes if any */}
                        {officer.notes && (
                          <p className="text-[10px] text-slate-500 italic bg-amber-50 p-1.5 rounded border border-amber-200">
                            📝 {officer.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      {/* WhatsApp Button */}
                      <button
                        onClick={() => {
                          if (!hasPhone) {
                            handleStartEdit(officer);
                          } else {
                            handleShareWhatsApp(officer);
                          }
                        }}
                        title={hasPhone ? `Enviar cuadrante por WhatsApp (${officer.phone})` : 'Añadir teléfono para enviar por WhatsApp'}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs ${
                          hasPhone 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Email Button */}
                      <button
                        onClick={() => {
                          if (!hasEmail) {
                            handleStartEdit(officer);
                          } else {
                            handleShareEmail(officer);
                          }
                        }}
                        title={hasEmail ? `Enviar cuadrante por email (${officer.email})` : 'Añadir email para enviar correo'}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs ${
                          hasEmail 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </button>

                      {/* Preview Button */}
                      <button
                        onClick={() => setPreviewOfficer(officer)}
                        title="Ver vista previa del mensaje oficial"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Text Button */}
                      <button
                        onClick={() => handleCopyText(officer)}
                        title={isCopied ? '¡Copiado al portapapeles!' : 'Copiar texto oficial del cuadrante'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleStartEdit(officer)}
                        title="Editar ficha personal (teléfono, email, datos)"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* View Individual Quadrant */}
                      {onSelectOfficerForView && (
                        <button
                          onClick={() => {
                            onSelectOfficerForView(officer.id);
                            onClose();
                          }}
                          title="Abrir hoja oficial del cuadrante"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                      )}

                      {/* Delete Officer */}
                      {onDeleteOfficer && (
                        <button
                          onClick={() => handleDeleteOfficerClick(officer)}
                          title="Eliminar esta ficha de vigilante"
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-3 px-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Formato Oficial:</span>
            <span>Los envíos de WhatsApp y Email incluyen el cómputo total de horas, vacaciones a 5,2h/día, desglose por días y enlace de descarga del PDF oficial.</span>
          </div>
          <span className="font-mono text-[10px] font-bold text-slate-600">ILUNION SEGURIDAD · ADIF BARCELONA</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EDIT OFFICER MODAL                                       */}
      {/* ======================================================== */}
      {editingOfficer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <span>Modificar Ficha Personal</span>
                </h3>
                <p className="text-xs text-slate-300">{editingOfficer.name} (TIP {editingOfficer.badgeNumber})</p>
              </div>
              <button 
                onClick={() => setEditingOfficer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOfficer} className="p-5 space-y-4 text-xs">
              {saveSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre y Apellidos:
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número de TIP / Placa:
                  </label>
                  <input
                    type="text"
                    required
                    value={badgeInput}
                    onChange={e => setBadgeInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Patrulla Asignada:
                  </label>
                  <select
                    value={patrolInput}
                    onChange={e => setPatrolInput(e.target.value as PatrolId)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {patrols.map(p => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name.replace('ADIF - ', '')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Categoría / Rango:
                  </label>
                  <select
                    value={rankInput}
                    onChange={e => setRankInput(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Vigilante">Vigilante</option>
                    <option value="Jefe de Equipo">Jefe de Equipo</option>
                    <option value="Inspector">Inspector</option>
                  </select>
                </div>
              </div>

              {/* Teléfono y WhatsApp */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <label className="block font-bold text-emerald-950 mb-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Número de Teléfono / WhatsApp:</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="Ej: +34 612 34 56 78 o 612345678"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  />
                </div>
                <p className="text-[10px] text-emerald-700 font-medium">
                  De aquí saldrá el número de destino para el envío del cuadrante por WhatsApp.
                </p>
              </div>

              {/* Correo Electrónico */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                <label className="block font-bold text-blue-950 mb-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Correo Electrónico (Email):</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Ej: nombre.apellido@ilunion.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>
                <p className="text-[10px] text-blue-700 font-medium">
                  De aquí saldrá la dirección de destino para el envío del cuadrante por correo electrónico.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observaciones / Notas Internas:
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de disponibilidad, dotación o turnicidad..."
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOfficer(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Ficha'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE NEW OFFICER MODAL                                 */}
      {/* ======================================================== */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Nueva Ficha Personal de Vigilante</span>
                </h3>
                <p className="text-xs text-slate-300">Alta de componente de patrulla para envíos de cuadrante</p>
              </div>
              <button 
                onClick={() => setIsCreatingNew(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewOfficer} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Apellidos y Nombre:*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: GARCIA LOPEZ, JUAN"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número de TIP / Placa:*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 245.890"
                    value={newBadge}
                    onChange={e => setNewBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Patrulla:*
                  </label>
                  <select
                    value={newPatrol}
                    onChange={e => setNewPatrol(e.target.value as PatrolId)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {patrols.map(p => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name.replace('ADIF - ', '')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Categoría:
                  </label>
                  <select
                    value={newRank}
                    onChange={e => setNewRank(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Vigilante">Vigilante</option>
                    <option value="Jefe de Equipo">Jefe de Equipo</option>
                    <option value="Inspector">Inspector</option>
                  </select>
                </div>
              </div>

              {/* Teléfono */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <label className="block font-bold text-emerald-950 mb-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Teléfono Móvil (WhatsApp):</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +34 612 34 56 78"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                />
                <p className="text-[10px] text-emerald-700 font-medium">
                  Se utilizará para los envíos de cuadrante por WhatsApp.
                </p>
              </div>

              {/* Email */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                <label className="block font-bold text-blue-950 mb-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Correo Electrónico (Email):</span>
                </label>
                <input
                  type="email"
                  placeholder="Ej: vigilante@ilunion.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                />
                <p className="text-[10px] text-blue-700 font-medium">
                  Se utilizará para los envíos del cuadrante por correo electrónico.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notas / Observaciones:
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de disponibilidad o contacto..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSaving ? 'Creando...' : 'Crear Ficha'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PREVIEW MESSAGE MODAL                                    */}
      {/* ======================================================== */}
      {previewOfficer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Vista Previa del Cuadrante Oficial</span>
                </h3>
                <p className="text-xs text-slate-300">
                  {previewOfficer.name} · Destino: Tel: {previewOfficer.phone || 'S/N'} | Mail: {previewOfficer.email || 'S/E'}
                </p>
              </div>
              <button 
                onClick={() => setPreviewOfficer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-3.5 rounded-xl whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed border border-slate-800">
                {buildOfficerQuadrantShareText(
                  previewOfficer,
                  currentMonth,
                  currentYear,
                  monthName,
                  assignments,
                  patrolMap
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleCopyText(previewOfficer)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedOfficerId === previewOfficer.id ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleShareWhatsApp(previewOfficer);
                      setPreviewOfficer(null);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Enviar WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      handleShareEmail(previewOfficer);
                      setPreviewOfficer(null);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Enviar Email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
