import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building,
  BarChart3,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Clock,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { AudiflowLogo } from './AudiflowLogo';
import { User } from '../types/audit';
import {
  authenticate,
  registerAccount,
  saveActiveSession,
} from '../utils/authService';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  inactivityNotice?: string | null;
  theme?: 'light' | 'dark' | 'system';
  effectiveTheme?: 'light' | 'dark';
  onToggleTheme?: (target?: 'light' | 'dark' | 'system') => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  inactivityNotice,
  theme = 'system',
  effectiveTheme = 'light',
  onToggleTheme,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form states - Limpios por defecto sin datos simulados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Auditor Legal Senior');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa correo electrónico y contraseña.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Ingresa un formato de correo electrónico válido.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setErrorMessage('Por favor ingresa tu nombre completo.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
        return;
      }

      setIsLoading(true);
      try {
        const result = await registerAccount({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || 'Firma de Auditoría',
          role: role,
          password: password,
        });

        if (!result.success || !result.user) {
          setErrorMessage(result.error || 'No se pudo completar el registro.');
          setIsLoading(false);
          return;
        }

        saveActiveSession(result.user, rememberMe);
        setSuccessMessage('¡Cuenta registrada exitosamente!');
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 600);
      } catch (err: any) {
        setErrorMessage('Ocurrió un error al procesar el registro.');
        setIsLoading(false);
      }
    } else {
      // Flujo de Inicio de Sesión Real
      setIsLoading(true);
      try {
        const result = await authenticate(email.trim(), password);
        if (!result.success || !result.user) {
          setErrorMessage(result.error || 'Credenciales inválidas.');
          setIsLoading(false);
          return;
        }

        saveActiveSession(result.user, rememberMe);
        setSuccessMessage('¡Autenticación exitosa! Iniciando sesión...');
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 500);
      } catch (err: any) {
        setErrorMessage('Error al validar credenciales en la base de datos.');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-200">
      {/* LEFT COLUMN: AUTH CARD */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 bg-white dark:bg-[#121214] border-r border-black/[0.06] dark:border-white/[0.08] shadow-xl lg:shadow-none z-10 transition-colors">
        <div>
          {/* Top Bar: Logo + Theme Switcher */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <AudiflowLogo size="md" variant="full" />

            {/* Quick theme switcher for Auth */}
            {onToggleTheme && (
              <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full border border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => onToggleTheme('light')}
                  title="Modo claro"
                  className={`p-1.5 rounded-full transition-all ${
                    theme === 'light'
                      ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTheme('dark')}
                  title="Modo oscuro"
                  className={`p-1.5 rounded-full transition-all ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTheme('system')}
                  title="Tema del sistema"
                  className={`p-1.5 rounded-full transition-all ${
                    theme === 'system'
                      ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              {isRegister ? 'Crear cuenta de auditor' : 'Bienvenido de nuevo'}
            </h1>
            <p className="text-[#86868b] dark:text-[#a1a1a6] text-xs sm:text-sm mt-1.5 leading-relaxed">
              {isRegister
                ? 'Registra tu perfil en la base de datos para auditar contratos y supervisar riesgos.'
                : 'Inicia sesión con tu cuenta registrada para acceder a la plataforma corporativa.'}
            </p>
          </div>

          {/* Tab Switcher: Apple Segmented Pill */}
          <div className="flex bg-black/[0.05] dark:bg-white/[0.08] p-1 rounded-2xl mb-6 max-w-sm">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-xs'
                  : 'text-[#86868b] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                isRegister
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-xs'
                  : 'text-[#86868b] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Inactivity Notice */}
          {inactivityNotice && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-300">Cierre de sesión por inactividad</p>
                <p className="mt-0.5 text-amber-800/80 dark:text-amber-400/80 leading-relaxed">{inactivityNotice}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Lic. Eduardo Pedroza"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b]/60 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                    Empresa u Organización
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ej. Corporativo Legal Global S.A."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b]/60 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                    Rol Profesional
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-colors cursor-pointer"
                  >
                    <option value="Auditor Legal Senior" className="dark:bg-[#1c1c1e]">Auditor Legal Senior</option>
                    <option value="Director de Control Interno" className="dark:bg-[#1c1c1e]">Director de Control Interno</option>
                    <option value="Oficial de Cumplimiento (Compliance)" className="dark:bg-[#1c1c1e]">Oficial de Cumplimiento (Compliance)</option>
                    <option value="Abogado Corporativo" className="dark:bg-[#1c1c1e]">Abogado Corporativo</option>
                    <option value="Analista de Riesgos Contractuales" className="dark:bg-[#1c1c1e]">Analista de Riesgos Contractuales</option>
                  </select>
                </div>
              </>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                Correo Electrónico <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b]/60 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                Contraseña <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b]/60 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors cursor-pointer"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Only in Register mode) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                  Confirmar Contraseña <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b]/60 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors cursor-pointer"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            {!isRegister && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-black/20 dark:border-white/20 text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                  />
                  <span className="text-xs text-[#86868b] dark:text-[#a1a1a6]">Recordar sesión</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Para restablecer tu contraseña o consultar tus cuentas registradas, contacta al administrador corporativo.'
                    )
                  }
                  className="text-xs text-[#0071e3] hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Primary Submit Button - Apple Blue Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.99] disabled:opacity-60 text-white font-semibold rounded-full flex items-center justify-center gap-3 transition-all duration-200 shadow-sm group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 opacity-80" />
                  <span>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="pt-6 mt-6 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-3 text-[#86868b] dark:text-[#a1a1a6]">
          <ShieldCheck className="w-5 h-5 text-[#34c759] shrink-0" />
          <p className="text-xs leading-snug">
            Cifrado de extremo a extremo y validación en tiempo real en base de datos.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: SHOWCASE HERO & APPLE CARD PREVIEW */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-gradient-to-br from-[#f5f5f7] via-[#e8e8ed] to-[#d8d8de] dark:from-[#09090b] dark:via-[#121215] dark:to-[#18181c] p-10 xl:p-14 flex-col justify-between relative overflow-hidden transition-colors">
        {/* Subtle Tech Glow Orbs */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#0071e3]/10 dark:bg-[#0071e3]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Top Content */}
        <div className="relative z-10 max-w-xl">
          <div className="inline-block mb-3">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#0071e3] uppercase">
              CONTROL • ANÁLISIS • RESULTADOS
            </span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight leading-tight">
            Decisiones confiables, resultados sólidos.
          </h2>

          <div className="w-12 h-1 bg-[#0071e3] rounded-full my-4" />

          <p className="text-[#86868b] dark:text-[#a1a1a6] text-sm xl:text-base leading-relaxed">
            Nuestra plataforma de auditoría contractual integra procesos, centraliza información y transforma datos en conocimiento estratégico para tu organización.
          </p>

          {/* 3 Benefit Feature Points - Apple Glass Cards */}
          <div className="mt-8 space-y-3.5">
            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.07] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Visibilidad total</h4>
                <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] leading-normal mt-0.5">
                  Monitorea indicadores clave y el estado de tus auditorías en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.07] transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#34c759] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Cumplimiento asegurado</h4>
                <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] leading-normal mt-0.5">
                  Evalúa, documenta y da seguimiento a cada proceso con trazabilidad y control.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.07] transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-[#5856d6] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Riesgos bajo control</h4>
                <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] leading-normal mt-0.5">
                  Identifica riesgos, implementa acciones y fortalece el gobierno corporativo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Apple Glass Showcase Card */}
        <div className="relative z-10 mt-8 mb-4">
          <div className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 dark:border-white/[0.08] max-w-lg ml-auto transform lg:translate-x-2 xl:translate-x-4 hover:translate-y-[-2px] transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">Audiflow Live Analytics</span>
                <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Resumen Ejecutivo</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#34c759]/15 text-[#34c759] border border-[#34c759]/20">
                Sincronizado
              </span>
            </div>

            {/* 4 Key KPI Boxes */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl p-3 border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#86868b] dark:text-[#a1a1a6]">Auditorías activas</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">24</span>
                  <svg className="w-14 h-5 stroke-[#0071e3] fill-none" viewBox="0 0 50 20">
                    <path d="M 0 16 Q 12 12, 24 14 T 50 4" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div className="bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl p-3 border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#86868b] dark:text-[#a1a1a6]">Cumplimiento</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">92%</span>
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-black/10 dark:text-white/10" strokeWidth="3.5" />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#0071e3"
                        strokeWidth="3.5"
                        strokeDasharray="88 100"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl p-3 border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#86868b] dark:text-[#a1a1a6]">Hallazgos</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">18</span>
                  <div className="flex items-end gap-1 h-5">
                    <div className="w-1.5 bg-[#0071e3]/30 rounded-t h-2" />
                    <div className="w-1.5 bg-[#0071e3]/50 rounded-t h-3" />
                    <div className="w-1.5 bg-[#0071e3]/70 rounded-t h-4" />
                    <div className="w-1.5 bg-[#0071e3] rounded-t h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl p-3 border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#86868b] dark:text-[#a1a1a6]">Riesgos críticos</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">5</span>
                  <svg className="w-14 h-5 stroke-rose-500 fill-none" viewBox="0 0 50 20">
                    <path d="M 0 12 Q 12 16, 25 8 T 50 6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Evolución de Auditorías Chart */}
            <div className="bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl p-3 border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Evolución de Auditorías</span>
                <span className="text-[10px] text-[#86868b] dark:text-[#a1a1a6]">Ene - Jun 2026</span>
              </div>
              <div className="h-20 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 70">
                  <line x1="0" y1="15" x2="300" y2="15" stroke="currentColor" className="text-black/10 dark:text-white/10" strokeDasharray="3 3" />
                  <line x1="0" y1="35" x2="300" y2="35" stroke="currentColor" className="text-black/10 dark:text-white/10" strokeDasharray="3 3" />
                  <line x1="0" y1="55" x2="300" y2="55" stroke="currentColor" className="text-black/10 dark:text-white/10" strokeDasharray="3 3" />

                  <path
                    d="M 10 50 L 60 42 L 120 32 L 180 38 L 240 22 L 290 14"
                    fill="none"
                    stroke="#0071e3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 10 58 L 60 52 L 120 48 L 180 44 L 240 38 L 290 30"
                    fill="none"
                    stroke="#3898ec"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.5"
                  />
                  <circle cx="290" cy="14" r="3.5" fill="#0071e3" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="240" cy="22" r="3" fill="#0071e3" />
                  <circle cx="180" cy="38" r="3" fill="#0071e3" />
                </svg>
              </div>
              <div className="flex justify-between text-[9px] text-[#86868b] dark:text-[#a1a1a6] mt-1 px-1">
                <span>Ene</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>

            {/* Apple Accent Elements */}
            <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse" />
                <span className="text-[11px] font-medium text-[#86868b] dark:text-[#a1a1a6]">Supervisión Continua Activa</span>
              </div>
              <span className="text-[11px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">99.9% Trazabilidad</span>
            </div>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="relative z-10 flex items-center gap-2 pt-2">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeSlide === idx ? 'w-6 bg-[#0071e3]' : 'w-2 bg-black/20 dark:bg-white/20 hover:bg-black/40'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
          <span className="text-xs text-[#86868b] dark:text-[#a1a1a6] ml-2">Audiflow Intelligence v3.8</span>
        </div>
      </div>
    </div>
  );
};
