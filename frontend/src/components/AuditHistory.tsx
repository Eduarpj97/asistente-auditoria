import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  ChevronRight,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  PlusCircle,
} from 'lucide-react';
import { ContractAudit } from '../types/audit';

interface AuditHistoryProps {
  audits: ContractAudit[];
  onSelectAudit: (audit: ContractAudit) => void;
  onDeleteAudit: (auditId: string) => void;
  onExportPDF: (audit: ContractAudit) => void;
  onExportWord: (audit: ContractAudit) => void;
  onNavigateUpload: () => void;
}

export const AuditHistory: React.FC<AuditHistoryProps> = ({
  audits,
  onSelectAudit,
  onDeleteAudit,
  onExportPDF,
  onExportWord,
  onNavigateUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'risk_desc' | 'comp_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Extract unique document types
  const documentTypes = useMemo(() => {
    const set = new Set<string>();
    audits.forEach((a) => set.add(a.documentType));
    return Array.from(set);
  }, [audits]);

  // Filtered and sorted audits
  const filteredAudits = useMemo(() => {
    return audits
      .filter((audit) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = audit.contractTitle.toLowerCase().includes(q);
          const matchFile = audit.fileName.toLowerCase().includes(q);
          const matchSummary = audit.summary.toLowerCase().includes(q);
          const matchParty = audit.parties?.some((p) => p.name.toLowerCase().includes(q));
          if (!matchTitle && !matchFile && !matchSummary && !matchParty) return false;
        }

        // Risk Filter
        if (selectedRisk !== 'all') {
          if (selectedRisk === 'critical' && audit.overallRiskScore <= 60) return false;
          if (selectedRisk === 'medium' && (audit.overallRiskScore < 30 || audit.overallRiskScore > 60))
            return false;
          if (selectedRisk === 'low' && audit.overallRiskScore >= 30) return false;
        }

        // Type Filter
        if (selectedType !== 'all' && audit.documentType !== selectedType) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime();
        if (sortBy === 'date_asc') return new Date(a.auditDate).getTime() - new Date(b.auditDate).getTime();
        if (sortBy === 'risk_desc') return b.overallRiskScore - a.overallRiskScore;
        if (sortBy === 'comp_asc') return a.complianceScore - b.complianceScore;
        return 0;
      });
  }, [audits, searchTerm, selectedRisk, selectedType, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
            Historial de Documentos
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5">
            Registro cronológico de contratos revisados, dictámenes y trazabilidad legal.
          </p>
        </div>

        <button
          onClick={onNavigateUpload}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Auditar Nuevo Contrato</span>
        </button>
      </div>

      {/* Filter and Search Controls Bar (Apple Smooth Card) */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 border border-black/[0.04] dark:border-white/[0.06] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              placeholder="Buscar por nombre, partes contratantes o palabras clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1c1c1e] text-xs bg-black/[0.02] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] transition"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] bg-white dark:bg-[#2c2c2e] focus:outline-none focus:border-[#0071e3] cursor-pointer"
            >
              <option value="all">Nivel de Riesgo: Todos</option>
              <option value="critical">Alto / Crítico (&gt;60)</option>
              <option value="medium">Medio (30-60)</option>
              <option value="low">Bajo / Controlado (&lt;30)</option>
            </select>

            {/* Document Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] bg-white dark:bg-[#2c2c2e] focus:outline-none focus:border-[#0071e3] cursor-pointer"
            >
              <option value="all">Tipo de Contrato: Todos</option>
              {documentTypes.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] bg-white dark:bg-[#2c2c2e] focus:outline-none focus:border-[#0071e3] cursor-pointer"
            >
              <option value="date_desc">Más recientes primero</option>
              <option value="date_asc">Más antiguos primero</option>
              <option value="risk_desc">Mayor riesgo primero</option>
              <option value="comp_asc">Menor cumplimiento primero</option>
            </select>

            {/* Grid vs Table Toggle (iOS Segmented) */}
            <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                }`}
                title="Vista de Tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                }`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center justify-between text-xs text-[#86868b] pt-1">
          <span>Mostrando {filteredAudits.length} de {audits.length} contratos auditados</span>
          {(searchTerm || selectedRisk !== 'all' || selectedType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRisk('all');
                setSelectedType('all');
              }}
              className="text-[#0071e3] font-medium hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredAudits.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-12 text-center border border-black/[0.04] dark:border-white/[0.06] shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] text-[#86868b] flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">No se encontraron documentos</h3>
            <p className="text-xs text-[#86868b] mt-1 max-w-sm mx-auto">
              No hay contratos que coincidan con los filtros aplicados. Intenta ampliar tus criterios de búsqueda.
            </p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Apple Rounded Card Table) */
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.02] dark:bg-white/[0.04] text-[#86868b] border-b border-black/[0.04] dark:border-white/[0.06] font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Contrato y Archivo</th>
                  <th className="py-3.5 px-4">Tipo Legal</th>
                  <th className="py-3.5 px-4">Fecha Auditoría</th>
                  <th className="py-3.5 px-4">Vencimiento</th>
                  <th className="py-3.5 px-4">Riesgo Global</th>
                  <th className="py-3.5 px-4">Cumplimiento</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7]">
                {filteredAudits.map((audit) => {
                  const isRiskHigh = audit.overallRiskScore > 60;
                  const isRiskMedium = audit.overallRiskScore > 35 && audit.overallRiskScore <= 60;

                  return (
                    <tr
                      key={audit.id}
                      onClick={() => onSelectAudit(audit)}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0071e3] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-[#0071e3] transition-colors truncate max-w-xs">
                              {audit.contractTitle}
                            </p>
                            <p className="text-[11px] text-[#86868b] font-normal truncate max-w-xs mt-0.5">
                              {audit.fileName} • {audit.fileSize || 'PDF'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-[#86868b]">
                        <span className="text-[11px] bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full">
                          {audit.documentType || 'Mercantil'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#86868b]">{audit.auditDate}</td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-[#ff3b30]">{audit.expirationDate}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isRiskHigh
                              ? 'bg-red-50 dark:bg-red-950/50 text-[#ff3b30]'
                              : isRiskMedium
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-[#ff9500]'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-[#34c759]'
                          }`}
                        >
                          {audit.overallRiskScore} / 100
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{audit.complianceScore}%</span>
                          <div className="w-12 h-1.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                audit.complianceScore >= 80 ? 'bg-[#34c759]' : 'bg-[#ff3b30]'
                              }`}
                              style={{ width: `${audit.complianceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                            audit.status === 'aprobado'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#34c759]'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-[#ff9500]'
                          }`}
                        >
                          {audit.status === 'aprobado' ? 'Aprobado' : 'En Revisión'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectAudit(audit)}
                            className="p-1.5 text-[#86868b] hover:text-[#0071e3] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-full transition-colors cursor-pointer"
                            title="Ver Dictamen"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onExportPDF(audit)}
                            className="p-1.5 text-[#86868b] hover:text-[#ff3b30] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors cursor-pointer"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Deseas eliminar "${audit.contractTitle}" del historial?`)) {
                                onDeleteAudit(audit.id);
                              }
                            }}
                            className="p-1.5 text-[#86868b] hover:text-[#ff3b30] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARDS VIEW (Apple Style Cards) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAudits.map((audit) => {
            const isRiskHigh = audit.overallRiskScore > 60;
            const isRiskMedium = audit.overallRiskScore > 35 && audit.overallRiskScore <= 60;

            return (
              <div
                key={audit.id}
                onClick={() => onSelectAudit(audit)}
                className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 border border-black/[0.04] dark:border-white/[0.06] hover:border-[#0071e3] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#86868b] mb-3">
                    <span className="font-medium text-[#0071e3] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full">
                      {audit.documentType}
                    </span>
                    <span>{audit.auditDate}</span>
                  </div>

                  <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-[#0071e3] transition-colors line-clamp-2">
                    {audit.contractTitle}
                  </h3>

                  <p className="text-xs text-[#86868b] line-clamp-2 mt-2 leading-relaxed">
                    {audit.summary}
                  </p>

                  <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#86868b] uppercase font-medium">Riesgo</span>
                      <p
                        className={`font-semibold text-sm mt-0.5 ${
                          isRiskHigh ? 'text-[#ff3b30]' : isRiskMedium ? 'text-[#ff9500]' : 'text-[#34c759]'
                        }`}
                      >
                        {audit.overallRiskScore}/100
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#86868b] uppercase font-medium">Cumplimiento</span>
                      <p className="font-semibold text-sm text-[#1d1d1f] dark:text-[#f5f5f7] mt-0.5">
                        {audit.complianceScore}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-[#ff3b30]">
                    Vence: {audit.expirationDate}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onExportWord(audit)}
                      className="p-1.5 text-[#86868b] hover:text-[#0071e3] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-full transition-colors cursor-pointer"
                      title="Exportar Word"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportPDF(audit)}
                      className="p-1.5 text-[#86868b] hover:text-[#ff3b30] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors cursor-pointer"
                      title="Exportar PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectAudit(audit)}
                      className="p-1.5 text-[#86868b] hover:text-[#0071e3] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-full transition-colors cursor-pointer flex items-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
