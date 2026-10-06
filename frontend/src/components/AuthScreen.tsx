import React, { useState, useEffect } from 'react';
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
  Info,
  Clock,
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
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, inactivityNotice }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form states - Limpios por defecto sin datos ficticios
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* LEFT COLUMN: AUTH CARD */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 bg-white shadow-xl lg:shadow-none z-10">
        <div>
          {/* Top Brand Logo */}
          <div className="mb-8 sm:mb-10">
            <AudiflowLogo size="md" variant="full" />
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2744] tracking-tight">
              {isRegister ? 'Crear cuenta de auditor' : 'Bienvenido de nuevo'}
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-1.5">
              {isRegister
                ? 'Registra tu perfil en la base de datos para auditar contratos y supervisar riesgos.'
                : 'Inicia sesión con una cuenta real registrada para acceder a tu plataforma.'}
            </p>
          </div>

          {/* Tab Switcher: Iniciar Sesión vs Registro */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 max-w-sm">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                !isRegister
                  ? 'bg-white text-[#0F2744] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
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
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                isRegister
                  ? 'bg-white text-[#0F2744] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Inactivity Notice */}
          {inactivityNotice && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#0F2744]">Cierre de sesión por inactividad</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">{inactivityNotice}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Lic. Eduardo Pedroza"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F2744] focus:border-transparent text-sm bg-slate-50/50 hover:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa u Organización
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ej. Corporativo Legal Global S.A."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F2744] focus:border-transparent text-sm bg-slate-50/50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rol Profesional
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F2744] focus:border-transparent text-sm bg-slate-50/50 hover:bg-white transition-colors cursor-pointer"
                  >
                    <option value="Auditor Legal Senior">Auditor Legal Senior</option>
                    <option value="Director de Control Interno">Director de Control Interno</option>
                    <option value="Oficial de Cumplimiento (Compliance)">Oficial de Cumplimiento (Compliance)</option>
                    <option value="Abogado Corporativo">Abogado Corporativo</option>
                    <option value="Analista de Riesgos Contractuales">Analista de Riesgos Contractuales</option>
                  </select>
                </div>
              </>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico Corporativo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F2744] focus:border-transparent text-sm bg-slate-50/50 hover:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F2744] focus:border-transparent text-sm bg-slate-50/50 hover:bg-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Only in Register mode) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F2744] focus:border-transparent text-sm bg-slate-50/50 hover:bg-white transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
                    className="w-4 h-4 rounded border-slate-300 text-[#0F2744] focus:ring-[#0F2744] cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Recordar sesión</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Para restablecer tu contraseña o consultar tus cuentas registradas, contacta al administrador corporativo.'
                    )
                  }
                  className="text-xs text-slate-500 hover:text-[#0F2744] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#0F2744] hover:bg-[#16385F] active:bg-[#0B1E36] disabled:opacity-70 text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md shadow-[#0F2744]/20 group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando cuenta...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 opacity-80" />
                  <span>{isRegister ? 'Registrar y Crear Cuenta' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-3 text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs text-slate-500 leading-snug">
            Autenticación segura con cifrado de credenciales y validación en base de datos.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: SHOWCASE HERO & 3D ISOMETRIC DASHBOARD PREVIEW */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-gradient-to-br from-[#EBF2F8] via-[#F3F7FA] to-[#E5EDF5] p-10 xl:p-14 flex-col justify-between relative overflow-hidden">
        {/* Subtle Tech Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#0F2744 1px, transparent 1px), radial-gradient(#0F2744 1px, #EBF2F8 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Floating Glow Orbs */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Top Content */}
        <div className="relative z-10 max-w-xl">
          <div className="inline-block mb-3">
            <span className="text-[11px] font-bold tracking-[0.22em] text-[#375A80] uppercase">
              CONTROL • ANÁLISIS • RESULTADOS
            </span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-[#0F2744] tracking-tight leading-tight">
            Decisiones confiables, resultados sólidos.
          </h2>

          <div className="w-12 h-1 bg-[#1E3E62] rounded-full my-4" />

          <p className="text-slate-600 text-sm xl:text-base leading-relaxed">
            Nuestra plataforma de auditoría integra procesos, centraliza información y transforma datos
            en conocimiento estratégico para tu organización.
          </p>

          {/* 3 Benefit Feature Points */}
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur shadow-sm border border-slate-200/60 flex items-center justify-center shrink-0 text-[#1E3E62] group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Visibilidad total</h4>
                <p className="text-xs text-slate-500 leading-normal mt-0.5">
                  Monitorea indicadores clave y el estado de tus auditorías en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur shadow-sm border border-slate-200/60 flex items-center justify-center shrink-0 text-[#1E3E62] group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Cumplimiento asegurado</h4>
                <p className="text-xs text-slate-500 leading-normal mt-0.5">
                  Evalúa, documenta y da seguimiento a cada proceso con trazabilidad y control.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur shadow-sm border border-slate-200/60 flex items-center justify-center shrink-0 text-[#1E3E62] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Riesgos bajo control</h4>
                <p className="text-xs text-slate-500 leading-normal mt-0.5">
                  Identifica riesgos, implementa acciones y fortalece el gobierno corporativo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Isometric Card / Executive Mockup */}
        <div className="relative z-10 mt-8 mb-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/70 max-w-lg ml-auto transform lg:translate-x-2 xl:translate-x-4 hover:translate-y-[-4px] transition-transform duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audiflow Live Analytics</span>
                <h3 className="text-base font-bold text-[#0F2744]">Resumen Ejecutivo</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sincronizado
              </span>
            </div>

            {/* 4 Key KPI Boxes */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Auditorías activas</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-[#0F2744]">24</span>
                  <svg className="w-14 h-5 stroke-blue-600 fill-none" viewBox="0 0 50 20">
                    <path d="M 0 16 Q 12 12, 24 14 T 50 4" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Cumplimiento</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-[#0F2744]">92%</span>
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3.5"
                        strokeDasharray="88 100"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Hallazgos</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-[#0F2744]">18</span>
                  <div className="flex items-end gap-1 h-5">
                    <div className="w-1.5 bg-blue-300 rounded-t h-2" />
                    <div className="w-1.5 bg-blue-400 rounded-t h-3" />
                    <div className="w-1.5 bg-blue-500 rounded-t h-4" />
                    <div className="w-1.5 bg-blue-600 rounded-t h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Riesgos críticos</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-rose-600">5</span>
                  <svg className="w-14 h-5 stroke-rose-500 fill-none" viewBox="0 0 50 20">
                    <path d="M 0 12 Q 12 16, 25 8 T 50 6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Evolución de Auditorías Chart */}
            <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Evolución de Auditorías</span>
                <span className="text-[10px] text-slate-400">Ene - Jun 2026</span>
              </div>
              <div className="h-20 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 70">
                  <line x1="0" y1="15" x2="300" y2="15" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="0" y1="35" x2="300" y2="35" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="0" y1="55" x2="300" y2="55" stroke="#E2E8F0" strokeDasharray="3 3" />

                  <path
                    d="M 10 50 L 60 42 L 120 32 L 180 38 L 240 22 L 290 14"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 10 58 L 60 52 L 120 48 L 180 44 L 240 38 L 290 30"
                    fill="none"
                    stroke="#93C5FD"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="290" cy="14" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="240" cy="22" r="3" fill="#2563EB" />
                  <circle cx="180" cy="38" r="3" fill="#2563EB" />
                </svg>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-1">
                <span>Ene</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>

            {/* 3D Isometric Accent Elements */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[11px] font-medium text-slate-600">Supervisión Continua Activa</span>
              </div>
              <span className="text-[11px] font-bold text-[#0F2744]">99.9% Trazabilidad</span>
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
                activeSlide === idx ? 'w-6 bg-[#0F2744]' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
          <span className="text-xs text-slate-400 ml-2">Audiflow Intelligence v3.8</span>
        </div>
      </div>
    </div>
  );
};
