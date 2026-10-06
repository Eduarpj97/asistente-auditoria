import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Bell,
  ChevronRight,
  Download,
  FileCheck2,
  ExternalLink,
  ShieldAlert,
  Lock,
  Scale,
  Calendar,
} from 'lucide-react';
import { ContractAudit, KeyDeadline, User } from '../types/audit';

interface DashboardProps {
  audits: ContractAudit[];
  deadlines: KeyDeadline[];
  user?: User | null;
  onSelectAudit: (audit: ContractAudit) => void;
  onNavigateTab: (tab: 'upload' | 'history' | 'alerts') => void;
  onExportPDF: (audit: ContractAudit) => void;
  onExportWord: (audit: ContractAudit) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  audits,
  deadlines,
  user,
  onSelectAudit,
  onNavigateTab,
  onExportPDF,
}) => {
  // Filtro temporal reactivo: hoy | semana | mes | todos
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Filtrado reactivo de auditorías según período seleccionado
  const filteredAudits = useMemo(() => {
    if (timeFilter === 'all') return audits;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return audits.filter((audit) => {
      const dateStr = audit.auditDate || audit.effectiveDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;

      const itemMs = d.getTime();
      const diffDays = (now.getTime() - itemMs) / (1000 * 60 * 60 * 24);

      if (timeFilter === 'today') {
        return itemMs >= todayStart || diffDays <= 1;
      }
      if (timeFilter === 'week') {
        return diffDays <= 7;
      }
      if (timeFilter === 'month') {
        return diffDays <= 30;
      }
      return true;
    });
  }, [audits, timeFilter]);

  // Aggregate Metrics (100% reales calculados sobre el conjunto filtrado)
  const totalAudits = filteredAudits.length;
  const approvedCount = filteredAudits.filter((a) => a.status === 'aprobado').length;
  const inReviewCount = totalAudits - approvedCount;

  const avgCompliance = Math.round(
    filteredAudits.reduce((acc, a) => acc + (a.complianceScore || 0), 0) / (totalAudits || 1)
  );

  const totalFindings = filteredAudits.reduce(
    (acc, a) => acc + a.clauses.filter((c) => !c.compliant).length,
    0
  );

  const totalCriticalRisks = filteredAudits.reduce(
    (acc, a) =>
      acc +
      (a.risksIdentified || []).filter(
        (r) => r.severity === 'critical' || r.severity === 'high'
      ).length,
    0
  );

  // Dynamic Risk Distribution
  const lowCount = filteredAudits.filter((a) => a.overallRiskScore <= 35).length;
  const mediumCount = filteredAudits.filter((a) => a.overallRiskScore > 35 && a.overallRiskScore <= 60).length;
  const highCount = filteredAudits.filter((a) => a.overallRiskScore > 60).length;

  const lowPct = totalAudits > 0 ? Math.round((lowCount / totalAudits) * 100) : 0;
  const medPct = totalAudits > 0 ? Math.round((mediumCount / totalAudits) * 100) : 0;
  const highPct = totalAudits > 0 ? Math.round((highCount / totalAudits) * 100) : 0;

  // Active deadlines summary
  const activeDeadlines = useMemo(() => {
    return deadlines.filter((d) => !d.dismissed).slice(0, 4);
  }, [deadlines]);

  const urgentCount = deadlines.filter((d) => d.urgency === 'urgent' && !d.dismissed).length;

  // 5 Ejes Clave del Compendio Normativo 2026
  const regulatoryAxes = useMemo(() => {
    const axes = [
      {
        id: 'proteccion_datos',
        name: 'Protección de Datos & IA',
        ruleRef: 'RGPD / Ley de Datos 2026',
        icon: Lock,
        total: 0,
        issues: 0,
      },
      {
        id: 'aml_cft',
        name: 'Prevención AML / SARLAFT',
        ruleRef: 'Debida Diligencia & Listas OFAC',
        icon: ShieldAlert,
        total: 0,
        issues: 0,
      },
      {
        id: 'anticorrupcion_etica',
        name: 'Anticorrupción & Soborno',
        ruleRef: 'ISO 37001 / FCPA',
        icon: Scale,
        total: 0,
        issues: 0,
      },
      {
        id: 'seguridad_informacion',
        name: 'Seguridad de la Información',
        ruleRef: 'ISO 27001:2022 / Ciberseguridad',
        icon: ShieldCheck,
        total: 0,
        issues: 0,
      },
      {
        id: 'responsabilidad',
        name: 'Equilibrio & Responsabilidad',
        ruleRef: 'SLAs, Dolo y Culpa Grave',
        icon: FileCheck2,
        total: 0,
        issues: 0,
      },
    ];

    filteredAudits.forEach((audit) => {
      audit.clauses.forEach((clause) => {
        const cat = clause.category || '';
        const axis = axes.find(
          (a) =>
            cat.includes(a.id) ||
            (a.id === 'responsabilidad' && (cat.includes('responsabilidad') || cat.includes('penalidades')))
        );
        if (axis) {
          axis.total += 1;
          if (!clause.compliant || clause.riskLevel === 'high' || clause.riskLevel === 'critical') {
            axis.issues += 1;
          }
        }
      });
    });

    return axes.map((axis) => {
      const rate =
        axis.total > 0
          ? Math.max(0, Math.round(((axis.total - axis.issues) / axis.total) * 100))
          : totalAudits > 0
          ? 100
          : 0;
      return { ...axis, complianceRate: rate };
    });
  }, [filteredAudits, totalAudits]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ── 1. Apple Header & Segmented Time Filter ──── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              Panel de Control
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/[0.04] dark:bg-white/[0.08] text-[#86868b] dark:text-[#98989d]">
              <span className="w-2 h-2 rounded-full bg-[#34c759]" />
              <span>Normativa 2026</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#86868b] mt-1">
            {user?.name ? `Auditor: ${user.name} • ` : ''}Monitoreo de riesgos contractuales, debida diligencia y cumplimiento legal.
          </p>
        </div>

        {/* Filtro Temporal: Hoy / Semana / Mes / Todos (Segmented Control iOS) */}
        <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full self-start sm:self-auto">
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
            { id: 'all', label: 'Todos' },
          ].map((item) => {
            const isActive = timeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTimeFilter(item.id as any)}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. KPI Cards Grid: Apple Smooth Cards ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Expedientes Auditados */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 border border-black/[0.04] dark:border-white/[0.06] shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-[#86868b]">
            <span className="text-xs font-medium uppercase tracking-wider">Expedientes</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0071e3] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              {totalAudits}
            </span>
            <span className="text-xs font-medium text-[#86868b] bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full">
              {totalAudits === 1 ? '1 contrato' : `${totalAudits} contratos`}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-[#86868b]">
            <span>Estado:</span>
            <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
              {totalAudits > 0 ? `${approvedCount} Aprobados • ${inReviewCount} En revisión` : 'Sin registros'}
            </span>
          </div>
        </div>

        {/* Card 2: Índice de Cumplimiento Global */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 border border-black/[0.04] dark:border-white/[0.06] shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-[#86868b]">
            <span className="text-xs font-medium uppercase tracking-wider">Cumplimiento</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#34c759] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              {totalAudits > 0 ? `${avgCompliance}%` : '—'}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                totalAudits === 0
                  ? 'bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b]'
                  : avgCompliance >= 80
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#34c759]'
                  : avgCompliance >= 50
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-[#ff9500]'
                  : 'bg-red-50 dark:bg-red-950/50 text-[#ff3b30]'
              }`}
            >
              {totalAudits === 0 ? 'N/A' : avgCompliance >= 80 ? 'Óptimo' : avgCompliance >= 50 ? 'Regular' : 'Crítico'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <div className="w-full h-1.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  avgCompliance >= 80 ? 'bg-[#34c759]' : avgCompliance >= 50 ? 'bg-[#ff9500]' : 'bg-[#ff3b30]'
                }`}
                style={{ width: `${totalAudits > 0 ? avgCompliance : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Hallazgos & Puntos de Infracción */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 border border-black/[0.04] dark:border-white/[0.06] shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-[#86868b]">
            <span className="text-xs font-medium uppercase tracking-wider">Hallazgos</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#ff9500] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              {totalFindings}
            </span>
            <span className="text-xs font-medium text-[#ff9500] bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full">
              Observados
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-[#86868b]">
            <span>Severidad alta:</span>
            <span className={`font-medium ${totalCriticalRisks > 0 ? 'text-[#ff3b30]' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
              {totalCriticalRisks} Críticos
            </span>
          </div>
        </div>

        {/* Card 4: Plazos de Expiración & Rescisión */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 border border-black/[0.04] dark:border-white/[0.06] shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-[#86868b]">
            <span className="text-xs font-medium uppercase tracking-wider">Vencimientos</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#ff3b30] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              {deadlines.length}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                urgentCount > 0
                  ? 'bg-red-50 dark:bg-red-950/50 text-[#ff3b30]'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b]'
              }`}
            >
              {urgentCount > 0 ? `${urgentCount} Urgentes` : 'Al día'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-[#86868b]">Agenda:</span>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-[#0071e3] font-medium hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Middle Section: Matrix & Horizon (2 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda (7 de 12): Matriz de Riesgos & 5 Ejes Normativos */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                  Matriz de Riesgos & Ejes Normativos (2026)
                </h2>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Evaluación forense de debida diligencia legal
                </p>
              </div>
              <span className="hidden sm:inline-flex text-xs font-medium text-[#0071e3] bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
                5 Ejes de Control
              </span>
            </div>

            {/* Segmented Risk Health Overview */}
            <div className="my-5 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Distribución de Riesgo
                </span>
                <span className="text-[#86868b]">
                  {totalAudits} {totalAudits === 1 ? 'expediente' : 'expedientes'}
                </span>
              </div>
              {/* Segmented Bar */}
              <div className="w-full h-2 bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden flex">
                {totalAudits === 0 ? (
                  <div className="w-full h-full bg-black/[0.06] dark:bg-white/[0.08]" />
                ) : (
                  <>
                    <div
                      className="bg-[#34c759] h-full transition-all duration-500"
                      style={{ width: `${lowPct}%` }}
                      title={`Bajo Riesgo: ${lowPct}%`}
                    />
                    <div
                      className="bg-[#ff9500] h-full transition-all duration-500"
                      style={{ width: `${medPct}%` }}
                      title={`Riesgo Medio: ${medPct}%`}
                    />
                    <div
                      className="bg-[#ff3b30] h-full transition-all duration-500"
                      style={{ width: `${highPct}%` }}
                      title={`Riesgo Crítico: ${highPct}%`}
                    />
                  </>
                )}
              </div>
              {/* Labels */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div className="p-2 rounded-xl bg-white dark:bg-[#2c2c2e] shadow-xs">
                  <span className="block font-semibold text-[#34c759]">{lowPct}%</span>
                  <span className="text-[#86868b] text-[11px]">Bajo ({lowCount})</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#2c2c2e] shadow-xs">
                  <span className="block font-semibold text-[#ff9500]">{medPct}%</span>
                  <span className="text-[#86868b] text-[11px]">Medio ({mediumCount})</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#2c2c2e] shadow-xs">
                  <span className="block font-semibold text-[#ff3b30]">{highPct}%</span>
                  <span className="text-[#86868b] text-[11px]">Crítico ({highCount})</span>
                </div>
              </div>
            </div>

            {/* List of 5 Regulatory Axes */}
            <div className="space-y-3 mt-4">
              {regulatoryAxes.map((axis, aIdx) => {
                const Icon = axis.icon;
                const isOptimal = axis.complianceRate >= 80;
                const isWarning = axis.complianceRate >= 50 && axis.complianceRate < 80;
                return (
                  <div key={axis.id} className="space-y-1.5 p-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#0071e3] font-medium">0{aIdx + 1}</span>
                        <Icon className="w-3.5 h-3.5 text-[#86868b]" />
                        <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{axis.name}</span>
                        <span className="hidden sm:inline text-[11px] text-[#86868b]">({axis.ruleRef})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {axis.issues > 0 && (
                          <span className="text-[10px] font-medium text-[#ff3b30] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                            {axis.issues} {axis.issues === 1 ? 'alerta' : 'alertas'}
                          </span>
                        )}
                        <span
                          className={`font-semibold text-xs ${
                            isOptimal
                              ? 'text-[#34c759]'
                              : isWarning
                              ? 'text-[#ff9500]'
                              : 'text-[#ff3b30]'
                          }`}
                        >
                          {totalAudits > 0 ? `${axis.complianceRate}%` : '—'}
                        </span>
                      </div>
                    </div>
                    {/* Linear Gauge */}
                    <div className="w-full h-1.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOptimal ? 'bg-[#34c759]' : isWarning ? 'bg-[#ff9500]' : 'bg-[#ff3b30]'
                        }`}
                        style={{ width: `${totalAudits > 0 ? axis.complianceRate : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha (5 de 12): Próximos Vencimientos Legales */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#0071e3]" />
                <h2 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                  Próximos Vencimientos
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs font-medium text-[#0071e3] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#86868b] mt-1.5 mb-4">
              Preavisos y plazos resolutorios de contratos auditados
            </p>

            <div className="space-y-3">
              {activeDeadlines.length === 0 ? (
                <div className="py-12 text-center text-[#86868b] space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#34c759] flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Sin alertas pendientes</p>
                  <p className="text-[11px] text-[#86868b] max-w-xs mx-auto">
                    Todos los contratos auditados se encuentran al día sin compromisos vencidos.
                  </p>
                </div>
              ) : (
                activeDeadlines.map((dl, idx) => {
                  const isUrgent = dl.urgency === 'urgent';
                  return (
                    <div
                      key={dl.id || idx}
                      onClick={() => onNavigateTab('alerts')}
                      className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer hover:shadow-xs ${
                        isUrgent
                          ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] line-clamp-1">{dl.title}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            isUrgent
                              ? 'bg-[#ff3b30] text-white'
                              : 'bg-[#ff9500] text-white'
                          }`}
                        >
                          {dl.daysRemaining !== undefined
                            ? dl.daysRemaining <= 0
                              ? 'Hoy'
                              : `${dl.daysRemaining}d`
                            : 'Próximo'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#86868b] mt-1 line-clamp-1">{dl.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-[#86868b] mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                        <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate max-w-[180px]">
                          {dl.contractTitle || 'Contrato'}
                        </span>
                        <span>Límite: {dl.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Section: Recent Documents Table ───── */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              Registro de Expedientes Recientes
            </h2>
            <p className="text-xs text-[#86868b] mt-0.5">
              Auditorías realizadas con trazabilidad normativa
            </p>
          </div>
          {filteredAudits.length > 0 && (
            <button
              onClick={() => onNavigateTab('history')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0071e3] hover:underline cursor-pointer"
            >
              <span>Ver todos los expedientes</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/[0.02] dark:bg-white/[0.04] text-[#86868b] border-b border-black/[0.04] dark:border-white/[0.06] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-medium">Contrato / Documento</th>
                <th className="py-3 px-4 font-medium">Tipología Legal</th>
                <th className="py-3 px-4 font-medium">Nivel de Riesgo</th>
                <th className="py-3 px-4 font-medium">Cumplimiento</th>
                <th className="py-3 px-4 font-medium">Fecha</th>
                <th className="py-3 px-4 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7]">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b] flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {timeFilter === 'all'
                          ? 'Sin expedientes registrados'
                          : `Sin registros en el período: ${timeFilter === 'today' ? 'Hoy' : timeFilter === 'week' ? '7 días' : '30 días'}`}
                      </p>
                      <p className="text-xs text-[#86868b] mt-1">
                        {timeFilter === 'all'
                          ? 'Inicia una nueva auditoría desde la barra superior para generar el dictamen legal.'
                          : 'Selecciona "Todos" en el selector superior para consultar el historial completo.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAudits.slice(0, 5).map((audit) => {
                  const isHigh = audit.overallRiskScore > 60;
                  const isMed = audit.overallRiskScore > 35 && audit.overallRiskScore <= 60;
                  return (
                    <tr
                      key={audit.id}
                      onClick={() => onSelectAudit(audit)}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0071e3] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-[#0071e3] transition-colors line-clamp-1">
                              {audit.contractTitle}
                            </p>
                            <p className="text-[11px] text-[#86868b] font-normal">
                              {audit.fileName} {audit.fileSize ? `• ${audit.fileSize}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#86868b] font-medium">
                        <span className="text-[11px] bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full">
                          {audit.documentType || 'Mercantil'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            isHigh
                              ? 'bg-red-50 dark:bg-red-950/50 text-[#ff3b30]'
                              : isMed
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-[#ff9500]'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-[#34c759]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isHigh ? 'bg-[#ff3b30]' : isMed ? 'bg-[#ff9500]' : 'bg-[#34c759]'
                            }`}
                          />
                          {isHigh ? 'Crítico' : isMed ? 'Medio' : 'Bajo'} ({audit.overallRiskScore})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] text-xs">
                            {audit.complianceScore}%
                          </span>
                          <div className="w-14 h-1.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                audit.complianceScore >= 80 ? 'bg-[#34c759]' : 'bg-[#ff3b30]'
                              }`}
                              style={{ width: `${audit.complianceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#86868b] text-xs">
                        {audit.auditDate}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectAudit(audit)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] rounded-full transition-all cursor-pointer shadow-xs"
                          >
                            <span>Dictamen</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onExportPDF(audit)}
                            className="p-1.5 text-[#86868b] hover:text-[#0071e3] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-full transition-colors cursor-pointer"
                            title="Exportar dictamen a PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
