import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Clock,
  ExternalLink,
  PlusCircle,
  FileCheck,
  User as UserIcon,
  Shield,
  Sun,
  Moon,
  Monitor,
  Palette,
  CheckCircle2,
  Sparkles,
  Check,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { AudiflowLogo } from './AudiflowLogo';
import { User, KeyDeadline, ContractAudit, AppNotification } from '../types/audit';
import { UserProfileModal, UserModalTab, ThemeSetting } from './UserProfileModal';

export type NavTab = 'dashboard' | 'upload' | 'history' | 'alerts' | 'detail';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  user: User;
  onLogout: () => void;
  deadlines: KeyDeadline[];
  audits?: ContractAudit[];
  notifications?: AppNotification[];
  onSelectDeadline?: (deadline: KeyDeadline) => void;
  onSelectAuditById?: (contractId: string) => void;
  onMarkNotificationAsRead?: (id: string) => void;
  onClearNotifications?: () => void;
  onUserUpdated?: (user: User) => void;
  theme?: ThemeSetting;
  effectiveTheme?: 'light' | 'dark';
  onToggleTheme?: (targetTheme?: ThemeSetting) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogout,
  deadlines,
  audits = [],
  notifications = [],
  onSelectDeadline,
  onSelectAuditById,
  onMarkNotificationAsRead,
  onClearNotifications,
  onUserUpdated,
  theme = 'system',
  effectiveTheme = 'light',
  onToggleTheme,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'vigencias' | 'auditorias'>('all');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalTab, setUserModalTab] = useState<UserModalTab>('profile');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const openUserModal = (tab: UserModalTab) => {
    setUserModalTab(tab);
    setIsUserModalOpen(true);
    setIsProfileOpen(false);
  };

  // Motor Central de Notificaciones & Control Contractual:
  // Alimenta la campana con TODAS las alertas de vigencia, preavisos de 30 días,
  // dictámenes de auditoría y riesgos críticos de todos los contratos.
  const { allAlerts, vigenciasCount, auditoriasCount, urgentCount } = React.useMemo(() => {
    const list: Array<{
      id: string;
      category: 'vigencias' | 'auditorias';
      contractId?: string;
      title: string;
      contractTitle: string;
      badgeLabel: string;
      description: string;
      date?: string;
      urgency: 'urgent' | 'warning' | 'normal';
    }> = [];

    const now = Date.now();

    audits.forEach((audit) => {
      const expDateStr = audit.expirationDate || '2027-10-31';
      const expTime = new Date(expDateStr).getTime();
      const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

      // 1. Alerta de Vigencia y Expiración Contractual
      let vigUrgency: 'urgent' | 'warning' | 'normal' = 'normal';
      let vigBadge = 'Vigente';
      let vigDesc = `Vence el ${expDateStr} • Quedan ${diffDays} días de vigencia activa.`;

      if (diffDays < 0) {
        vigUrgency = 'urgent';
        vigBadge = 'Vencido';
        vigDesc = `El contrato venció hace ${Math.abs(diffDays)} días. Requiere renovación o finiquito formal.`;
      } else if (diffDays === 0) {
        vigUrgency = 'urgent';
        vigBadge = '¡Vence Hoy!';
        vigDesc = 'El contrato expira el día de hoy. Revisar continuidad o liquidación.';
      } else if (diffDays <= 15) {
        vigUrgency = 'urgent';
        vigBadge = 'Crítico';
        vigDesc = `Vence en ${diffDays} días. Plazo improrrogable para prórroga o terminación.`;
      } else if (diffDays <= 45) {
        vigUrgency = 'warning';
        vigBadge = 'Atención';
        vigDesc = `Vence en ${diffDays} días. Programar revisión de términos con la contraparte.`;
      }

      list.push({
        id: `vig-${audit.id}`,
        category: 'vigencias',
        contractId: audit.id,
        title: 'Vigencia & Plazo Contractual',
        contractTitle: audit.contractTitle,
        badgeLabel: vigBadge,
        description: vigDesc,
        date: expDateStr,
        urgency: vigUrgency,
      });

      // 2. Hito de Preaviso de 30 Días (formalmente exigido en cláusulas de renovación)
      const preavisoTime = expTime - (30 * 24 * 60 * 60 * 1000);
      const preavisoDateStr = new Date(preavisoTime).toISOString().split('T')[0];
      const diffPreaviso = Math.ceil((preavisoTime - now) / (1000 * 60 * 60 * 24));

      let preUrgency: 'urgent' | 'warning' | 'normal' = 'warning';
      let preBadge = 'Preaviso 30d';
      let preDesc = `Plazo formal para notificar no renovación previa: ${preavisoDateStr}.`;

      if (diffPreaviso < 0) {
        preUrgency = 'warning';
        preBadge = 'Preaviso Cumplido';
        preDesc = `La ventana de notificación de 30 días concluyó el ${preavisoDateStr}.`;
      } else if (diffPreaviso <= 15) {
        preUrgency = 'urgent';
        preBadge = 'Preaviso Urgente';
        preDesc = `Quedan ${diffPreaviso} días para remitir carta formal de preaviso (${preavisoDateStr}).`;
      } else {
        preUrgency = 'normal';
        preBadge = 'Hito Preaviso';
        preDesc = `Fecha límite de notificación previa: ${preavisoDateStr} (en ${diffPreaviso} días).`;
      }

      list.push({
        id: `preaviso-${audit.id}`,
        category: 'vigencias',
        contractId: audit.id,
        title: 'Hito de Preaviso de Renovación',
        contractTitle: audit.contractTitle,
        badgeLabel: preBadge,
        description: preDesc,
        date: preavisoDateStr,
        urgency: preUrgency,
      });

      // 3. Dictamen de Auditoría Legal Realizado
      const riskScore = audit.overallRiskScore || 0;
      let audUrgency: 'urgent' | 'warning' | 'normal' = 'normal';
      let audBadge = `Riesgo Bajo (${riskScore}/100)`;

      if (riskScore > 60) {
        audUrgency = 'urgent';
        audBadge = `Riesgo Crítico (${riskScore}/100)`;
      } else if (riskScore > 35) {
        audUrgency = 'warning';
        audBadge = `Riesgo Moderado (${riskScore}/100)`;
      }

      list.push({
        id: `audit-${audit.id}`,
        category: 'auditorias',
        contractId: audit.id,
        title: 'Dictamen de Auditoría Legal',
        contractTitle: audit.contractTitle,
        badgeLabel: audBadge,
        description: `Auditoría normativamente verificada. Cumplimiento: ${audit.complianceScore}% • ${audit.documentType || 'Contrato verificado con IA'}`,
        date: audit.auditDate || audit.effectiveDate,
        urgency: audUrgency,
      });

      // 4. Cláusulas de Riesgo Crítico si existen
      if (Array.isArray(audit.risksIdentified)) {
        audit.risksIdentified
          .filter((r) => r.severity === 'critical')
          .slice(0, 1)
          .forEach((r, rIdx) => {
            list.push({
              id: `risk-${audit.id}-${rIdx}`,
              category: 'auditorias',
              contractId: audit.id,
              title: r.title || 'Vulnerabilidad Normativa Crítica',
              contractTitle: audit.contractTitle,
              badgeLabel: 'Cláusula Observada',
              description: r.description || r.mitigation || 'Requiere ajuste en adenda formal.',
              date: audit.auditDate,
              urgency: 'urgent',
            });
          });
      }
    });

    // 5. Deadlines personalizados creados por el usuario
    deadlines.forEach((dl) => {
      list.push({
        id: `dl-${dl.id || Math.random()}`,
        category: 'vigencias',
        contractId: dl.contractId,
        title: dl.title || 'Hito Contractual',
        contractTitle: dl.contractTitle || 'Contrato Registrado',
        badgeLabel:
          dl.daysRemaining !== undefined && dl.daysRemaining <= 0
            ? 'Vence Hoy'
            : `${dl.daysRemaining ?? 'Próximo'} días`,
        description: dl.description || 'Plazo programado en calendario.',
        date: dl.date,
        urgency: dl.urgency || 'normal',
      });
    });

    const vCount = list.filter((a) => a.category === 'vigencias').length;
    const aCount = list.filter((a) => a.category === 'auditorias').length;
    const uCount = list.filter((a) => a.urgency === 'urgent').length;

    // Ordenar de mayor a menor urgencia
    const urgencyOrder = { urgent: 0, warning: 1, normal: 2 };
    list.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return {
      allAlerts: list,
      vigenciasCount: vCount,
      auditoriasCount: aCount,
      urgentCount: uCount,
    };
  }, [audits, deadlines]);

  const totalBadgeCount = allAlerts.length;

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Solo se mantienen pestañas ejecutivas; las alertas de vencimiento se manejan exclusivamente mediante la campana
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Panel de Control', icon: LayoutDashboard },
    { id: 'history' as NavTab, label: 'Historial', icon: FileText },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#161617]/80 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo Brand */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => onTabChange('dashboard')}
                className="flex items-center text-left focus:outline-none cursor-pointer group"
              >
                <AudiflowLogo size="md" variant="full" dark={effectiveTheme === 'dark'} />
              </button>

              {/* Desktop Navigation Links (iOS Segmented Pill Bar) */}
              <nav className="hidden md:flex items-center bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full space-x-0.5 ml-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-xs'
                          : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Actions: Primary CTA, Theme Toggle, Alerts Bell & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Apple Action Blue Button */}
              <button
                onClick={() => onTabChange('upload')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium tracking-tight transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
                  currentTab === 'upload'
                    ? 'bg-[#005bb5] text-white shadow-sm'
                    : 'bg-[#0071e3] hover:bg-[#0077ed] text-white hover:shadow-sm'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Nueva Auditoría</span>
                <span className="sm:hidden">Auditar</span>
              </button>

              {/* Botón Rápido de Cambio de Tema (Claro / Oscuro) */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={() => onToggleTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:text-[#98989d] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all focus:outline-none cursor-pointer"
                  title={effectiveTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                  aria-label="Alternar tema claro / oscuro"
                >
                  {effectiveTheme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400 transition-transform active:rotate-90" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#86868b] transition-transform active:-rotate-90" />
                  )}
                </button>
              )}

              {/* Campana de Notificaciones & Control de Riesgos Contractuales */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`relative p-2 rounded-full transition-all focus:outline-none cursor-pointer ${
                    isNotifOpen || currentTab === 'alerts'
                      ? 'text-[#0071e3] bg-blue-50 dark:bg-blue-950/40'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:text-[#98989d] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08]'
                  }`}
                  aria-label="Campana de notificaciones y alertas"
                  title="Centro de Notificaciones y Vencimientos"
                >
                  <Bell className="w-4 h-4" />
                  {totalBadgeCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                      {urgentCount > 0 && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3b30] opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-4 w-4 ${
                          urgentCount > 0 ? 'bg-[#ff3b30]' : 'bg-[#0071e3]'
                        } text-[9px] font-bold text-white items-center justify-center shadow-xs`}
                      >
                        {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                      </span>
                    </span>
                  )}
                </button>

                {/* Centro de Notificaciones Desplegable Apple Glass */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-[410px] bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-black/[0.06] dark:border-white/[0.1] py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-[#0071e3]" />
                            Notificaciones & Vencimientos
                          </h4>
                          <p className="text-[11px] text-[#86868b] mt-0.5">
                            {totalBadgeCount > 0
                              ? `${totalBadgeCount} avisos prioritarios y plazos monitoreados`
                              : 'Todo al día en auditorías y plazos'}
                          </p>
                        </div>

                        {onClearNotifications && notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={onClearNotifications}
                            className="text-[11px] font-medium text-[#0071e3] hover:underline cursor-pointer"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>

                      {/* Filtros Píldora: Todas | Vigencias & Plazos | Auditorías & Riesgos */}
                      <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-full mt-2.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setNotifFilter('all')}
                          className={`flex-1 py-1 rounded-full text-center font-medium transition-all cursor-pointer ${
                            notifFilter === 'all'
                              ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                          }`}
                        >
                          Todas ({allAlerts.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifFilter('vigencias')}
                          className={`flex-1 py-1 rounded-full text-center font-medium transition-all cursor-pointer ${
                            notifFilter === 'vigencias'
                              ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                          }`}
                        >
                          Vigencias & Plazos ({vigenciasCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifFilter('auditorias')}
                          className={`flex-1 py-1 rounded-full text-center font-medium transition-all cursor-pointer ${
                            notifFilter === 'auditorias'
                              ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                          }`}
                        >
                          Auditorías & Riesgos ({auditoriasCount})
                        </button>
                      </div>
                    </div>

                    {/* Lista Dinámica Centralizada de Notificaciones y Plazos */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                      {allAlerts
                        .filter((a) => notifFilter === 'all' || a.category === notifFilter)
                        .map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (item.contractId && onSelectAuditById) {
                                onSelectAuditById(item.contractId);
                              }
                              setIsNotifOpen(false);
                            }}
                            className="p-3.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`p-1.5 rounded-full shrink-0 ${
                                  item.urgency === 'urgent'
                                    ? 'bg-red-100 dark:bg-red-950/60 text-[#ff3b30]'
                                    : item.urgency === 'warning'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-[#ff9500]'
                                    : item.category === 'auditorias'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-[#34c759]'
                                    : 'bg-blue-100 dark:bg-blue-950/60 text-[#0071e3]'
                                }`}
                              >
                                {item.urgency === 'urgent' ? (
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                ) : item.urgency === 'warning' ? (
                                  <Clock className="w-3.5 h-3.5" />
                                ) : item.category === 'auditorias' ? (
                                  <Sparkles className="w-3.5 h-3.5" />
                                ) : (
                                  <Calendar className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                                    {item.contractTitle}
                                  </p>
                                  <span
                                    className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full shrink-0 ${
                                      item.urgency === 'urgent'
                                        ? 'bg-red-100 dark:bg-red-950/70 text-[#ff3b30]'
                                        : item.urgency === 'warning'
                                        ? 'bg-amber-100 dark:bg-amber-950/70 text-[#ff9500]'
                                        : 'bg-blue-100 dark:bg-blue-950/70 text-[#0071e3]'
                                    }`}
                                  >
                                    {item.badgeLabel}
                                  </span>
                                </div>
                                <p className="text-[11px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mt-0.5 truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] mt-0.5 line-clamp-2">
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#0071e3] font-medium">
                                  <span>Abrir expediente ➔</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Estado Vacío */}
                      {allAlerts.filter((a) => notifFilter === 'all' || a.category === notifFilter).length === 0 && (
                        <div className="p-8 text-center text-[#86868b] text-xs">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#34c759] opacity-70" />
                          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                            Sin alertas pendientes
                          </p>
                          <p className="text-[11px] mt-1">
                            No hay avisos o contratos pendientes en esta categoría.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer con acceso al Calendario */}
                    <div className="px-4 pt-2.5 pb-1 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          onTabChange('alerts');
                          setIsNotifOpen(false);
                        }}
                        className="text-xs font-medium text-[#0071e3] hover:text-[#0077ed] flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver calendario de plazos</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <span className="text-[10px] text-[#86868b]">Monitoreo 2026</span>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Menu */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors focus:outline-none cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden shadow-xs">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : 'A'
                    )}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-[#86868b] font-normal leading-tight">
                      {user.role}
                    </span>
                  </div>
                </button>

                {/* Profile Dropdown con las Funciones Principales */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-black/[0.06] dark:border-white/[0.1] py-2 z-50 animate-in fade-in duration-150">
                    {/* Encabezado del Usuario */}
                    <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden shadow-xs">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name ? user.name.charAt(0).toUpperCase() : 'A'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{user.name}</p>
                          <p className="text-[11px] text-[#86868b] truncate">{user.email}</p>
                          <p className="text-[10px] text-[#0071e3] font-medium truncate mt-0.5">{user.role}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b]">
                        <FileCheck className="w-3 h-3 text-[#0071e3]" />
                        <span>{user.company}</span>
                      </div>
                    </div>

                    {/* Acciones 100% Funcionales */}
                    <div className="p-1.5 space-y-0.5">
                      {/* 1. Editar Perfil */}
                      <button
                        type="button"
                        onClick={() => openUserModal('profile')}
                        className="w-full text-left px-3 py-2 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl font-medium flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0071e3] flex items-center justify-center shrink-0">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Editar Perfil</p>
                          <p className="text-[10px] text-[#86868b]">Nombre, foto y cargo</p>
                        </div>
                      </button>

                      {/* 2. Configuración de Seguridad */}
                      <button
                        type="button"
                        onClick={() => openUserModal('security')}
                        className="w-full text-left px-3 py-2 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl font-medium flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#34c759] flex items-center justify-center shrink-0">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Seguridad</p>
                          <p className="text-[10px] text-[#86868b]">Cambiar contraseña de acceso</p>
                        </div>
                      </button>

                      {/* 3. Tema & Apariencia */}
                      <button
                        type="button"
                        onClick={() => openUserModal('theme')}
                        className="w-full text-left px-3 py-2 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl font-medium flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#5856d6] flex items-center justify-center shrink-0">
                            <Palette className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Apariencia</p>
                            <p className="text-[10px] text-[#86868b]">Claro u Oscuro</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-[#0071e3] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                          {theme === 'system' ? 'Auto' : theme === 'dark' ? 'Oscuro' : 'Claro'}
                        </span>
                      </button>

                      {/* Selector Rápido de Tema (1 clic directo en el menú) */}
                      <div className="px-2 pt-1 pb-1">
                        <div className="grid grid-cols-3 gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.08] rounded-xl">
                          <button
                            type="button"
                            onClick={() => onToggleTheme?.('light')}
                            className={`py-1 text-[11px] font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                              theme === 'light'
                                ? 'bg-white text-[#1d1d1f] shadow-xs'
                                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                            }`}
                          >
                            <Sun className="w-3 h-3 text-amber-500" />
                            <span>Claro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleTheme?.('dark')}
                            className={`py-1 text-[11px] font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                              theme === 'dark'
                                ? 'bg-[#2c2c2e] text-white shadow-xs'
                                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                            }`}
                          >
                            <Moon className="w-3 h-3 text-[#2997ff]" />
                            <span>Oscuro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleTheme?.('system')}
                            className={`py-1 text-[11px] font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                              theme === 'system'
                                ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                            }`}
                          >
                            <Monitor className="w-3 h-3 text-[#0071e3]" />
                            <span>Auto</span>
                          </button>
                        </div>
                      </div>

                      </div>

                    {/* 4. Cerrar Sesión */}
                    <div className="border-t border-black/[0.06] dark:border-white/[0.08] p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#ff3b30] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-medium flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Hamburger Toggle */}
              <div className="flex md:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:text-[#98989d] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] focus:outline-none cursor-pointer"
                  aria-label="Abrir menú móvil"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-2 shadow-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#0071e3] text-white shadow-xs'
                      : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#86868b]'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}

            <div className="pt-2 pb-1 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openUserModal('profile');
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-[#0071e3]" />
                <span>Editar Perfil</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openUserModal('security');
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-[#34c759]" />
                <span>Seguridad</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openUserModal('theme');
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#5856d6]" />
                  <span>Modo Claro / Oscuro</span>
                </div>
                <span className="text-[10px] text-[#0071e3] font-medium">
                  {theme === 'dark' ? 'Oscuro' : 'Claro'}
                </span>
              </button>
            </div>

            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-semibold text-xs overflow-hidden shadow-xs">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1d1d1f] dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-[#86868b]">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[#ff3b30] bg-red-50 dark:bg-red-950/40 hover:bg-red-100 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modal de Usuario Funcional (1. Editar Perfil, 2. Seguridad, 3. Tema & Apariencia) */}
      <UserProfileModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={user}
        initialTab={userModalTab}
        onUserUpdated={(updatedUser) => {
          onUserUpdated?.(updatedUser);
        }}
        onLogout={onLogout}
        currentTheme={theme}
        effectiveTheme={effectiveTheme}
        onThemeChange={(newTheme) => {
          onToggleTheme?.(newTheme);
        }}
      />
    </>
  );
};
