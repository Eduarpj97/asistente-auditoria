import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Clock,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Download,
  AlertTriangle,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { ContractAudit, DateFilterRange, KeyDeadline } from '../types/audit';

interface DashboardProps {
  audits: ContractAudit[];
  deadlines: KeyDeadline[];
  onSelectAudit: (audit: ContractAudit) => void;
  onNavigateTab: (tab: 'upload' | 'history' | 'alerts') => void;
  onExportPDF: (audit: ContractAudit) => void;
  onExportWord: (audit: ContractAudit) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  audits,
  deadlines,
  onSelectAudit,
  onNavigateTab,
  onExportPDF,
  onExportWord,
}) => {
  const [dateRange, setDateRange] = useState<DateFilterRange>('thisMonth');

  // Filter audits based on selected date range
  const filteredAudits = useMemo(() => {
    // For rich demo visualization, we display the calculated dataset
    return audits;
  }, [audits, dateRange]);

  // Aggregate Metrics
  const totalAudits = filteredAudits.length;
  const avgCompliance = Math.round(
    filteredAudits.reduce((acc, a) => acc + a.complianceScore, 0) / (totalAudits || 1)
  );
  const totalFindings = filteredAudits.reduce((acc, a) => acc + a.clauses.filter(c => !c.compliant).length, 0);
  const totalCriticalRisks = filteredAudits.reduce(
    (acc, a) => acc + a.risksIdentified.filter(r => r.severity === 'critical' || r.severity === 'high').length,
    0
  );

  // Category breakdown for horizontal bar chart
  const categoryStats = useMemo(() => {
    const counts: Record<string, { total: number; issues: number }> = {
      'Penalizaciones': { total: 0, issues: 0 },
      'Propiedad Intelectual': { total: 0, issues: 0 },
      'Confidencialidad': { total: 0, issues: 0 },
      'Terminación & Salida': { total: 0, issues: 0 },
      'Responsabilidad & Daños': { total: 0, issues: 0 },
      'Pagos & Tarifas': { total: 0, issues: 0 },
    };

    filteredAudits.forEach((audit) => {
      audit.clauses.forEach((clause) => {
        let catName = 'Otros';
        if (clause.category === 'penalizaciones') catName = 'Penalizaciones';
        else if (clause.category === 'propiedad_intelectual') catName = 'Propiedad Intelectual';
        else if (clause.category === 'confidencialidad') catName = 'Confidencialidad';
        else if (clause.category === 'terminacion') catName = 'Terminación & Salida';
        else if (clause.category === 'responsabilidad') catName = 'Responsabilidad & Daños';
        else if (clause.category === 'pagos') catName = 'Pagos & Tarifas';

        if (counts[catName]) {
          counts[catName].total += 1;
          if (!clause.compliant || clause.riskLevel === 'high' || clause.riskLevel === 'critical') {
            counts[catName].issues += 1;
          }
        }
      });
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      total: data.total,
      issues: data.issues,
      complianceRate: data.total > 0 ? Math.round(((data.total - data.issues) / data.total) * 100) : 0,
    }));
  }, [filteredAudits]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>AUDIFLOW PLATAFORMA DE AUDITORÍA</span>
            <span>•</span>
            <span className="text-[#1E3E62] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Supervisión de Cláusulas en Tiempo Real
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2744] tracking-tight mt-1">
            Panel de Control y Rendimiento
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Métricas de control contractual, cumplimiento normativo y detección proactiva de riesgos.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateFilterRange)}
              className="text-xs font-semibold text-slate-700 bg-transparent py-1.5 pr-2 pl-1 border-none focus:outline-none cursor-pointer"
            >
              <option value="today">Hoy (24 horas)</option>
              <option value="last7days">Últimos 7 días</option>
              <option value="thisMonth">Este mes</option>
              <option value="lastQuarter">Tercer Trimestre</option>
              <option value="thisYear">Año en curso</option>
              <option value="all">Todo el Histórico</option>
            </select>
          </div>

          <button
            onClick={() => onNavigateTab('upload')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0F2744] hover:bg-[#16385F] transition-all shadow-xs cursor-pointer"
          >
            <span>+ Cargar PDF</span>
          </button>
        </div>
      </div>

      {/* Welcome Banner when empty */}
      {totalAudits === 0 && (
        <div className="bg-gradient-to-r from-[#0F2744] to-[#1E3E62] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Plataforma Lista para Auditorías
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Bienvenido a Audiflow
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Aún no has realizado ninguna auditoría. Carga tu primer contrato en formato PDF para escanear automáticamente cada cláusula, evaluar riesgos normativos con Llama 3.1 y generar dictámenes jurídicos en segundos.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigateTab('upload')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0F2744] bg-white hover:bg-slate-100 transition-all shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#0F2744]" />
                <span>+ Cargar Primer Contrato</span>
              </button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-8">
            <FileText className="w-80 h-80 text-white" />
          </div>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Auditorías activas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Auditorías Realizadas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-[#0F2744]">{totalAudits}</span>
            <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              <span>{totalAudits > 0 ? '+100%' : '0%'}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Contratos en sistema</span>
            <span className="font-semibold text-slate-600">{totalAudits} registros</span>
          </div>
        </div>

        {/* KPI 2: Cumplimiento */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Cumplimiento Global</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-[#0F2744]">{totalAudits > 0 ? `${avgCompliance}%` : '0%'}</span>
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeDasharray={`${avgCompliance} 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Promedio normativo</span>
            <span className="font-bold text-emerald-600">{totalAudits > 0 ? `${avgCompliance}%` : 'Sin datos'}</span>
          </div>
        </div>

        {/* KPI 3: Hallazgos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Hallazgos Jurídicos</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-[#0F2744]">{totalFindings}</span>
            <div className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <span>{totalFindings > 0 ? `${totalFindings} activos` : '0 activos'}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Cláusulas observadas</span>
            <span className="font-semibold text-amber-600">{totalFindings === 0 ? 'Sin alertas' : `${totalFindings} detectadas`}</span>
          </div>
        </div>

        {/* KPI 4: Riesgos Críticos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Riesgos Críticos</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold text-rose-600">{totalCriticalRisks}</span>
            <div className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 mr-0.5" />
              <span>{totalCriticalRisks > 0 ? 'Atención' : 'Sin riesgos'}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Cláusulas asimétricas</span>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-rose-600 font-bold hover:underline"
            >
              Revisar alertas →
            </button>
          </div>
        </div>
      </div>

      {/* Row: Breakdown by Category & Urgent Deadlines Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0F2744]">
                Auditoría por Categoría de Cláusula
              </h3>
              <p className="text-xs text-slate-400">
                Nivel de cumplimiento y porcentaje de cláusulas que requieren revisión.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#1E3E62] bg-blue-50 px-2.5 py-1 rounded-full">
              6 Categorías evaluadas
            </span>
          </div>

          <div className="space-y-3.5 mt-4">
            {filteredAudits.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">Sin datos de categorías</p>
                <p className="text-[11px] text-slate-400 mt-0.5">El desglose por penalizaciones, SLAs y privacidad se habilitará tras la primera auditoría.</p>
              </div>
            ) : (
              categoryStats.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-normal">
                        {item.issues} contingencias en {item.total} cláusulas
                      </span>
                      <span
                        className={`font-bold ${
                          item.complianceRate >= 80 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {item.complianceRate}% conforme
                      </span>
                    </div>
                  </div>
                  {/* Multi-segment Bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${item.complianceRate}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${100 - item.complianceRate}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Urgent Deadlines Notification Widget (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <h3 className="text-base font-bold text-[#0F2744]">Próximos Vencimientos</h3>
              </div>
              {deadlines.length > 0 && (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full animate-pulse">
                  Urgente
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Alertas automáticas de no renovación, revisión y terminación legal.
            </p>

            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-600">Sin vencimientos pendientes</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Las alertas de prórroga y terminación se listarán aquí automáticamente.</p>
                </div>
              ) : (
                deadlines.slice(0, 3).map((dl, idx) => (
                  <div
                    key={dl.id || idx}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      dl.urgency === 'urgent'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-800 line-clamp-1">{dl.title}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                          dl.urgency === 'urgent'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {dl.daysRemaining !== undefined ? `${dl.daysRemaining}d` : 'Inminente'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{dl.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-medium">
                      <span>Fecha límite: {dl.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('alerts')}
            className="w-full mt-4 py-2 px-3 rounded-xl text-xs font-bold text-[#0F2744] bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Gestionar todas las alertas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Audited Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0F2744]">
              Documentos Auditados Recientemente
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acceso rápido a los últimos contratos analizados, dictámenes y exportaciones.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3E62] hover:text-[#0F2744] cursor-pointer"
          >
            <span>Ver historial completo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Contrato / Documento</th>
                <th className="py-3 px-4">Tipo Legal</th>
                <th className="py-3 px-4">Fecha Auditoría</th>
                <th className="py-3 px-4">Riesgo Global</th>
                <th className="py-3 px-4">Cumplimiento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText className="w-10 h-10 mb-2 text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-600">No hay contratos auditados aún</p>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
                        Carga tu primer documento para comenzar a evaluar riesgos, detectar cláusulas críticas y visualizar dictámenes.
                      </p>
                      <button
                        onClick={() => onNavigateTab('upload')}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0F2744] hover:bg-[#16385F] transition-all cursor-pointer shadow-xs"
                      >
                        + Iniciar Primera Auditoría
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAudits.slice(0, 4).map((audit) => {
                const isRiskHigh = audit.overallRiskScore > 60;
                const isRiskMedium = audit.overallRiskScore > 35 && audit.overallRiskScore <= 60;
                return (
                  <tr
                    key={audit.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectAudit(audit)}
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#0F2744]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3E62] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {audit.contractTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {audit.fileName} ({audit.fileSize || 'PDF'})
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{audit.documentType}</td>
                    <td className="py-3.5 px-4 text-slate-500">{audit.auditDate}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isRiskHigh
                            ? 'bg-rose-100 text-rose-700'
                            : isRiskMedium
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {audit.overallRiskScore} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{audit.complianceScore}%</span>
                        <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              audit.complianceScore >= 80 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${audit.complianceScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          audit.status === 'aprobado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {audit.status === 'aprobado' ? 'Aprobado' : 'En Revisión'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectAudit(audit)}
                          className="p-1.5 text-slate-600 hover:text-[#0F2744] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Ver dictamen completo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExportPDF(audit)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
