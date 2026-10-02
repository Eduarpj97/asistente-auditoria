import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  ArrowUpDown,
  PlusCircle,
} from 'lucide-react';
import { ContractAudit, RiskSeverity } from '../types/audit';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2744] tracking-tight">
            Historial de Documentos Auditados
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Registro cronológico de contratos revisados, dictámenes y trazabilidad legal.
          </p>
        </div>

        <button
          onClick={onNavigateUpload}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F2744] hover:bg-[#16385F] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-blue-300" />
          <span>Auditar Nuevo Contrato</span>
        </button>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, partes contratantes o palabras clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F2744] text-xs bg-slate-50/50"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0F2744] cursor-pointer"
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
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0F2744] cursor-pointer"
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
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0F2744] cursor-pointer"
            >
              <option value="date_desc">Más recientes primero</option>
              <option value="date_asc">Más antiguos primero</option>
              <option value="risk_desc">Mayor riesgo primero</option>
              <option value="comp_asc">Menor cumplimiento primero</option>
            </select>

            {/* Grid vs Table Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-400'
                }`}
                title="Vista de Tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-400'
                }`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Mostrando {filteredAudits.length} de {audits.length} contratos auditados</span>
          {(searchTerm || selectedRisk !== 'all' || selectedType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRisk('all');
                setSelectedType('all');
              }}
              className="text-[#1E3E62] font-semibold hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredAudits.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F2744]">No se encontraron documentos</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No hay contratos que coincidan con los filtros aplicados. Intenta ampliar tus criterios de búsqueda.
            </p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAudits.map((audit) => {
                  const isRiskHigh = audit.overallRiskScore > 60;
                  const isRiskMedium = audit.overallRiskScore > 35 && audit.overallRiskScore <= 60;

                  return (
                    <tr
                      key={audit.id}
                      onClick={() => onSelectAudit(audit)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3E62] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate max-w-xs">
                              {audit.contractTitle}
                            </p>
                            <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                              {audit.fileName} • {audit.fileSize || 'PDF'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">{audit.documentType}</td>
                      <td className="py-4 px-4 text-slate-500">{audit.auditDate}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-rose-600">{audit.expirationDate}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{audit.complianceScore}%</span>
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                audit.complianceScore >= 80 ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${audit.complianceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
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
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectAudit(audit)}
                            className="p-1.5 text-slate-600 hover:text-[#0F2744] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver Dictamen"
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
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Deseas eliminar "${audit.contractTitle}" del historial?`)) {
                                onDeleteAudit(audit.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAudits.map((audit) => {
            const isRiskHigh = audit.overallRiskScore > 60;
            const isRiskMedium = audit.overallRiskScore > 35 && audit.overallRiskScore <= 60;

            return (
              <div
                key={audit.id}
                onClick={() => onSelectAudit(audit)}
                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#0F2744] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-semibold text-[#1E3E62] bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {audit.documentType}
                    </span>
                    <span>{audit.auditDate}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#0F2744] group-hover:text-blue-700 transition-colors line-clamp-2">
                    {audit.contractTitle}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {audit.summary}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Riesgo</span>
                      <p
                        className={`font-black text-sm mt-0.5 ${
                          isRiskHigh ? 'text-rose-600' : isRiskMedium ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {audit.overallRiskScore}/100
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Cumplimiento</span>
                      <p className="font-black text-sm text-slate-800 mt-0.5">
                        {audit.complianceScore}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-rose-600">
                    Vence: {audit.expirationDate}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onExportWord(audit)}
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Exportar Word"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportPDF(audit)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Exportar PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectAudit(audit)}
                      className="p-1.5 text-slate-700 hover:text-[#0F2744] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer font-bold flex items-center"
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
