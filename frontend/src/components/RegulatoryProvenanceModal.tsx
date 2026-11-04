import React from 'react';
import {
  Scale,
  ShieldCheck,
  Globe,
  Calendar,
  Building2,
  ExternalLink,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AuditedClause, RiskItem } from '../types/audit';

interface RegulatoryProvenanceModalProps {
  item: AuditedClause | RiskItem;
  onClose: () => void;
}

export const RegulatoryProvenanceModal: React.FC<RegulatoryProvenanceModalProps> = ({
  item,
  onClose,
}) => {
  const legalRef = item.legalReference || 'Directriz Normativa Corporativa';
  const issuing = item.issuingBody || 'Organismo Regulatorio Competente';
  const jurisdiction = item.jurisdiction || 'Jurisdicción Nacional Ordinaria';
  const officialSource = item.officialSource || item.legalReference || 'Gaceta Oficial / Código de Comercio';
  const lastRev = item.lastReviewed || '2026-10-15';
  const status = item.normativeStatus || 'VIGENTE';
  const criteria =
    item.applicabilityCriteria ||
    'Aplica como directriz rectora de debida diligencia contractual, buena fe y mitigación de contingencias legales.';
  const officialUrl = item.officialUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="regulatory-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-3xl shadow-2xl border border-black/[0.08] dark:border-white/[0.1] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con estilo Apple Glass */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-[#0071e3] dark:text-[#2997ff]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 id="regulatory-modal-title" className="text-sm sm:text-base font-bold flex items-center gap-2">
                Ficha Técnica de Validez Regulatoria
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  {status}
                </span>
              </h3>
              <p className="text-xs text-[#86868b] dark:text-[#98989d]">
                Trazabilidad oficial de procedencia, jurisdicción aplicable y vigencia 2026
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de ficha regulatoria"
            className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs sm:text-sm">
          {/* Título y Referencia Legal */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071e3] dark:text-[#2997ff]">
                Control / Norma Evaluada:
              </span>
              <span className="text-[11px] font-mono text-[#86868b] dark:text-[#98989d]">
                Revisión: {lastRev}
              </span>
            </div>
            <p className="font-semibold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">
              {legalRef}
            </p>
            <p className="text-xs text-[#86868b] dark:text-[#a1a1a6]">
              {item.title}
            </p>
          </div>

          {/* Grid de Organismo Emisor, Jurisdicción y Fuente Oficial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Organismo Emisor */}
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] dark:text-[#98989d]">
                <Building2 className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Organismo Emisor / Autoridad</span>
              </div>
              <p className="font-medium text-xs text-[#1d1d1f] dark:text-[#f5f5f7]">
                {issuing}
              </p>
            </div>

            {/* Jurisdicción */}
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] dark:text-[#98989d]">
                <Globe className="w-3.5 h-3.5 text-[#34c759]" />
                <span>Jurisdicción y Ámbito</span>
              </div>
              <p className="font-medium text-xs text-[#1d1d1f] dark:text-[#f5f5f7]">
                {jurisdiction}
              </p>
            </div>
          </div>

          {/* Fuente Oficial / Gaceta */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-black/30 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] dark:text-[#98989d]">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Gaceta, Diario Oficial o Estándar Internacional</span>
            </div>
            <p className="font-mono text-xs text-[#1d1d1f] dark:text-[#f5f5f7]">
              {officialSource}
            </p>
          </div>

          {/* Test de Aplicabilidad al Contrato */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Criterio de Aplicabilidad al Contrato Analizado</span>
            </div>
            <p className="text-xs leading-relaxed text-[#1d1d1f] dark:text-[#e5e5ea]">
              {criteria}
            </p>
          </div>

          {/* Enlace Oficial a la Norma */}
          {officialUrl && (
            <div className="pt-2 flex justify-end">
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
              >
                <span>Consultar Publicación Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-[#86868b]">
            Audiflow Compliance Intelligence Engine • 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
