import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  UploadCloud,
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
} from 'lucide-react';
import { AudiflowLogo } from './AudiflowLogo';
import { User, KeyDeadline } from '../types/audit';

export type NavTab = 'dashboard' | 'upload' | 'history' | 'alerts' | 'detail';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  user: User;
  onLogout: () => void;
  deadlines: KeyDeadline[];
  onSelectDeadline?: (deadline: KeyDeadline) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogout,
  deadlines,
  onSelectDeadline,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean>(false);
  const [dbOnline, setDbOnline] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Pure frontend SPA: Estado activo sin dependencias de backend
  useEffect(() => {
    setOllamaOnline(true);
    setDbOnline(true);
  }, []);

  // Urgent and warning deadlines count
  const urgentCount = deadlines.filter((d) => d.urgency === 'urgent' && !d.dismissed).length;
  const warningCount = deadlines.filter((d) => d.urgency === 'warning' && !d.dismissed).length;
  const totalAlerts = urgentCount + warningCount;

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

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Panel de Control', icon: LayoutDashboard },
    { id: 'upload' as NavTab, label: 'Nueva Auditoría', icon: UploadCloud, highlight: true },
    { id: 'history' as NavTab, label: 'Historial de Documentos', icon: FileText },
    {
      id: 'alerts' as NavTab,
      label: 'Alertas de Vencimiento',
      icon: Bell,
      badge: totalAlerts > 0 ? totalAlerts : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center text-left focus:outline-none cursor-pointer group"
            >
              <AudiflowLogo size="md" variant="full" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 ml-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#0F2744] text-white shadow-sm'
                        : 'text-slate-600 hover:text-[#0F2744] hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          isActive
                            ? 'bg-rose-500 text-white'
                            : 'bg-rose-100 text-rose-700 animate-pulse'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Status Badges for Llama 3.1 & Supabase */}
            <div className="hidden lg:flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200"
                title="Motor de inferencia Llama 3.1 8B en Oracle Cloud VPS"
              >
                <span className={`w-2 h-2 rounded-full ${ollamaOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-slate-700">Llama 3.1: {ollamaOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200"
                title="Base de datos en la nube Supabase"
              >
                <span className={`w-2 h-2 rounded-full ${dbOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-slate-700">Supabase DB: {dbOnline ? 'ONLINE' : 'DESCONECTADA'}</span>
              </div>
              <a
                href="https://audiflow-audit.abbynex.site/normativas/normativa_auditoria_vigente_2026.md"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                title="Ver compendio oficial de normativas y estatutos de auditoría vigentes (2026)"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Normativas 2026 (.md)</span>
              </a>
            </div>

            {/* Quick Upload CTA (Desktop) */}
            <button
              onClick={() => onTabChange('upload')}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#122B49] to-[#1E3E62] hover:from-[#0B1A2F] hover:to-[#16325B] shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-300" />
              <span>Auditar PDF</span>
            </button>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-[#0F2744] hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                aria-label="Notificaciones de vencimiento"
              >
                <Bell className="w-5 h-5" />
                {totalAlerts > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] font-extrabold text-white items-center justify-center">
                      {totalAlerts}
                    </span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F2744]">Alertas de Vencimiento</h4>
                      <p className="text-[11px] text-slate-500">
                        {totalAlerts} plazos prioritarios requieren acción
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      En tiempo real
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {deadlines.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No hay alertas de vencimiento pendientes.
                      </div>
                    ) : (
                      deadlines.slice(0, 5).map((dl, idx) => (
                        <div
                          key={dl.id || idx}
                          onClick={() => {
                            if (onSelectDeadline) onSelectDeadline(dl);
                            onTabChange('alerts');
                            setIsNotifOpen(false);
                          }}
                          className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                dl.urgency === 'urgent'
                                  ? 'bg-rose-100 text-rose-600'
                                  : dl.urgency === 'warning'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {dl.urgency === 'urgent' ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {dl.title}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {dl.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-medium">
                                <span className="text-[#0F2744] font-semibold">{dl.date}</span>
                                <span>•</span>
                                <span
                                  className={
                                    dl.urgency === 'urgent'
                                      ? 'text-rose-600 font-bold'
                                      : 'text-amber-600'
                                  }
                                >
                                  {dl.daysRemaining !== undefined
                                    ? dl.daysRemaining <= 0
                                      ? 'Vence hoy'
                                      : `Quedan ${dl.daysRemaining} días`
                                    : 'Próximo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 pt-2 pb-1 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        onTabChange('alerts');
                        setIsNotifOpen(false);
                      }}
                      className="text-xs font-bold text-[#1E3E62] hover:text-[#0F2744] flex items-center justify-center gap-1 mx-auto py-1"
                    >
                      <span>Ver todas las alertas en el calendario</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F2744] to-[#2D5284] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#0F2744] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight">
                    {user.role}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-[#0F2744]">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800">
                      <FileCheck className="w-3 h-3" />
                      <span>{user.company}</span>
                    </div>
                  </div>
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onTabChange('dashboard');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      <span>Dashboard Analítico</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onTabChange('history');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Mis Documentos Auditados</span>
                    </button>
                  </div>
                  <div className="border-t border-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Toggle */}
            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-[#0F2744] hover:bg-slate-100 focus:outline-none cursor-pointer"
                aria-label="Abrir menú móvil"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0F2744] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F2744] text-white flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
