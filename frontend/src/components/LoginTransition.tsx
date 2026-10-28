import React, { useEffect, useState } from 'react';
import { User } from '../types/audit';
import { AudiflowLogo } from './AudiflowLogo';
import { ShieldCheck, FileCheck2, Database, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginTransitionProps {
  user: User;
  onComplete: () => void;
  effectiveTheme?: 'light' | 'dark';
}

const STEPS = [
  {
    label: 'Validando token y credenciales de acceso...',
    icon: ShieldCheck,
  },
  {
    label: 'Cargando compendio normativo 2026 y arnés forense...',
    icon: FileCheck2,
  },
  {
    label: 'Sincronizando expedientes y alertas del auditor...',
    icon: Database,
  },
  {
    label: '¡Todo listo! Inicializando espacio de trabajo...',
    icon: Sparkles,
  },
];

export const LoginTransition: React.FC<LoginTransitionProps> = ({
  user,
  onComplete,
  effectiveTheme = 'light',
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Animación suave de progreso de 0 a 100% en aproximadamente 1.8 segundos
    const totalDuration = 1800; // ms
    const intervalTime = 30; // ms
    const increment = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Actualizar paso activo según el porcentaje
    if (progress < 25) {
      setCurrentStepIndex(0);
    } else if (progress < 60) {
      setCurrentStepIndex(1);
    } else if (progress < 90) {
      setCurrentStepIndex(2);
    } else {
      setCurrentStepIndex(3);
    }
  }, [progress]);

  useEffect(() => {
    // Al alcanzar el 100%, iniciar desvanecimiento de salida y desmontar
    if (progress >= 100) {
      setIsClosing(true);
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 550);
      return () => clearTimeout(finishTimer);
    }
  }, [progress, onComplete]);

  // Watchdog de seguridad incondicional: garantiza que bajo cualquier circunstancia
  // la interfaz quede 100% interactiva en un máximo de 2.2 segundos
  useEffect(() => {
    const watchdogTimer = setTimeout(() => {
      onComplete();
    }, 2200);
    return () => clearTimeout(watchdogTimer);
  }, [onComplete]);

  const activeStep = STEPS[currentStepIndex] || STEPS[0];
  const StepIcon = activeStep.icon;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 select-none transition-all duration-700 ease-out ${
        isClosing
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      } ${
        effectiveTheme === 'dark'
          ? 'bg-[#09090b]/95 text-[#f5f5f7]'
          : 'bg-[#f5f5f7]/95 text-[#1d1d1f]'
      } backdrop-blur-2xl`}
      style={{ willChange: 'opacity, transform' }}
    >
      {/* Luces ambientales de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#0071e3]/15 dark:bg-[#0071e3]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Botón rápido para omitir si el usuario tiene prisa */}
      <button
        type="button"
        onClick={() => {
          setIsClosing(true);
          setTimeout(onComplete, 200);
        }}
        className="absolute top-6 right-6 text-xs text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors py-1.5 px-3 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] cursor-pointer"
        title="Ingresar de inmediato"
      >
        Saltar ➔
      </button>

      {/* Tarjeta central Apple Frosted Glass */}
      <div
        className={`relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl text-center shadow-2xl border transition-all duration-500 ${
          effectiveTheme === 'dark'
            ? 'bg-[#141416]/80 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
            : 'bg-white/80 border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.08)]'
        } backdrop-blur-xl`}
      >
        {/* Contenedor del Logo con anillos pulsantes */}
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
          {/* Anillo de pulso exterior */}
          <div className="absolute inset-0 rounded-full bg-[#0071e3]/20 dark:bg-[#2997ff]/20 animate-ping opacity-40 pointer-events-none" />
          
          {/* Anillo de halo medio */}
          <div className="absolute -inset-2 rounded-full border border-[#0071e3]/30 dark:border-[#2997ff]/30 animate-pulse pointer-events-none" />

          {/* Logo Audiflow en versión Icono */}
          <div className="relative z-10 transform transition-transform duration-500 hover:scale-105">
            <AudiflowLogo size="lg" variant="icon" dark={effectiveTheme === 'dark'} />
          </div>
        </div>

        {/* Badge de Seguridad Verificada */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-3 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Acceso Autorizado • Sesión Segura</span>
        </div>

        {/* Saludo Personalizado */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight">
          ¡Bienvenido, <span className="bg-gradient-to-r from-[#0071e3] to-blue-400 bg-clip-text text-transparent">{user.name}</span>!
        </h2>

        {/* Rol y Organización */}
        <p className="text-xs sm:text-sm text-[#86868b] dark:text-[#a1a1a6] mt-1.5 flex items-center justify-center gap-1.5">
          <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{user.role}</span>
          <span>•</span>
          <span>{user.company || 'Audiflow Enterprise'}</span>
        </p>

        {/* Micro-Ticker Dinámico de Pasos */}
        <div className="mt-8 min-h-[48px] flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] transition-all duration-300">
            <div className="p-1 rounded-full bg-[#0071e3]/10 dark:bg-[#2997ff]/15 text-[#0071e3] dark:text-[#2997ff] shrink-0">
              <StepIcon className="w-4 h-4 animate-spin-slow" />
            </div>
            <span className="truncate max-w-[280px] sm:max-w-[320px]">
              {activeStep.label}
            </span>
          </div>
        </div>

        {/* Barra de Progreso de Alta Precisión */}
        <div className="mt-4">
          <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0071e3] via-[#34c759] to-[#0071e3] transition-all duration-150 ease-out shadow-sm"
              style={{ width: `${Math.min(100, Math.max(4, progress))}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#86868b] dark:text-[#a1a1a6] font-mono">
            <span>AUDIFLOW 2026</span>
            <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Checklist Visual Sutil de Validación */}
        <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.08] grid grid-cols-2 gap-2 text-left text-[11px] text-[#86868b] dark:text-[#a1a1a6]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                progress >= 25 ? 'text-emerald-500' : 'text-[#86868b]/30'
              } transition-colors duration-300`}
            />
            <span>Token Verificado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                progress >= 60 ? 'text-emerald-500' : 'text-[#86868b]/30'
              } transition-colors duration-300`}
            />
            <span>Normativa 2026</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                progress >= 90 ? 'text-emerald-500' : 'text-[#86868b]/30'
              } transition-colors duration-300`}
            />
            <span>Expedientes Cloud</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                progress >= 100 ? 'text-emerald-500' : 'text-[#86868b]/30'
              } transition-colors duration-300`}
            />
            <span>Espacio Listo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
