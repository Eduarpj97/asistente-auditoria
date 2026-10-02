import React from 'react';

interface AudiflowLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'stacked';
  dark?: boolean;
}

export const AudiflowLogo: React.FC<AudiflowLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  dark = false,
}) => {
  const iconDimensions = {
    sm: { w: 32, h: 32 },
    md: { w: 42, h: 42 },
    lg: { w: 56, h: 56 },
    xl: { w: 76, h: 76 },
  }[size];

  const primaryNavy = dark ? '#FFFFFF' : '#0F2744';
  const secondarySlate = dark ? '#94A3B8' : '#526E8C';
  const subtextSlate = dark ? '#CBD5E1' : '#64748B';

  const IconSvg = (
    <svg
      width={iconDimensions.w}
      height={iconDimensions.h}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 hover:scale-105"
      aria-label="Audiflow Logo Icon"
    >
      <defs>
        {/* Navy gradient for the main ribbon 'A' */}
        <linearGradient id="audiflow-ribbon" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1B3A60" />
          <stop offset="50%" stopColor="#122B49" />
          <stop offset="100%" stopColor="#0B1A2F" />
        </linearGradient>

        {/* Highlight for the top crest of the 'A' */}
        <linearGradient id="audiflow-crest" x1="45" y1="15" x2="75" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B679B" />
          <stop offset="100%" stopColor="#1B3A60" />
        </linearGradient>

        {/* Silver bar gradients for audit metrics */}
        <linearGradient id="bar-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="bar-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#A0AEC0" />
        </linearGradient>
      </defs>

      {/* Orbital thin trajectory arc */}
      <path
        d="M 28 55 C 28 32, 48 18, 76 22 C 86 24, 94 29, 99 35"
        stroke="#8FA0B5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 0"
        opacity="0.85"
      />
      {/* Orbital satellite node */}
      <circle cx="100" cy="35" r="4" fill="#7E92A9" />

      {/* The Main Stylized 'A' Arch - Left Leg & Crest */}
      <path
        d="M 32 96 L 56 26 C 59 18, 67 18, 70 26 L 86 64 C 78 69, 70 77, 65 84 L 58 70 L 46 96 Z"
        fill="url(#audiflow-ribbon)"
      />

      {/* Ribbon Fold Highlight Over the Apex */}
      <path
        d="M 56 26 C 59 18, 67 18, 70 26 C 73 34, 66 44, 58 54 C 54 44, 52 35, 56 26 Z"
        fill="url(#audiflow-crest)"
        opacity="0.9"
      />

      {/* Three vertical audit bar columns inside the arch */}
      {/* Bar 1 (Shortest, left) */}
      <rect x="49" y="70" width="7" height="20" rx="3.5" fill="url(#bar-grad-1)" />
      {/* Bar 2 (Medium, center) */}
      <rect x="58" y="62" width="7.5" height="28" rx="3.75" fill="url(#bar-grad-2)" />
      {/* Bar 3 (Tallest, right) */}
      <rect x="67.5" y="55" width="8" height="35" rx="4" fill="url(#bar-grad-1)" />

      {/* The sharp cutting check/swoosh piercing dynamically to the right */}
      <path
        d="M 53 96 C 64 96, 75 88, 88 74 L 108 55 C 96 68, 82 82, 60 90 L 53 96 Z"
        fill="#122B49"
      />
      <path
        d="M 64 94 C 77 91, 91 80, 108 55 C 93 69, 79 80, 64 87 Z"
        fill="#2D5284"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{IconSvg}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {IconSvg}
        <div className="mt-2">
          <div className="flex items-center justify-center font-bold tracking-tight">
            <span style={{ color: primaryNavy }} className="text-2xl font-extrabold tracking-tight">
              Audi
            </span>
            <span style={{ color: secondarySlate }} className="text-2xl font-medium">
              flow
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="h-[1px] w-6 bg-slate-300 dark:bg-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            <div className="h-[1px] w-6 bg-slate-300 dark:bg-slate-700" />
          </div>
          <p
            style={{ color: subtextSlate }}
            className="text-[9px] font-semibold tracking-[0.25em] uppercase mt-1"
          >
            Software de Auditoría
          </p>
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {IconSvg}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline tracking-tight leading-none">
          <span
            style={{ color: primaryNavy }}
            className="text-xl md:text-2xl font-extrabold tracking-tight"
          >
            Audi
          </span>
          <span
            style={{ color: secondarySlate }}
            className="text-xl md:text-2xl font-medium tracking-tight ml-0.5"
          >
            flow
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            style={{ color: subtextSlate }}
            className="text-[8.5px] md:text-[9.5px] font-semibold tracking-[0.22em] uppercase leading-tight"
          >
            Software de Auditoría
          </span>
        </div>
      </div>
    </div>
  );
};
