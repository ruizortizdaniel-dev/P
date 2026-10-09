import React, { useState } from 'react';
import { 
  Shield, 
  KeyRound, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  User, 
  Check, 
  HelpCircle,
  BadgeCheck
} from 'lucide-react';
import { AppUser, Officer, PatrolId } from '../types/quadrant';

interface AdminLoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: AppUser) => void;
  officers?: Officer[];
}

const AUTHORIZED_ADMINS = [
  {
    email: 'ruiz.ortiz.daniel@gmail.com',
    name: 'Daniel Ruiz Ortiz',
    role: 'Administrador / Inspector'
  },
  {
    email: 'sergio80bcn@gmail.com',
    name: 'Sergio Navarro Conde',
    role: 'Administrador / Supervisor'
  },
  {
    email: 'alejandrolopezavila1974ctsd@gmail.com',
    name: 'Alejandro López Ávila',
    role: 'Administrador / Coordinador'
  }
];

const SAMPLE_OFFICERS = [
  {
    email: 'lourdes.ponce@ilunion.com',
    name: 'PONCE MORALES, MARIA LOURDES',
    badgeNumber: '101.653',
    role: 'Vigilante',
    patrolCode: 'BCN-I',
    defaultPassword: '1234'
  },
  {
    email: 'domenec.ventura@ilunion.com',
    name: 'VENTURA DE SANTIAGO, DOMENEC',
    badgeNumber: '149.334',
    role: 'Vigilante',
    patrolCode: 'BCN-I',
    defaultPassword: '1234'
  },
  {
    email: 'david.fuentes@ilunion.com',
    name: 'FUENTES PALMA, DAVID',
    badgeNumber: '242.058',
    role: 'Vigilante',
    patrolCode: 'BCN-I',
    defaultPassword: '1234'
  }
];

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  officers
}) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState<'check_email' | 'enter_password' | 'create_password'>('check_email');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userBadge, setUserBadge] = useState<string | undefined>(undefined);
  const [userOfficerId, setUserOfficerId] = useState<string | undefined>(undefined);
  const [userPatrolId, setUserPatrolId] = useState<PatrolId | undefined>(undefined);
  const [isDetectedAdmin, setIsDetectedAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check email authorization & profile
  const handleCheckEmail = async (selectedEmail?: string) => {
    const targetEmail = (selectedEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      setError('Por favor, introduce o selecciona tu correo electrónico.');
      return;
    }

    setError(null);
    setLoading(true);

    const matchedAdmin = AUTHORIZED_ADMINS.find(a => a.email.toLowerCase() === targetEmail);
    const localOfficer = officers?.find(
      o => (o.email && o.email.toLowerCase() === targetEmail) ||
           (o.badgeNumber && targetEmail.includes(o.badgeNumber.replace(/\./g, '')))
    );

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });

      if (res.ok) {
        const data = await res.json();
        setEmail(targetEmail);
        setUserName(data.name || (matchedAdmin ? matchedAdmin.name : localOfficer ? localOfficer.name : targetEmail));
        setUserRole(data.role || (matchedAdmin ? matchedAdmin.role : 'Vigilante'));
        setUserBadge(data.badgeNumber || localOfficer?.badgeNumber);
        setUserOfficerId(data.officerId || localOfficer?.id);
        setUserPatrolId(data.defaultPatrolId || localOfficer?.defaultPatrolId);
        setIsDetectedAdmin(Boolean(data.isAdmin));

        // Both Admins and Non-Admins now require password!
        if (data.hasPasswordSet) {
          setStep('enter_password');
        } else {
          setStep('create_password');
        }
      } else {
        // Fallback in case of server connection issue
        setEmail(targetEmail);
        if (matchedAdmin) {
          setUserName(matchedAdmin.name);
          setUserRole(matchedAdmin.role);
          setIsDetectedAdmin(true);
          const localPwd = localStorage.getItem(`adif_pwd_${targetEmail}`);
          setStep(localPwd ? 'enter_password' : 'create_password');
        } else if (localOfficer) {
          setUserName(localOfficer.name);
          setUserRole(localOfficer.rank || 'Vigilante');
          setUserBadge(localOfficer.badgeNumber);
          setUserOfficerId(localOfficer.id);
          setUserPatrolId(localOfficer.defaultPatrolId);
          setIsDetectedAdmin(false);
          const localPwd = localStorage.getItem(`adif_pwd_${targetEmail}`) || '1234';
          setStep('enter_password');
        } else {
          setUserName(targetEmail.split('@')[0].toUpperCase());
          setUserRole('Vigilante de Servicio');
          setIsDetectedAdmin(false);
          const localPwd = localStorage.getItem(`adif_pwd_${targetEmail}`);
          setStep(localPwd ? 'enter_password' : 'create_password');
        }
      }
    } catch {
      setEmail(targetEmail);
      if (matchedAdmin) {
        setUserName(matchedAdmin.name);
        setUserRole(matchedAdmin.role);
        setIsDetectedAdmin(true);
        const localPwd = localStorage.getItem(`adif_pwd_${targetEmail}`);
        setStep(localPwd ? 'enter_password' : 'create_password');
      } else if (localOfficer) {
        setUserName(localOfficer.name);
        setUserRole(localOfficer.rank || 'Vigilante');
        setUserBadge(localOfficer.badgeNumber);
        setUserOfficerId(localOfficer.id);
        setUserPatrolId(localOfficer.defaultPatrolId);
        setIsDetectedAdmin(false);
        const localPwd = localStorage.getItem(`adif_pwd_${targetEmail}`) || '1234';
        setStep('enter_password');
      } else {
        setUserName(targetEmail.split('@')[0].toUpperCase());
        setUserRole('Vigilante de Servicio');
        setIsDetectedAdmin(false);
        const localPwd = localStorage.getItem(`adif_pwd_${targetEmail}`);
        setStep(localPwd ? 'enter_password' : 'create_password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Login with password (Admin & Non-Admin users)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Introduce tu contraseña de acceso.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(`adif_pwd_${email}`, password);
        onLoginSuccess({
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          isAdmin: Boolean(data.user.isAdmin),
          officerId: data.user.officerId || userOfficerId,
          badgeNumber: data.user.badgeNumber || userBadge,
          defaultPatrolId: data.user.defaultPatrolId || userPatrolId
        });
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (data.needsPasswordSetup) {
        setStep('create_password');
        setError('Aún no has generado tu contraseña. Configúrala a continuación.');
        return;
      }

      // Offline fallback: check local storage password or pre-seeded sample officer password
      const localPwd = localStorage.getItem(`adif_pwd_${email}`);
      const isSampleOfficer = SAMPLE_OFFICERS.some(o => o.email.toLowerCase() === email.toLowerCase());
      if ((localPwd && localPwd === password) || (isSampleOfficer && password === '1234')) {
        onLoginSuccess({
          email,
          name: userName,
          role: userRole || (isDetectedAdmin ? 'Administrador' : 'Vigilante'),
          isAdmin: isDetectedAdmin,
          officerId: userOfficerId,
          badgeNumber: userBadge,
          defaultPatrolId: userPatrolId
        });
        return;
      }

      setError(data.error || 'Contraseña incorrecta. Por favor, compruébala.');
    } catch {
      const localPwd = localStorage.getItem(`adif_pwd_${email}`);
      const isSampleOfficer = SAMPLE_OFFICERS.some(o => o.email.toLowerCase() === email.toLowerCase());
      if ((localPwd && localPwd === password) || (isSampleOfficer && password === '1234')) {
        onLoginSuccess({
          email,
          name: userName,
          role: userRole || (isDetectedAdmin ? 'Administrador' : 'Vigilante'),
          isAdmin: isDetectedAdmin,
          officerId: userOfficerId,
          badgeNumber: userBadge,
          defaultPatrolId: userPatrolId
        });
        return;
      }
      setError('Error al iniciar sesión. Comprueba tu contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // Password creation for first-time access (Admin & Non-Admin users)
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError(null);
    setLoading(true);

    localStorage.setItem(`adif_pwd_${email}`, password);

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          name: userName,
          officerId: userOfficerId,
          badgeNumber: userBadge,
          defaultPatrolId: userPatrolId
        })
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess({
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          isAdmin: Boolean(data.user.isAdmin),
          officerId: data.user.officerId || userOfficerId,
          badgeNumber: data.user.badgeNumber || userBadge,
          defaultPatrolId: data.user.defaultPatrolId || userPatrolId
        });
        return;
      }

      // Offline or fallback creation
      onLoginSuccess({
        email,
        name: userName,
        role: userRole || (isDetectedAdmin ? 'Administrador' : 'Vigilante'),
        isAdmin: isDetectedAdmin,
        officerId: userOfficerId,
        badgeNumber: userBadge,
        defaultPatrolId: userPatrolId
      });
    } catch {
      onLoginSuccess({
        email,
        name: userName,
        role: userRole || (isDetectedAdmin ? 'Administrador' : 'Vigilante'),
        isAdmin: isDetectedAdmin,
        officerId: userOfficerId,
        badgeNumber: userBadge,
        defaultPatrolId: userPatrolId
      });
    } finally {
      setLoading(false);
    }
  };

  const isCurrentSampleOfficer = SAMPLE_OFFICERS.some(o => o.email.toLowerCase() === email.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center mb-3 shadow-lg border border-blue-400/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-base sm:text-lg font-bold">
            Acceso con Contraseña · ADIF
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            ILUNION SEGURIDAD · Dotaciones y Servicios ADIF Barcelona
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email / Select Role */}
          {step === 'check_email' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Introduce tu correo electrónico:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="nombre@ilunion.com o correo personal"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheckEmail()}
                    className="flex-1 px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleCheckEmail()}
                    disabled={loading || !email.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Todos los usuarios (administradores y vigilantes) acceden con contraseña.</span>
                </p>
              </div>

              {/* Quick Admin Selection */}
              <div className="pt-2 border-t border-slate-200">
                <span className="block font-bold text-slate-700 mb-1.5 text-[11px]">
                  Acceso Administradores (con contraseña):
                </span>
                <div className="space-y-1.5">
                  {AUTHORIZED_ADMINS.map(adm => (
                    <button
                      key={adm.email}
                      type="button"
                      onClick={() => handleCheckEmail(adm.email)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-left flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{adm.name}</div>
                        <div className="text-[10px] text-slate-500">{adm.email}</div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Sample Vigilante Selection */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">
                    Acceso Vigilantes de Patrulla (con contraseña):
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Clave demo: 1234
                  </span>
                </div>
                <div className="space-y-1.5">
                  {SAMPLE_OFFICERS.map(off => (
                    <button
                      key={off.email}
                      type="button"
                      onClick={() => handleCheckEmail(off.email)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{off.name}</div>
                        <div className="text-[10px] text-slate-500">TIP {off.badgeNumber} · {off.patrolCode}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded block">
                          Vigilante
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">clave: 1234</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Enter Password (For both Admin & Non-Admin users) */}
          {step === 'enter_password' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs animate-in fade-in">
              {isDetectedAdmin ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-blue-900 font-bold">Administrador Autorizado:</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Nivel Admin
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-blue-950 block">{userName}</span>
                  <span className="text-[10px] text-blue-700 block font-mono">{email}</span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-900 font-bold">Vigilante de Servicio:</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {userBadge ? `TIP ${userBadge}` : 'Dotación ADIF'}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-950 block">{userName}</span>
                  <span className="text-[10px] text-emerald-700 block font-mono">{email}</span>

                  {isCurrentSampleOfficer && (
                    <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                      <span>Contraseña inicial preconfigurada:</span>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                        1234
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isDetectedAdmin 
                    ? 'Introduce tu contraseña de Administrador:' 
                    : 'Introduce tu contraseña de Vigilante:'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Contraseña de acceso"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('check_email');
                    setPassword('');
                    setError(null);
                  }}
                  className="px-3 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading || !password}
                  className={`flex-1 py-2.5 ${isDetectedAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('create_password');
                    setPassword('');
                    setConfirmPassword('');
                    setError(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline decoration-slate-300"
                >
                  ¿Deseas configurar o cambiar tu contraseña?
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Create / Set Password (Admin & Non-Admin) */}
          {step === 'create_password' && (
            <form onSubmit={handleCreatePassword} className="space-y-3.5 text-xs animate-in fade-in">
              <div className={`p-3 ${isDetectedAdmin ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'} border rounded-xl space-y-1`}>
                <span className={`text-[11px] ${isDetectedAdmin ? 'text-blue-900' : 'text-emerald-900'} font-bold block`}>
                  {isDetectedAdmin ? 'Configuración de Contraseña Administrador:' : 'Configuración de Contraseña Vigilante:'}
                </span>
                <span className={`text-xs font-extrabold ${isDetectedAdmin ? 'text-blue-950' : 'text-emerald-950'} block`}>
                  {userName}
                </span>
                <span className="text-[10px] text-slate-600 font-mono block">
                  {email} {userBadge ? `· TIP ${userBadge}` : ''}
                </span>
              </div>

              {/* If non-admin without officer profile linked yet, allow selecting from dotación */}
              {(!isDetectedAdmin && !userOfficerId && officers && officers.length > 0) && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Vincular con tu ficha de vigilante (opcional):
                  </label>
                  <select
                    value={userOfficerId || ''}
                    onChange={e => {
                      const selected = officers.find(o => o.id === e.target.value);
                      if (selected) {
                        setUserOfficerId(selected.id);
                        setUserName(selected.name);
                        setUserBadge(selected.badgeNumber);
                        setUserPatrolId(selected.defaultPatrolId);
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Selecciona tu nombre de la dotación --</option>
                    {officers.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.badgeNumber} · {o.name} ({o.defaultPatrolId === 'p1' ? 'BCN I' : o.defaultPatrolId === 'p2' ? 'BCN II' : 'BCN III'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nueva contraseña:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Confirma tu contraseña:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('check_email');
                    setPassword('');
                    setConfirmPassword('');
                    setError(null);
                  }}
                  className="px-3 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className={`flex-1 py-2.5 ${isDetectedAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{loading ? 'Guardando...' : 'Guardar Contraseña y Acceder'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
