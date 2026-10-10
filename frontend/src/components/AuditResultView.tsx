import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Sparkles,
  Calendar,
  Building,
  Scale,
  Check,
  Search,
  Layers,
} from 'lucide-react';
import { ContractAudit } from '../types/audit';

interface AuditResultViewProps {
  audit: ContractAudit;
  onBack: () => void;
  onExportPDF: (audit: ContractAudit) => void;
  onExportWord: (audit: ContractAudit) => void;
  onAddToCalendar?: (deadline: any) => void;
}

export const AuditResultView: React.FC<AuditResultViewProps> = ({
  audit,
  onBack,
  onExportPDF,
  onExportWord,
}) => {
  const [clauseFilter, setClauseFilter] = useState<'all' | 'issues' | 'compliant'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'clauses' | 'risks' | 'deadlines' | 'missing'>('clauses');
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Filter clauses
  const filteredClauses = audit.clauses.filter((clause) => {
    // Status filter
    if (clauseFilter === 'issues' && clause.compliant) return false;
    if (clauseFilter === 'compliant' && !clause.compliant) return false;

    // Category filter
    if (selectedCategory !== 'all' && clause.category !== selectedCategory) return false;

    // Search query
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      return (
        clause.title.toLowerCase().includes(query) ||
        clause.finding.toLowerCase().includes(query) ||
        clause.recommendation.toLowerCase().includes(query) ||
        clause.originalSnippet.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleWordExport = async () => {
    setIsExportingWord(true);
    try {
      await onExportWord(audit);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      await onExportPDF(audit);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isRiskHigh = audit.overallRiskScore > 60;
  const isRiskMedium = audit.overallRiskScore > 35 && audit.overallRiskScore <= 60;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] transition-colors cursor-pointer"
            title="Volver al Historial"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#0071e3] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full">
                {audit.documentType || 'Mercantil'}
              </span>
              <span className="text-xs text-[#86868b]">
                Auditado el {audit.auditDate}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mt-1">
              {audit.contractTitle}
            </h1>
          </div>
        </div>

        {/* Action Buttons (Apple Pill Buttons) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Word */}
          <button
            type="button"
            onClick={handleWordExport}
            disabled={isExportingWord}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] bg-white dark:bg-[#1c1c1e] hover:bg-black/[0.04] dark:hover:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4 text-[#0071e3]" />
            <span>{isExportingWord ? 'Generando Word...' : 'Exportar Word'}</span>
          </button>

          {/* Export to PDF */}
          <button
            type="button"
            onClick={handlePDFExport}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-white" />
            <span>{isExportingPDF ? 'Generando PDF...' : 'Exportar PDF'}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] transition-colors cursor-pointer"
            title="Imprimir Informe de Auditoría"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scorecard / KPI Summary Banner */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 sm:p-8 border border-black/[0.04] dark:border-white/[0.06] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Metric 1: Overall Risk Score */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex flex-col justify-between">
            <span className="text-xs font-medium text-[#86868b]">Índice Global de Riesgo</span>
            <div className="flex items-baseline justify-between mt-2">
              <span
                className={`text-3xl sm:text-4xl font-semibold tracking-tight ${
                  isRiskHigh ? 'text-[#ff3b30]' : isRiskMedium ? 'text-[#ff9500]' : 'text-[#34c759]'
                }`}
              >
                {audit.overallRiskScore}
                <span className="text-sm font-normal text-[#86868b]">/100</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isRiskHigh
                    ? 'bg-red-50 dark:bg-red-950/50 text-[#ff3b30]'
                    : isRiskMedium
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-[#ff9500]'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-[#34c759]'
                }`}
              >
                {isRiskHigh ? 'Riesgo Crítico' : isRiskMedium ? 'Riesgo Moderado' : 'Riesgo Bajo'}
              </span>
            </div>
            <div className="w-full bg-black/[0.04] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full ${
                  isRiskHigh ? 'bg-[#ff3b30]' : isRiskMedium ? 'bg-[#ff9500]' : 'bg-[#34c759]'
                }`}
                style={{ width: `${audit.overallRiskScore}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Compliance Score */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex flex-col justify-between">
            <span className="text-xs font-medium text-[#86868b]">Cumplimiento Normativo</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                {audit.complianceScore}%
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-[#34c759]">
                {audit.complianceScore >= 80 ? 'Conforme' : 'Observado'}
              </span>
            </div>
            <div className="w-full bg-black/[0.04] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#34c759] rounded-full"
                style={{ width: `${audit.complianceScore}%` }}
              />
            </div>
          </div>

          {/* Metric 3: Vigencia & Vencimiento */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#86868b]">
              <Calendar className="w-3.5 h-3.5 text-[#86868b]" />
              <span>Vigencia & Plazo</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7]">
                <span className="text-[#86868b]">Inicio:</span> {audit.effectiveDate}
              </p>
              <p className="text-xs font-medium text-[#ff3b30]">
                <span className="text-[#86868b]">Vencimiento:</span> {audit.expirationDate}
              </p>
            </div>
            <p className="text-[11px] text-[#86868b] truncate mt-2">
              {audit.renewalTerms || 'Renovación automática sujeta a notificación'}
            </p>
          </div>

          {/* Metric 4: Valor & Jurisdicción */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#86868b]">
              <Scale className="w-3.5 h-3.5 text-[#86868b]" />
              <span>Valor & Ley Aplicable</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                {audit.totalValue || 'Sin contraprestación fija'}
              </p>
              <p className="text-xs text-[#86868b] truncate">
                {audit.governingLaw || 'Jurisdicción del fuero general'}
              </p>
            </div>
            <span className="text-[11px] text-[#86868b]">
              Auditor: {audit.auditedBy || 'Audiflow Senior'}
            </span>
          </div>
        </div>

        {/* Contracting Parties Chips */}
        {audit.parties && audit.parties.length > 0 && (
          <div className="mt-5 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#86868b] mr-2">Partes Intervinientes:</span>
            {audit.parties.map((party, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.06] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]"
              >
                <Building className="w-3 h-3 text-[#86868b]" />
                <span>{party.name}</span>
                <span className="text-[10px] text-[#86868b]">({party.role})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen Ejecutivo en Lenguaje Simple */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 sm:p-7 border border-black/[0.04] dark:border-white/[0.06] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0071e3] dark:text-[#2997ff]">
            <Sparkles className="w-4 h-4 text-[#0071e3]" />
            <span>Resumen Ejecutivo en Lenguaje Simple</span>
          </div>
          <span className="text-[11px] font-medium text-[#86868b] bg-black/[0.03] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full">
            Contenido y Alcance
          </span>
        </div>
        <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xs sm:text-sm leading-relaxed whitespace-pre-line">
          {audit.summary}
        </p>
      </div>

      {/* Tabs: Cláusulas vs Riesgos vs Omisiones */}
      <div className="space-y-4">
        <div className="flex bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full self-start inline-flex">
          <button
            type="button"
            onClick={() => setActiveTab('clauses')}
            className={`py-1.5 px-4 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'clauses'
                ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Auditoría de Cláusulas ({audit.clauses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('risks')}
            className={`py-1.5 px-4 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'risks'
                ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Matriz de Riesgos ({audit.risksIdentified.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missing')}
            className={`py-1.5 px-4 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'missing'
                ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Cláusulas Faltantes ({audit.missingEssentialClauses.length})</span>
          </button>
        </div>

        {/* Tab 1: Cláusulas View */}
        {activeTab === 'clauses' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs">
              {/* Status Pill Switcher */}
              <div className="flex bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setClauseFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    clauseFilter === 'all'
                      ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                  }`}
                >
                  Todas ({audit.clauses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClauseFilter('issues')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    clauseFilter === 'issues'
                      ? 'bg-white dark:bg-[#2c2c2e] text-[#ff3b30] shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                  }`}
                >
                  Con Riesgo ({audit.clauses.filter((c) => !c.compliant).length})
                </button>
                <button
                  type="button"
                  onClick={() => setClauseFilter('compliant')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    clauseFilter === 'compliant'
                      ? 'bg-white dark:bg-[#2c2c2e] text-[#34c759] shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                  }`}
                >
                  Conformes ({audit.clauses.filter((c) => c.compliant).length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
                <input
                  type="text"
                  placeholder="Buscar en cláusulas o recomendaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071e3] bg-black/[0.02] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7]"
                />
              </div>
            </div>

            {/* Clauses List */}
            {filteredClauses.length === 0 ? (
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-10 text-center border border-black/[0.04] dark:border-white/[0.06] text-[#86868b]">
                No se encontraron cláusulas con los criterios seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClauses.map((clause, idx) => {
                  const isIssue = !clause.compliant;
                  return (
                    <div
                      key={clause.id || idx}
                      className={`bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 border transition-all ${
                        isIssue
                          ? 'border-red-200/80 dark:border-red-900/60 shadow-2xs'
                          : 'border-black/[0.04] dark:border-white/[0.06]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`p-1.5 rounded-full ${
                              clause.compliant
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#34c759]'
                                : 'bg-red-50 dark:bg-red-950/60 text-[#ff3b30]'
                            }`}
                          >
                            {clause.compliant ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                              {clause.title}
                            </h3>
                            <span className="text-[10px] font-medium text-[#86868b] uppercase tracking-wider">
                              Categoría: {clause.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                              clause.riskLevel === 'critical'
                                ? 'bg-[#ff3b30] text-white'
                                : clause.riskLevel === 'high'
                                ? 'bg-red-50 dark:bg-red-950/60 text-[#ff3b30]'
                                : clause.riskLevel === 'medium'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-[#ff9500]'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#34c759]'
                            }`}
                          >
                            Riesgo {clause.riskLevel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              clause.compliant
                                ? 'text-[#34c759] bg-emerald-50 dark:bg-emerald-950/60'
                                : 'text-[#ff3b30] bg-red-50 dark:bg-red-950/60'
                            }`}
                          >
                            {clause.compliant ? 'Conforme' : 'Requiere Enmienda'}
                          </span>
                        </div>
                      </div>

                      {/* Ubicación para Revisión con Lupa */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                          <Search className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>Revisar con Lupa:</span>
                          <span className="font-bold underline decoration-amber-500/50">
                            {clause.exactLocation || (clause.compliant ? 'Cláusula identificada en el documento' : 'Sección contractual bajo observación')}
                          </span>
                        </div>
                        {clause.legalReference && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] text-[#86868b] text-[11px] font-mono">
                            <Scale className="w-3 h-3 text-[#0071e3]" />
                            <span>{clause.legalReference}</span>
                          </div>
                        )}
                      </div>

                      {/* Snippet / Cita Textual Literal */}
                      <div className="mt-3 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] block">
                          Cita Textual Literal del Contrato:
                        </span>
                        <p className="text-xs font-mono text-[#1d1d1f] dark:text-[#f5f5f7] italic leading-relaxed">
                          "{clause.originalSnippet}"
                        </p>
                      </div>

                      {/* Findings & Recommendations */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-red-50/40 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/40 space-y-2">
                          <div className="flex items-center gap-1.5 font-semibold text-[#ff3b30]">
                            <ShieldAlert className="w-3.5 h-3.5 text-[#ff3b30]" />
                            <span>Hallazgo Jurídico & Dictamen</span>
                          </div>
                          <p className="text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed text-xs">{clause.finding}</p>
                          {clause.legalReference && (
                            <p className="text-[11px] text-[#86868b] pt-1 border-t border-red-200/40 dark:border-red-900/40">
                              <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Marco Normativo: </span>
                              <span className="text-[#0071e3] dark:text-[#2997ff]">{clause.legalReference}</span>
                            </p>
                          )}
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 space-y-2">
                          <div className="flex items-center gap-1.5 font-semibold text-[#0071e3] dark:text-[#2997ff]">
                            <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
                            <span>Recomendación de Redacción / Enmienda</span>
                          </div>
                          <p className="text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed text-xs">
                            {clause.recommendation}
                          </p>
                          {clause.suggestedDrafting && (
                            <div className="mt-2 p-2.5 rounded-xl bg-white/80 dark:bg-[#161617] border border-blue-200/50 dark:border-blue-900/40 text-[11px] text-[#1d1d1f] dark:text-[#f5f5f7] font-mono leading-relaxed">
                              <span className="font-bold text-[#0071e3] block mb-0.5">Cláusula Modelo para Enmienda:</span>
                              "{clause.suggestedDrafting}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Matriz de Riesgos */}
        {activeTab === 'risks' && (
          <div className="space-y-4">
            {audit.risksIdentified.map((risk, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 border border-black/[0.04] dark:border-white/[0.06] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b30]" />
                    <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{risk.title}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      risk.severity === 'critical'
                        ? 'bg-[#ff3b30] text-white'
                        : risk.severity === 'high'
                        ? 'bg-red-50 dark:bg-red-950/60 text-[#ff3b30]'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-[#ff9500]'
                    }`}
                  >
                    Severidad: {risk.severity}
                  </span>
                </div>
                {(risk.exactLocation || risk.legalReference) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {risk.exactLocation && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                        <Search className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Revisar con Lupa en Documento:</span>
                        <span className="font-bold underline">{risk.exactLocation}</span>
                      </div>
                    )}
                    {risk.legalReference && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] text-[#86868b] text-[11px] font-mono">
                        <Scale className="w-3 h-3 text-[#0071e3]" />
                        <span>{risk.legalReference}</span>
                      </div>
                    )}
                  </div>
                )}
                {risk.quoteSnippet && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-black/50 border border-amber-200/60 dark:border-amber-900/30 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                      Texto del Documento Original donde está el Riesgo:
                    </span>
                    <p className="font-mono italic text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed">
                      "{risk.quoteSnippet}"
                    </p>
                  </div>
                )}
                <div className="text-xs sm:text-sm text-[#86868b] leading-relaxed">
                  <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Diagnóstico del Riesgo: </span>
                  {risk.description}
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex items-start gap-2.5 text-xs">
                  <Check className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950 dark:text-emerald-300">Recomendación Legal & Preventiva: </span>
                    <span className="text-emerald-900 dark:text-emerald-200 leading-relaxed">{risk.mitigation}</span>
                  </div>
                </div>
                {risk.suggestedDrafting && (
                  <div className="p-3 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071e3] block">
                      Redacción Sugerida para Adenda:
                    </span>
                    <p className="font-mono text-[#1d1d1f] dark:text-[#f5f5f7] text-[11px] leading-relaxed">
                      "{risk.suggestedDrafting}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Cláusulas Faltantes */}
        {activeTab === 'missing' && (
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 sm:p-8 border border-black/[0.04] dark:border-white/[0.06] shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Cláusulas Esenciales Recomendadas que Faltan
              </h3>
              <p className="text-xs text-[#86868b] mt-1">
                La ausencia de estas salvaguardas legales expone a la organización a contingencias no
                reguladas. Se sugiere incorporarlas formalmente antes de la firma.
              </p>
            </div>

            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {audit.missingEssentialClauses.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/60 text-[#ff9500] flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{item}</p>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Requerido según las mejores prácticas de gobernanza y control de contratos corporativos.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
