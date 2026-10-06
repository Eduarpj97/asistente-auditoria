import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User as UserIcon,
  Shield,
  Palette,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Building,
  Briefcase,
  Mail,
  Sun,
  Moon,
  Monitor,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../types/audit';
import { updateUserProfile, changeUserPassword } from '../utils/authService';

export type UserModalTab = 'profile' | 'security' | 'theme';
export type ThemeSetting = 'light' | 'dark' | 'system';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  initialTab?: UserModalTab;
  onUserUpdated: (updatedUser: User) => void;
  onLogout: () => void;
  currentTheme: ThemeSetting;
  effectiveTheme?: 'light' | 'dark';
  onThemeChange: (theme: ThemeSetting) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  initialTab = 'profile',
  onUserUpdated,
  onLogout,
  currentTheme,
  effectiveTheme = 'light',
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<UserModalTab>(initialTab);

  // Sincronizar pestaña activa cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // ── 1. State: Editar Perfil ───────────────────────────────────────────────
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState(user.role || 'Auditor Legal Senior');
  const [company, setCompany] = useState(user.company || 'Firma de Auditoría');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar datos de usuario al cambiar prop
  useEffect(() => {
    setName(user.name || '');
    setRole(user.role || 'Auditor Legal Senior');
    setCompany(user.company || 'Firma de Auditoría');
    setAvatarUrl(user.avatarUrl || '');
  }, [user]);

  // Bloquear scroll de fondo mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── 2. State: Seguridad ──────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Manejador para subir foto desde archivo local
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileError('La imagen no debe superar los 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAvatarUrl(base64);
        setProfileError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar cambios de perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    const res = await updateUserProfile({
      email: user.email,
      name,
      role,
      company,
      avatarUrl,
    });

    setProfileSaving(false);
    if (res.success && res.user) {
      onUserUpdated(res.user);
      setProfileSuccess('Perfil actualizado con éxito');
      setTimeout(() => setProfileSuccess(null), 3500);
    } else {
      setProfileError(res.error || 'No se pudo actualizar el perfil.');
    }
  };

  // Guardar nueva contraseña
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (!currentPassword) {
      setPwdError('Debes ingresar tu contraseña actual.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setPwdSaving(true);
    const res = await changeUserPassword({
      email: user.email,
      current_password: currentPassword,
      new_password: newPassword,
    });
    setPwdSaving(false);

    if (res.success) {
      setPwdSuccess('Contraseña cambiada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(null), 4000);
    } else {
      setPwdError(res.error || 'Error al cambiar contraseña.');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-black/[0.06] dark:border-white/[0.1] w-full max-w-xl overflow-hidden my-auto text-[#1d1d1f] dark:text-[#f5f5f7] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header (Apple Sheet Header) ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-semibold text-base overflow-hidden shadow-xs shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase() || 'A'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                  Mi Cuenta & Ajustes
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-[#34c759]">
                  <ShieldCheck className="w-3 h-3 text-[#34c759]" />
                  Activo
                </span>
              </div>
              <p className="text-xs text-[#86868b]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Segmented Control (Pills iOS) ──────────────────────────────────── */}
        <div className="px-6 py-2">
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.08] rounded-full">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Seguridad</span>
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'theme'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Apariencia</span>
            </button>
          </div>
        </div>

        {/* ── Tab Contents ───────────────────────────────────────────────────── */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* ═════════ TAB 1: EDITAR PERFIL ═════════ */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {profileSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Foto de Perfil & Avatar */}
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      name?.charAt(0).toUpperCase() || 'A'
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full shadow-md cursor-pointer transition-transform active:scale-95"
                    title="Subir nueva foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Foto del Auditor</h4>
                  <p className="text-[11px] text-[#86868b]">
                    Personaliza la firma y foto visible en tus dictámenes (JPG o PNG, máx. 2MB).
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] hover:shadow-xs transition cursor-pointer"
                    >
                      Seleccionar imagen
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="text-xs font-medium px-2 py-1 text-[#ff3b30] hover:underline cursor-pointer"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Campos de texto */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Eduardo Pedroza"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-black/[0.06] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1c1c1e] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                      Cargo o Rol
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Ej. Auditor Legal Senior"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-black/[0.06] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1c1c1e] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                      Empresa u Organización
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Ej. Firma de Auditoría"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-black/[0.06] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1c1c1e] transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-[#86868b] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="pt-2 flex justify-end gap-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white rounded-full transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] rounded-full transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {profileSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* ═════════ TAB 2: CONFIGURACIÓN DE SEGURIDAD ═════════ */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-5">
              {pwdSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#34c759] text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}
              {pwdError && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-[#ff3b30] text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-[#ff3b30] shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-xs flex items-start gap-3">
                <Lock className="w-4 h-4 text-[#0071e3] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Seguridad de Acceso</p>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    Modifica tu clave de acceso. Asegúrate de incluir al menos 6 caracteres.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Contraseña Actual */}
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña actual"
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-black/[0.06] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1c1c1e] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer"
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-black/[0.06] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1c1c1e] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-black/[0.06] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1c1c1e] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Guardar Contraseña */}
              <div className="pt-2 flex justify-end gap-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white rounded-full transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] rounded-full transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {pwdSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          )}

          {/* ═════════ TAB 3: TEMA & APARIENCIA ═════════ */}
          {activeTab === 'theme' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0071e3] flex items-center justify-center shrink-0 mt-0.5">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                    Apariencia de la Interfaz
                  </h3>
                  <p className="text-[11px] text-[#86868b] mt-0.5 leading-relaxed">
                    Personaliza la experiencia visual entre los modos Claro, Oscuro o Automático según tu iluminación o preferencia de trabajo.
                  </p>
                </div>
              </div>

              {/* 3 Rich Interactive Preview Cards (Apple Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Opción 1: Modo Claro */}
                <div
                  onClick={() => onThemeChange('light')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    currentTheme === 'light'
                      ? 'border-[#0071e3] bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-[#0071e3]/30 shadow-xs'
                      : 'border-black/[0.06] dark:border-white/[0.1] hover:border-[#0071e3]/50 bg-white dark:bg-[#2c2c2e]'
                  }`}
                >
                  {currentTheme === 'light' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-full h-20 rounded-xl bg-[#f5f5f7] border border-black/[0.06] p-2 flex flex-col justify-between mb-3 shadow-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-black/[0.06]">
                      <div className="w-10 h-1.5 rounded-full bg-[#0071e3]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-6 rounded-lg bg-white p-1 flex items-center shadow-2xs">
                        <div className="w-full h-1 rounded-full bg-black/20" />
                      </div>
                      <div className="h-6 rounded-lg bg-white p-1 flex items-center shadow-2xs">
                        <div className="w-full h-1 rounded-full bg-[#34c759]" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Modo Claro</h4>
                    </div>
                    <p className="text-[10px] text-[#86868b] mt-1 leading-snug">
                      Diseño limpio con fondo marfil y alto contraste.
                    </p>
                  </div>
                </div>

                {/* Opción 2: Modo Oscuro */}
                <div
                  onClick={() => onThemeChange('dark')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    currentTheme === 'dark'
                      ? 'border-[#2997ff] bg-blue-950/20 ring-2 ring-[#2997ff]/30 shadow-xs'
                      : 'border-black/[0.06] dark:border-white/[0.1] hover:border-[#2997ff]/50 bg-white dark:bg-[#2c2c2e]'
                  }`}
                >
                  {currentTheme === 'dark' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2997ff] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-full h-20 rounded-xl bg-[#000000] border border-white/10 p-2 flex flex-col justify-between mb-3 shadow-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <div className="w-10 h-1.5 rounded-full bg-[#2997ff]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-6 rounded-lg bg-[#1c1c1e] p-1 flex items-center">
                        <div className="w-full h-1 rounded-full bg-white/20" />
                      </div>
                      <div className="h-6 rounded-lg bg-[#1c1c1e] p-1 flex items-center">
                        <div className="w-full h-1 rounded-full bg-[#30d158]" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-[#2997ff]" />
                      <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Modo Oscuro</h4>
                    </div>
                    <p className="text-[10px] text-[#86868b] mt-1 leading-snug">
                      Fondo negro azabache para menor fatiga visual.
                    </p>
                  </div>
                </div>

                {/* Opción 3: Automático (Sistema) */}
                <div
                  onClick={() => onThemeChange('system')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    currentTheme === 'system'
                      ? 'border-[#0071e3] bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-[#0071e3]/30 shadow-xs'
                      : 'border-black/[0.06] dark:border-white/[0.1] hover:border-[#0071e3]/50 bg-white dark:bg-[#2c2c2e]'
                  }`}
                >
                  {currentTheme === 'system' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-full h-20 rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/10 flex mb-3 shadow-xs">
                    <div className="w-1/2 h-full bg-[#f5f5f7] p-2 flex flex-col justify-between border-r border-black/[0.06]">
                      <div className="w-6 h-1.5 rounded-full bg-[#0071e3]" />
                      <div className="h-5 rounded bg-white p-0.5 flex items-center">
                        <div className="w-full h-1 rounded-full bg-black/20" />
                      </div>
                    </div>
                    <div className="w-1/2 h-full bg-[#000000] p-2 flex flex-col justify-between">
                      <div className="w-6 h-1.5 rounded-full bg-[#2997ff] ml-auto" />
                      <div className="h-5 rounded bg-[#1c1c1e] p-0.5 flex items-center">
                        <div className="w-full h-1 rounded-full bg-white/20" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-[#0071e3]" />
                      <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Automático</h4>
                    </div>
                    <p className="text-[10px] text-[#86868b] mt-1 leading-snug">
                      Sincronizado con la preferencia de tu sistema operativo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer: Cerrar Sesión & Cerrar Ventana ───────────────────── */}
        <div className="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ff3b30] hover:bg-red-50 dark:hover:bg-red-950/30 px-3.5 py-1.5 rounded-full transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white px-4 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition cursor-pointer"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
