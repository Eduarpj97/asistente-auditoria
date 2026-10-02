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
  Trash2,
  Filter,
  Sparkles,
  Info,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2744] tracking-tight">
            Sistema de Alertas y Vencimientos
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Monitoreo preventivo de renovaciones automáticas, hitos de SLA y plazos de preaviso.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F2744] hover:bg-[#16385F] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-blue-300" />
          <span>Nueva Alerta de Calendario</span>
        </button>
      </div>

      {/* 3 Metric Cards for Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Urgentes */}
        <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Alertas Críticas (&lt;7 días)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-700 mt-2">{urgentList.length}</p>
          <p className="text-xs text-rose-600/90 mt-1">
            Requieren notificación inmediata a la contraparte.
          </p>
        </div>

        {/* Card 2: Advertencias */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Ventana de Preaviso (7 - 30 días)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-800 mt-2">{warningList.length}</p>
          <p className="text-xs text-amber-700/90 mt-1">
            En fase de negociación o preparación de salida.
          </p>
        </div>

        {/* Card 3: Normales */}
        <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Planificados (&gt;30 días)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-900 mt-2">{normalList.length}</p>
          <p className="text-xs text-blue-700/90 mt-1">
            Bajo supervisión continua y seguimiento ordinario.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setFilterUrgency('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filterUrgency === 'all'
              ? 'bg-white text-[#0F2744] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Todas ({deadlines.filter((d) => !d.dismissed).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterUrgency('urgent')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filterUrgency === 'urgent'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Críticas ({urgentList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterUrgency('warning')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filterUrgency === 'warning'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Advertencias ({warningList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterUrgency('normal')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filterUrgency === 'normal'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Normales ({normalList.length})
        </button>
      </div>

      {/* Deadline Items List */}
      {filteredDeadlines.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No hay alertas pendientes en este filtro
          </h3>
          <p className="text-xs text-slate-400">
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
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  isUrgent
                    ? 'border-rose-300/80 bg-rose-50/20'
                    : isWarning
                    ? 'border-amber-300/80'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold ${
                      isUrgent
                        ? 'bg-rose-100 text-rose-700'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase leading-none font-semibold">
                      {dl.date.split('-')[1] || 'MES'}
                    </span>
                    <span className="text-base font-black leading-none mt-1">
                      {dl.date.split('-')[2] || 'DÍA'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#0F2744]">
                        {dl.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isUrgent
                            ? 'bg-rose-600 text-white'
                            : isWarning
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {dl.daysRemaining !== undefined
                          ? dl.daysRemaining <= 0
                            ? 'VENCE HOY'
                            : `${dl.daysRemaining} DÍAS RESTANTES`
                          : 'PRÓXIMO'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {dl.description}
                    </p>

                    {dl.contractTitle && (
                      <p className="text-[11px] font-semibold text-[#1E3E62] flex items-center gap-1.5 pt-1">
                        <span>Contrato:</span>
                        <span className="text-slate-700">{dl.contractTitle}</span>
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    title="Marcar como atendida"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Marcar Atendida</span>
                  </button>

                  {dl.contractId && (
                    <button
                      type="button"
                      onClick={() => onSelectAuditById(dl.contractId!)}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#0F2744] hover:bg-slate-100 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#0F2744]">
                Programar Nueva Alerta de Vencimiento
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeadline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título del Hito o Plazo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Preaviso de no renovación anual"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F2744]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F2744]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nivel de Urgencia
                  </label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F2744]"
                  >
                    <option value="urgent">Crítica / Inminente</option>
                    <option value="warning">Advertencia (Preaviso)</option>
                    <option value="normal">Normal / Planificada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vincular a Contrato
                </label>
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F2744]"
                >
                  {audits.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.contractTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción o Consecuencia Legal
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla las acciones a tomar antes de la fecha límite..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F2744]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0F2744] hover:bg-[#16385F] shadow-xs cursor-pointer"
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
