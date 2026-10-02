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
  Share2,
  Calendar,
  Building,
  Scale,
  Check,
  Search,
  Filter,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { ContractAudit, ClauseCategory, RiskSeverity, AuditedClause } from '../types/audit';

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
  onAddToCalendar,
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-[#0F2744] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Informe de Auditoría</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-[#1E3E62]">{audit.documentType}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F2744] tracking-tight">
              {audit.contractTitle}
            </h1>
          </div>
        </div>

        {/* Action Buttons: Export to Word / Export to PDF / Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Word (.docx) */}
          <button
            type="button"
            onClick={handleWordExport}
            disabled={isExportingWord}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#1E3E62] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
          >
            <FileText className="w-4 h-4 text-blue-700" />
            <span>{isExportingWord ? 'Generando Word...' : 'Exportar Word (.docx)'}</span>
          </button>

          {/* Export to PDF (.pdf) */}
          <button
            type="button"
            onClick={handlePDFExport}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>{isExportingPDF ? 'Generando PDF...' : 'Exportar PDF'}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl text-slate-600 hover:text-[#0F2744] hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Imprimir Informe de Auditoría"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scorecard / KPI Summary Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1: Overall Risk Score */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500">Índice Global de Riesgo</span>
            <div className="flex items-baseline justify-between mt-2">
              <span
                className={`text-3xl sm:text-4xl font-black ${
                  isRiskHigh ? 'text-rose-600' : isRiskMedium ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {audit.overallRiskScore}
                <span className="text-sm font-bold text-slate-400">/100</span>
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  isRiskHigh
                    ? 'bg-rose-100 text-rose-700'
                    : isRiskMedium
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isRiskHigh ? 'Riesgo Crítico' : isRiskMedium ? 'Riesgo Moderado' : 'Riesgo Bajo'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full ${
                  isRiskHigh ? 'bg-rose-500' : isRiskMedium ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${audit.overallRiskScore}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Compliance Score */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500">Cumplimiento Normativo</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl sm:text-4xl font-black text-[#0F2744]">
                {audit.complianceScore}%
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {audit.complianceScore >= 80 ? 'Conforme' : 'Observado'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${audit.complianceScore}%` }}
              />
            </div>
          </div>

          {/* Metric 3: Vigencia & Vencimiento */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Vigencia & Plazo</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-400">Inicio:</span> {audit.effectiveDate}
              </p>
              <p className="text-xs font-bold text-rose-600">
                <span className="font-semibold text-slate-400">Vencimiento:</span> {audit.expirationDate}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-2">
              {audit.renewalTerms || 'Renovación automática sujeta a notificación'}
            </p>
          </div>

          {/* Metric 4: Valor & Jurisdicción */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Scale className="w-3.5 h-3.5 text-slate-400" />
              <span>Valor & Ley Aplicable</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm font-extrabold text-[#0F2744] truncate">
                {audit.totalValue || 'Sin contraprestación fija'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {audit.governingLaw || 'Jurisdicción del fuero general'}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Auditor: {audit.auditedBy || 'Audiflow Senior'}
            </span>
          </div>
        </div>

        {/* Contracting Parties Chips */}
        {audit.parties && audit.parties.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-2">Partes Intervinientes:</span>
            {audit.parties.map((party, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
              >
                <Building className="w-3 h-3 text-slate-400" />
                <span>{party.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">({party.role})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Executive Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E3E62] mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Dictamen y Resumen Ejecutivo</span>
        </div>
        <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
          {audit.summary}
        </p>
      </div>

      {/* Urgent Deadlines Notification Banner */}
      {audit.keyDeadlines && audit.keyDeadlines.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50/80 via-white to-amber-50/80 rounded-3xl p-6 border border-rose-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F2744]">
                  Alertas de Vencimiento y Fechas Límite
                </h3>
                <p className="text-xs text-slate-500">
                  Hitos críticos extraídos para evitar renovaciones forzosas o penalizaciones.
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-rose-700 bg-rose-100 px-3 py-1 rounded-full animate-pulse self-start sm:self-auto">
              {audit.keyDeadlines.length} Plazos Clave Detectados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {audit.keyDeadlines.map((dl, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-2 ${
                  dl.urgency === 'urgent' ? 'border-rose-200' : 'border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0F2744]">{dl.date}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dl.urgency === 'urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {dl.daysRemaining !== undefined
                      ? dl.daysRemaining <= 0
                        ? 'Vence hoy'
                        : `${dl.daysRemaining} días restantes`
                      : 'Hito fijado'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800">{dl.title}</h4>
                <p className="text-[11px] text-slate-500 leading-snug">{dl.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs: Cláusulas vs Riesgos vs Omisiones */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('clauses')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'clauses'
                ? 'border-[#0F2744] text-[#0F2744]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Auditoría de Cláusulas ({audit.clauses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('risks')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'risks'
                ? 'border-[#0F2744] text-[#0F2744]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Matriz de Riesgos ({audit.risksIdentified.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missing')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'missing'
                ? 'border-[#0F2744] text-[#0F2744]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Cláusulas Faltantes ({audit.missingEssentialClauses.length})</span>
          </button>
        </div>

        {/* Tab 1: Cláusulas View */}
        {activeTab === 'clauses' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
              {/* Status Pill Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setClauseFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    clauseFilter === 'all'
                      ? 'bg-white text-[#0F2744] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas ({audit.clauses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClauseFilter('issues')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    clauseFilter === 'issues'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Con Riesgo ({audit.clauses.filter((c) => !c.compliant).length})
                </button>
                <button
                  type="button"
                  onClick={() => setClauseFilter('compliant')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    clauseFilter === 'compliant'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Conformes ({audit.clauses.filter((c) => c.compliant).length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en cláusulas o recomendaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F2744] bg-slate-50/50"
                />
              </div>
            </div>

            {/* Clauses List */}
            {filteredClauses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-400">
                No se encontraron cláusulas con los criterios seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClauses.map((clause, idx) => {
                  const isIssue = !clause.compliant;
                  return (
                    <div
                      key={clause.id || idx}
                      className={`bg-white rounded-3xl p-6 border transition-all ${
                        isIssue ? 'border-rose-200/90 shadow-2xs' : 'border-slate-200/90'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`p-1.5 rounded-lg ${
                              clause.compliant
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {clause.compliant ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                          </span>
                          <div>
                            <h3 className="text-sm font-extrabold text-[#0F2744]">
                              {clause.title}
                            </h3>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Categoría: {clause.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              clause.riskLevel === 'critical'
                                ? 'bg-rose-600 text-white'
                                : clause.riskLevel === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : clause.riskLevel === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Riesgo {clause.riskLevel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              clause.compliant
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {clause.compliant ? 'Conforme' : 'Requiere Enmienda'}
                          </span>
                        </div>
                      </div>

                      {/* Snippet */}
                      <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-600 italic">
                        "{clause.originalSnippet}"
                      </div>

                      {/* Findings & Recommendations */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-rose-900">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>Hallazgo Jurídico</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{clause.finding}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[#1E3E62]">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>Recomendación de Redacción / Enmienda</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            {clause.recommendation}
                          </p>
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
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                    <h3 className="text-sm font-extrabold text-[#0F2744]">{risk.title}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                      risk.severity === 'critical'
                        ? 'bg-rose-600 text-white'
                        : risk.severity === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Severidad: {risk.severity}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {risk.description}
                </p>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2 text-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950">Medida Preventiva / Mitigación: </span>
                    <span className="text-emerald-900">{risk.mitigation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Cláusulas Faltantes */}
        {activeTab === 'missing' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#0F2744]">
                Cláusulas Esenciales Recomendadas que Faltan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La ausencia de estas salvaguardas legales expone a la organización a contingencias no
                reguladas. Se sugiere incorporarlas formalmente antes de la firma.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {audit.missingEssentialClauses.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-800">{item}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
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
