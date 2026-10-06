import React, { useState } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { KeyDeadline, ContractAudit } from '../types/audit';

interface DeadlineAlertsProps {
  deadlines: KeyDeadline[];
  audits: ContractAudit[];
  onSelectAuditById: (contractId: string) => void;
  onDismissDeadline: (id: string) => void;
  onAddCustomDeadline: (deadline: KeyDeadline) => void;
}

export const DeadlineAlerts: React.FC<DeadlineAlertsProps> = ({
  deadlines,
  audits,
  onSelectAuditById,
  onDismissDeadline,
  onAddCustomDeadline,
}) => {
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'urgent' | 'warning' | 'normal'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Alert form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newUrgency, setNewUrgency] = useState<'urgent' | 'warning' | 'normal'>('warning');
  const [newDesc, setNewDesc] = useState('');
  const [selectedContractId, setSelectedContractId] = useState(audits[0]?.id || '');

  const urgentList = deadlines.filter((d) => d.urgency === 'urgent' && !d.dismissed);
  const warningList = deadlines.filter((d) => d.urgency === 'warning' && !d.dismissed);
  const normalList = deadlines.filter((d) => d.urgency === 'normal' && !d.dismissed);

  const filteredDeadlines = deadlines.filter((d) => {
    if (d.dismissed) return false;
    if (filterUrgency === 'urgent') return d.urgency === 'urgent';
    if (filterUrgency === 'warning') return d.urgency === 'warning';
    if (filterUrgency === 'normal') return d.urgency === 'normal';
    return true;
  });

  const handleCreateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;

    const matchedContract = audits.find((a) => a.id === selectedContractId);

    // Calculate days remaining
    const targetDate = new Date(newDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

    const newDeadline: KeyDeadline = {
      id: `custom-dl-${Date.now()}`,
      title: newTitle,
      date: newDate,
      daysRemaining: diffDays > 0 ? diffDays : 0,
      urgency: newUrgency,
      description: newDesc || 'Alerta personalizada de control contractual.',
      contractId: selectedContractId,
      contractTitle: matchedContract?.contractTitle || 'Contrato Interno',
      dismissed: false,
    };

    onAddCustomDeadline(newDeadline);
    setShowAddModal(false);
    setNewTitle('');
    setNewDate('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
            Alertas y Vencimientos
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] dark:text-[#a1a1a6] mt-1">
            Monitoreo preventivo de renovaciones automáticas, hitos de SLA y plazos de preaviso.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Alerta de Calendario</span>
        </button>
      </div>

      {/* 3 Metric Cards for Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Urgentes */}
        <div className="bg-rose-500/[0.06] dark:bg-rose-500/[0.12] border border-rose-500/20 rounded-2xl p-5 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Alertas Críticas (&lt;7 días)
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-rose-700 dark:text-rose-300 mt-2">{urgentList.length}</p>
          <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
            Requieren notificación inmediata a la contraparte.
          </p>
        </div>

        {/* Card 2: Advertencias */}
        <div className="bg-amber-500/[0.06] dark:bg-amber-500/[0.12] border border-amber-500/20 rounded-2xl p-5 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Ventana de Preaviso (7 - 30 días)
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-amber-800 dark:text-amber-300 mt-2">{warningList.length}</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
            En fase de negociación o preparación de salida.
          </p>
        </div>

        {/* Card 3: Normales */}
        <div className="bg-[#0071e3]/[0.06] dark:bg-[#0071e3]/[0.12] border border-[#0071e3]/20 rounded-2xl p-5 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#0071e3] dark:text-[#3898ec] uppercase tracking-wider">
              Planificados (&gt;30 días)
            </span>
            <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 dark:bg-[#0071e3]/20 text-[#0071e3] dark:text-[#3898ec] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-[#0071e3] dark:text-[#3898ec] mt-2">{normalList.length}</p>
          <p className="text-xs text-[#0071e3]/80 dark:text-[#3898ec]/80 mt-1">
            Bajo supervisión continua y seguimiento ordinario.
          </p>
        </div>
      </div>

      {/* Filter Tabs - Apple Segmented Control */}
      <div className="inline-flex bg-black/[0.05] dark:bg-white/[0.08] p-1 rounded-2xl max-w-md w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setFilterUrgency('all')}
          className={`flex-1 sm:flex-initial sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            filterUrgency === 'all'
              ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-xs'
              : 'text-[#86868b] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
          }`}
        >
          Todas ({deadlines.filter((d) => !d.dismissed).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterUrgency('urgent')}
          className={`flex-1 sm:flex-initial sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            filterUrgency === 'urgent'
              ? 'bg-white dark:bg-[#2c2c2e] text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-[#86868b] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
          }`}
        >
          Críticas ({urgentList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterUrgency('warning')}
          className={`flex-1 sm:flex-initial sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            filterUrgency === 'warning'
              ? 'bg-white dark:bg-[#2c2c2e] text-amber-700 dark:text-amber-400 shadow-xs'
              : 'text-[#86868b] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
          }`}
        >
          Advertencias ({warningList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterUrgency('normal')}
          className={`flex-1 sm:flex-initial sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            filterUrgency === 'normal'
              ? 'bg-white dark:bg-[#2c2c2e] text-[#0071e3] dark:text-[#3898ec] shadow-xs'
              : 'text-[#86868b] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
          }`}
        >
          Normales ({normalList.length})
        </button>
      </div>

      {/* Deadline Items List */}
      {filteredDeadlines.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-12 text-center border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] dark:text-[#a1a1a6] space-y-2">
          <CheckCircle2 className="w-10 h-10 text-[#34c759] mx-auto" />
          <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            No hay alertas pendientes en este filtro
          </h3>
          <p className="text-xs text-[#86868b] dark:text-[#a1a1a6]">
            Todos los plazos contractuales se encuentran al día y bajo control.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeadlines.map((dl, idx) => {
            const isUrgent = dl.urgency === 'urgent';
            const isWarning = dl.urgency === 'warning';

            return (
              <div
                key={dl.id || idx}
                className={`bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 sm:p-6 border transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  isUrgent
                    ? 'border-rose-400/40 dark:border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10'
                    : isWarning
                    ? 'border-amber-400/40 dark:border-amber-500/30'
                    : 'border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold ${
                      isUrgent
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : isWarning
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#3898ec]'
                    }`}
                  >
                    <span className="text-[10px] uppercase leading-none font-semibold">
                      {dl.date.split('-')[1] || 'MES'}
                    </span>
                    <span className="text-base font-bold leading-none mt-1">
                      {dl.date.split('-')[2] || 'DÍA'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {dl.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          isUrgent
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            : isWarning
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                            : 'bg-[#0071e3]/15 text-[#0071e3] dark:text-[#3898ec]'
                        }`}
                      >
                        {dl.daysRemaining !== undefined
                          ? dl.daysRemaining <= 0
                            ? 'VENCE HOY'
                            : `${dl.daysRemaining} DÍAS RESTANTES`
                          : 'PRÓXIMO'}
                      </span>
                    </div>

                    <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] leading-relaxed max-w-2xl">
                      {dl.description}
                    </p>

                    {dl.contractTitle && (
                      <p className="text-[11px] font-medium text-[#86868b] dark:text-[#a1a1a6] flex items-center gap-1.5 pt-1">
                        <span>Contrato:</span>
                        <span className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold">{dl.contractTitle}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0 pt-2 md:pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (dl.id) onDismissDeadline(dl.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#34c759] dark:text-[#30d158] bg-[#34c759]/10 hover:bg-[#34c759]/20 border border-[#34c759]/20 transition-colors cursor-pointer"
                    title="Marcar como atendida"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Marcar Atendida</span>
                  </button>

                  {dl.contractId && (
                    <button
                      type="button"
                      onClick={() => onSelectAuditById(dl.contractId!)}
                      className="p-2 rounded-xl text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title="Ver contrato"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Custom Deadline */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-black/[0.08] dark:border-white/[0.1] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Programar Nueva Alerta de Vencimiento
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeadline} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                  Título del Hito o Plazo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Preaviso de no renovación anual"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                    Nivel de Urgencia
                  </label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  >
                    <option value="urgent" className="dark:bg-[#1c1c1e]">Crítica / Inminente</option>
                    <option value="warning" className="dark:bg-[#1c1c1e]">Advertencia (Preaviso)</option>
                    <option value="normal" className="dark:bg-[#1c1c1e]">Normal / Planificada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                  Vincular a Contrato
                </label>
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                >
                  {audits.map((a) => (
                    <option key={a.id} value={a.id} className="dark:bg-[#1c1c1e]">
                      {a.contractTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868b] dark:text-[#a1a1a6] mb-1">
                  Descripción o Consecuencia Legal
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla las acciones a tomar antes de la fecha límite..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#86868b] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                >
                  Guardar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
