/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Patrol, 
  PatrolId, 
  Officer, 
  ShiftAssignment, 
  ViewMode, 
  ShiftCode,
  AppUser,
  Incident,
  IncidentStatus
} from './types/quadrant';
import { 
  INITIAL_PATROLS, 
  INITIAL_OFFICERS, 
  INITIAL_INCIDENTS,
  generateSeedAssignments, 
  SHIFT_DEFINITIONS 
} from './data/initialData';
import { getMonthDays, formatMonthName, DayInfo } from './utils/dateUtils';
import { detectAllConflicts } from './utils/conflicts';
import { downloadOfficialPdf } from './utils/exportPdf';

import { Header } from './components/Header';
import { OfficerServiceBar } from './components/OfficerServiceBar';
import { ConflictBanner } from './components/ConflictBanner';
import { PatrolGeneralView } from './components/PatrolGeneralView';
import { IndividualView } from './components/IndividualView';
import { GlobalMatrixView } from './components/GlobalMatrixView';
import { ShiftEditModal } from './components/ShiftEditModal';
import { ConflictAlertsModal } from './components/ConflictAlertsModal';
import { QuickFillModal } from './components/QuickFillModal';
import { ExportModal } from './components/ExportModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AuditLogDrawer, AuditLogEntry } from './components/AuditLogDrawer';
import { AdminChatDrawer, ChatMessage, OnlineUser } from './components/AdminChatDrawer';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { InstallAppModal } from './components/InstallAppModal';
import { PkFinderModal } from './components/PkFinderModal';
import { PatrolChiefWorkspaceModal } from './components/PatrolChiefWorkspaceModal';
import { OfficerDirectoryModal } from './components/OfficerDirectoryModal';
import { IncidentsModal } from './components/IncidentsModal';
import { RailwayDictionaryModal } from './components/RailwayDictionaryModal';
import { loadPointsFromIndexedDB, savePointsToIndexedDB } from './utils/pkStorage';
import { pkSyncService } from './services/pkSyncService';

const SESSION_KEY = 'adif_admin_session_v2';

export default function App() {
  const [patrols] = useState<Patrol[]>(INITIAL_PATROLS);
  const [officers, setOfficers] = useState<Officer[]>(INITIAL_OFFICERS);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Admin simulator toggle (allows administrators to test the exact non-admin experience)
  const [isSimulatingOfficer, setIsSimulatingOfficer] = useState(false);
  const isEffectiveAdmin = Boolean(currentUser?.isAdmin && !isSimulatingOfficer);

  // Incidents state
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [isIncidentsOpen, setIsIncidentsOpen] = useState(false);

  // Month navigation: default to October 2026
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(10);

  // Navigation views: 'patrol' (general 4 patrullas) | 'individual' (por vigilante) | 'global'
  const [currentView, setCurrentView] = useState<ViewMode>('patrol');
  const [activePatrolId, setActivePatrolId] = useState<PatrolId>('p1');
  const [activeOfficerId, setActiveOfficerId] = useState<string>('of-ruiz-ortiz');

  // Multi-device synced assignments
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(() => generateSeedAssignments());

  // Real-time Chat & Audit State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Drawers and Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [editingDay, setEditingDay] = useState<DayInfo | null>(null);

  const [isConflictsModalOpen, setIsConflictsModalOpen] = useState(false);
  const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isPkFinderOpen, setIsPkFinderOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isOfficerDirectoryOpen, setIsOfficerDirectoryOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);

  // Fetch full state from backend to sync across devices
  const fetchBackendData = useCallback(async () => {
    try {
      const [quadrantRes, auditRes, chatRes, presenceRes, officersRes, incidentsRes] = await Promise.all([
        fetch('/api/quadrant').catch(() => null),
        fetch('/api/audit-logs').catch(() => null),
        fetch('/api/chat').catch(() => null),
        fetch('/api/presence').catch(() => null),
        fetch('/api/officers').catch(() => null),
        fetch('/api/incidents').catch(() => null)
      ]);

      if (quadrantRes && quadrantRes.ok) {
        const qData = await quadrantRes.json();
        if (Array.isArray(qData.assignments)) {
          setAssignments(qData.assignments);
        }
      }

      if (auditRes && auditRes.ok) {
        const aData = await auditRes.json();
        if (Array.isArray(aData.logs)) {
          setAuditLogs(aData.logs);
        }
      }

      if (chatRes && chatRes.ok) {
        const cData = await chatRes.json();
        if (Array.isArray(cData.messages)) {
          setChatMessages(cData.messages);
        }
      }

      if (presenceRes && presenceRes.ok) {
        const pData = await presenceRes.json();
        if (Array.isArray(pData.onlineUsers)) {
          setOnlineUsers(pData.onlineUsers);
        }
      }

      if (officersRes && officersRes.ok) {
        const oData = await officersRes.json();
        if (Array.isArray(oData.officers) && oData.officers.length > 0) {
          setOfficers(oData.officers);
        }
      }

      if (incidentsRes && incidentsRes.ok) {
        const iData = await incidentsRes.json();
        if (Array.isArray(iData.incidents) && iData.incidents.length > 0) {
          setIncidents(iData.incidents);
        }
      }

      // Initialize persistent PK background synchronization service
      // Verifies IndexedDB against server and ensures 12,000 points stay persistent across connections
      pkSyncService.init();
    } catch (e) {
      // Backend sync fallback
    }
  }, []);

  // Incident handlers
  const handleAddIncident = async (newIncidentData: Omit<Incident, 'id' | 'timestamp' | 'status'>) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncidentData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.incident) {
          setIncidents(prev => [data.incident, ...prev]);
          return;
        }
      }
    } catch (e) {
      console.error('Error adding incident:', e);
    }
    const fallback: Incident = {
      ...newIncidentData,
      id: `inc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'abierta'
    };
    setIncidents(prev => [fallback, ...prev]);
  };

  const handleUpdateIncidentStatus = async (id: string, status: IncidentStatus, actionsTaken?: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, actionsTaken })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.incident) {
          setIncidents(prev => prev.map(i => i.id === id ? data.incident : i));
          return;
        }
      }
    } catch (e) {
      console.error('Error updating incident status:', e);
    }
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status, actionsTaken: actionsTaken || i.actionsTaken } : i));
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting incident:', e);
    }
    setIncidents(prev => prev.filter(i => i.id !== id));
  };

  const handleDownloadOfficerPdf = async () => {
    const targetOfficerId = activeOfficerId || currentUser?.officerId || 'of-ruiz-ortiz';
    const endpoint = `/api/pdf/officer/${targetOfficerId}?month=${month}&year=${year}`;
    const filename = `Cuadrante_Individual_${currentUser?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'ADIF'}_${monthName}_${year}.pdf`;
    await downloadOfficialPdf(endpoint, filename);
  };

  // Officer CRUD handlers
  const handleUpdateOfficer = async (updated: Officer) => {
    try {
      const res = await fetch(`/api/officers/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updated,
          adminEmail: currentUser?.email,
          adminName: currentUser?.name
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.officer) {
          setOfficers(prev => prev.map(o => o.id === data.officer.id ? data.officer : o));
          return;
        }
      }
    } catch (e) {
      console.error('Error updating officer:', e);
    }
    setOfficers(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const handleCreateOfficer = async (newOfficer: Officer) => {
    try {
      const res = await fetch('/api/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOfficer,
          adminEmail: currentUser?.email,
          adminName: currentUser?.name
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.officer) {
          setOfficers(prev => [...prev, data.officer]);
          return;
        }
      }
    } catch (e) {
      console.error('Error creating officer:', e);
    }
    setOfficers(prev => [...prev, newOfficer]);
  };

  const handleDeleteOfficer = async (officerId: string) => {
    try {
      const res = await fetch(`/api/officers/${officerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: currentUser?.email,
          adminName: currentUser?.name
        })
      });
      if (res.ok) {
        setOfficers(prev => prev.filter(o => o.id !== officerId));
        return;
      }
    } catch (e) {
      console.error('Error deleting officer:', e);
    }
    setOfficers(prev => prev.filter(o => o.id !== officerId));
  };

  // Send presence heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, name: currentUser.name })
      });
    } catch {}
  }, [currentUser]);

  // Periodic multi-device polling sync (every 3.5 seconds)
  useEffect(() => {
    fetchBackendData();
    sendHeartbeat();

    const interval = setInterval(() => {
      fetchBackendData();
      sendHeartbeat();
    }, 3500);

    return () => clearInterval(interval);
  }, [fetchBackendData, sendHeartbeat]);

  // Save login session
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {}

    // If regular officer (non-admin), direct straight to their own quadrant
    if (!user.isAdmin) {
      if (user.officerId) {
        setActiveOfficerId(user.officerId);
      }
      if (user.defaultPatrolId) {
        setActivePatrolId(user.defaultPatrolId);
      }
      setCurrentView('individual');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  // Days in selected month
  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const monthName = useMemo(() => formatMonthName(year, month), [year, month]);

  // Conflict Detection across all assignments
  const allConflicts = useMemo(() => {
    return detectAllConflicts(assignments, officers, patrols);
  }, [assignments, officers, patrols]);

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  // Open Shift Editor Modal when clicking any cell in Patrol General view or Individual view
  const handleCellClick = (officer: Officer, dayInfo: DayInfo) => {
    if (!isEffectiveAdmin) {
      // Non-admin personnel strictly in read-only mode
      return;
    }
    setEditingOfficer(officer);
    setEditingDay(dayInfo);
    setIsShiftModalOpen(true);
  };

  // Bidirectional Save / Update Handler with server sync & audit log
  const handleSaveAssignment = async (updatedAsg: Partial<ShiftAssignment> & { id?: string }) => {
    try {
      const res = await fetch('/api/quadrant/assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment: updatedAsg,
          adminEmail: currentUser?.email || 'admin@ilunion.com',
          adminName: currentUser?.name || 'Administrador'
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistic local update
        setAssignments(prev => {
          if (updatedAsg.id) {
            return prev.map(a => a.id === updatedAsg.id ? data.assignment : a);
          } else {
            return [...prev, data.assignment];
          }
        });
        if (data.logEntry) {
          setAuditLogs(prev => [data.logEntry, ...prev]);
        }
      }
    } catch {
      // Fallback local update
      setAssignments(prev => {
        if (updatedAsg.id) {
          return prev.map(a => a.id === updatedAsg.id ? ({ ...a, ...updatedAsg } as ShiftAssignment) : a);
        } else {
          const fallback: ShiftAssignment = {
            id: `asg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            officerId: updatedAsg.officerId!,
            date: updatedAsg.date!,
            shiftCode: updatedAsg.shiftCode || '18-06',
            patrolId: updatedAsg.patrolId ?? null,
            startTime: updatedAsg.startTime || '18:00',
            endTime: updatedAsg.endTime || '06:00',
            hours: updatedAsg.hours ?? 12,
            role: updatedAsg.role,
            notes: updatedAsg.notes,
            isAuthorizedDouble: updatedAsg.isAuthorizedDouble
          };
          return [...prev, fallback];
        }
      });
    }
  };

  // Delete Assignment Handler with server sync & audit log
  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/quadrant/assignment/${assignmentId}?adminEmail=${encodeURIComponent(currentUser?.email || '')}&adminName=${encodeURIComponent(currentUser?.name || '')}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const data = await res.json();
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        if (data.logEntry) {
          setAuditLogs(prev => [data.logEntry, ...prev]);
        }
      }
    } catch {
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    }
  };

  // Step-by-step Audit Revert / Rollback Handler
  const handleRevertLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/audit-logs/${logId}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: currentUser?.email,
          adminName: currentUser?.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.assignments) setAssignments(data.assignments);
        if (data.logs) setAuditLogs(data.logs);
      }
    } catch (e) {
      console.error('Error reverting log:', e);
    }
  };

  // Online Chat Send Message Handler
  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: currentUser.email,
          senderName: currentUser.name,
          text
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, data.message]);
      }
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  // Conflict Resolution: Keep one, remove conflicting others
  const handleResolveKeepOne = (keepAssignmentId: string, removeAssignmentIds: string[]) => {
    removeAssignmentIds.forEach(id => {
      handleDeleteAssignment(id);
    });
  };

  // Conflict Resolution: Authorize double shift
  const handleAuthorizeDouble = (assignmentIds: string[]) => {
    const targetSet = new Set(assignmentIds);
    setAssignments(prev =>
      prev.map(a => targetSet.has(a.id) ? { ...a, isAuthorizedDouble: true } : a)
    );
  };

  // Quick Pattern Batch Applicator
  const handleApplyPattern = (newAsgs: ShiftAssignment[]) => {
    newAsgs.forEach(asg => {
      handleSaveAssignment(asg);
    });
  };

  // Reset to initial official data
  const handleResetData = async () => {
    if (window.confirm('¿Deseas restablecer todos los cuadrantes a los datos oficiales de Octubre 2026? Se registrará en la auditoría.')) {
      try {
        const res = await fetch('/api/quadrant/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminEmail: currentUser?.email,
            adminName: currentUser?.name
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.assignments) setAssignments(data.assignments);
          fetchBackendData();
        }
      } catch {
        setAssignments(generateSeedAssignments());
      }
    }
  };

  // Existing assignments for active editing modal
  const existingModalAssignments = useMemo(() => {
    if (!editingOfficer || !editingDay) return [];
    return assignments.filter(
      a => a.officerId === editingOfficer.id && a.date === editingDay.dateStr
    );
  }, [assignments, editingOfficer, editingDay]);

  const onlineCount = onlineUsers.filter(u => u.isOnline).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Strict Administrator Authentication Gate */}
      <AdminLoginModal
        isOpen={!currentUser}
        onLoginSuccess={handleLoginSuccess}
        officers={officers}
      />

      {/* Header bar obeying Top Bar Contract */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        conflictCount={allConflicts.length}
        onOpenConflictsModal={() => setIsConflictsModalOpen(true)}
        onOpenQuickFill={() => setIsQuickFillOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onResetData={handleResetData}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAuditLogs={() => setIsAuditOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenPkFinder={() => setIsPkFinderOpen(true)}
        onOpenWorkspace={() => setIsWorkspaceOpen(true)}
        onOpenOfficerDirectory={() => setIsOfficerDirectoryOpen(true)}
        onOpenIncidents={() => setIsIncidentsOpen(true)}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        incidentsCount={incidents.filter(i => i.status !== 'resuelta').length}
        officersCount={officers.length}
        onlineCount={onlineCount}
        auditCount={auditLogs.length}
        isSimulatingOfficer={isSimulatingOfficer}
        onToggleSimulateOfficer={() => setIsSimulatingOfficer(prev => !prev)}
      />

      {/* Non-Admin intuitive sub-menu & personal status bar */}
      {!isEffectiveAdmin && currentUser && (
        <OfficerServiceBar
          currentUser={currentUser}
          currentView={currentView}
          onViewChange={setCurrentView}
          activeOfficerId={activeOfficerId}
          onSelectOfficerForView={setActiveOfficerId}
          officers={officers}
          assignments={assignments}
          days={days}
          month={month}
          year={year}
          monthName={monthName}
          incidentsCount={incidents.filter(i => i.status !== 'resuelta').length}
          onlineCount={onlineCount}
          onOpenPkFinder={() => setIsPkFinderOpen(true)}
          onOpenIncidents={() => setIsIncidentsOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenDictionary={() => setIsDictionaryOpen(true)}
          onDownloadPdf={handleDownloadOfficerPdf}
          patrols={patrols}
        />
      )}

      {/* Prominent Overlap & Conflict Banner if any conflict is detected (Admin only) */}
      {isEffectiveAdmin && (
        <ConflictBanner
          conflicts={allConflicts}
          onOpenConflictsModal={() => setIsConflictsModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5">
        {currentView === 'patrol' && (
          <PatrolGeneralView
            patrols={patrols}
            activePatrolId={activePatrolId}
            onSelectPatrol={setActivePatrolId}
            officers={officers}
            assignments={assignments}
            days={days}
            year={year}
            month={month}
            monthName={monthName}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onCellClick={handleCellClick}
            onQuickShiftSet={(officerId, date, patrolId, shiftCode) => {
              if (!isEffectiveAdmin) return;
              handleSaveAssignment({
                officerId,
                date,
                patrolId,
                shiftCode
              });
            }}
            onOpenOfficerDirectory={() => setIsOfficerDirectoryOpen(true)}
            onSelectOfficerForView={(officerId) => {
              setActiveOfficerId(officerId);
              setCurrentView('individual');
            }}
            isReadOnly={!isEffectiveAdmin}
          />
        )}

        {currentView === 'individual' && (
          <IndividualView
            officers={officers}
            activeOfficerId={activeOfficerId}
            onSelectOfficer={setActiveOfficerId}
            patrols={patrols}
            assignments={assignments}
            days={days}
            year={year}
            month={month}
            monthName={monthName}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onCellClick={handleCellClick}
            onOpenQuickFill={() => setIsQuickFillOpen(true)}
            onOpenDirectory={() => setIsOfficerDirectoryOpen(true)}
            isReadOnly={!isEffectiveAdmin}
          />
        )}

        {currentView === 'global' && (
          <GlobalMatrixView
            patrols={patrols}
            officers={officers}
            assignments={assignments}
            days={days}
            year={year}
            month={month}
            monthName={monthName}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onCellClick={handleCellClick}
            isReadOnly={!isEffectiveAdmin}
          />
        )}
      </main>

      {/* Shift Edit / Bidirectional Assignment Modal */}
      <ShiftEditModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        officer={editingOfficer}
        date={editingDay?.dateStr || ''}
        dayNumber={editingDay?.dayNumber || 1}
        existingAssignments={existingModalAssignments}
        allAssignments={assignments}
        patrols={patrols}
        defaultPatrolId={currentView === 'patrol' ? activePatrolId : editingOfficer?.defaultPatrolId}
        onSaveAssignment={handleSaveAssignment}
        onDeleteAssignment={handleDeleteAssignment}
      />

      {/* Conflicts & Overlaps Resolution Modal */}
      <ConflictAlertsModal
        isOpen={isConflictsModalOpen}
        onClose={() => setIsConflictsModalOpen(false)}
        conflicts={allConflicts}
        patrols={patrols}
        onResolveKeepOne={handleResolveKeepOne}
        onAuthorizeDouble={handleAuthorizeDouble}
      />

      {/* Quick Pattern Applicator Modal */}
      <QuickFillModal
        isOpen={isQuickFillOpen}
        onClose={() => setIsQuickFillOpen(false)}
        officers={officers}
        patrols={patrols}
        days={days}
        onApplyPattern={handleApplyPattern}
      />

      {/* Export to CSV and Print Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        patrols={patrols}
        officers={officers}
        assignments={assignments}
        days={days}
        year={year}
        month={month}
        monthName={monthName}
      />

      {/* Install as Desktop App / Executable / Mobile Share Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        sharedUrl="https://ais-pre-oqlkncyynuxvmequimepfy-650652568102.europe-west2.run.app"
      />

      {/* Step-by-Step Audit Log Drawer with Revert */}
      <AuditLogDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        logs={auditLogs}
        onRevertLog={handleRevertLog}
        currentAdminEmail={currentUser?.email || ''}
      />

      {/* Online Administrator Chat Drawer with Presence Indicator */}
      <AdminChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onlineUsers={onlineUsers}
        onSendMessage={handleSendMessage}
        currentAdminEmail={currentUser?.email || ''}
      />

      {/* Railway PK GPS Finder Modal */}
      <PkFinderModal
        isOpen={isPkFinderOpen}
        onClose={() => setIsPkFinderOpen(false)}
        currentUser={currentUser}
        onOpenDictionary={() => {
          setIsPkFinderOpen(false);
          setIsDictionaryOpen(true);
        }}
      />

      {/* Google Workspace: Drive & Gmail Modal */}
      <PatrolChiefWorkspaceModal
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        currentAdminEmail={currentUser?.email}
      />

      {/* Officers Directory & Personal Cards Modal */}
      <OfficerDirectoryModal
        isOpen={isOfficerDirectoryOpen}
        onClose={() => setIsOfficerDirectoryOpen(false)}
        officers={officers}
        onUpdateOfficer={handleUpdateOfficer}
        onCreateOfficer={handleCreateOfficer}
        onDeleteOfficer={handleDeleteOfficer}
        patrols={patrols}
        assignments={assignments}
        currentMonth={month}
        currentYear={year}
        monthName={monthName}
        onSelectOfficerForView={(officerId) => {
          setActiveOfficerId(officerId);
          setCurrentView('individual');
          setIsOfficerDirectoryOpen(false);
        }}
        currentUser={currentUser}
      />

      {/* Incidents & Security Novedades Modal */}
      <IncidentsModal
        isOpen={isIncidentsOpen}
        onClose={() => setIsIncidentsOpen(false)}
        incidents={incidents}
        onAddIncident={handleAddIncident}
        onUpdateIncidentStatus={handleUpdateIncidentStatus}
        onDeleteIncident={handleDeleteIncident}
        currentUser={currentUser}
        patrols={patrols}
        onOpenPkFinder={() => {
          setIsIncidentsOpen(false);
          setIsPkFinderOpen(true);
        }}
        onOpenDictionary={() => {
          setIsIncidentsOpen(false);
          setIsDictionaryOpen(true);
        }}
      />

      {/* Official ADIF Railway Dictionary & AI Consultation Modal */}
      <RailwayDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        currentUser={currentUser}
      />

      {/* Interactive Guided Tutorial for Administrators */}
      {isEffectiveAdmin && currentUser && (
        <InteractiveTutorial
          currentAdminEmail={currentUser.email}
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenAuditLogs={() => setIsAuditOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenConflictsModal={() => setIsConflictsModalOpen(true)}
        />
      )}
    </div>
  );
}
