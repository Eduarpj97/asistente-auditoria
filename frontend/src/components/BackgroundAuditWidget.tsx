import React from 'react';
import { BackgroundAuditTask } from '../types/audit';
import { RefreshCw, Maximize2, X, FileText, Sparkles } from 'lucide-react';

interface BackgroundAuditWidgetProps {
  task: BackgroundAuditTask;
  onMaximize: () => void;
  onCancel: () => void;
}

export const BackgroundAuditWidget: React.FC<BackgroundAuditWidgetProps> = ({
  task,
  onMaximize,
  onCancel,
}) => {
  if (task.status !== 'auditing') return null;

  return (
    <aside
      aria-label="Auditoría en segundo plano"
      className="fixed bottom-6 right-6 z-40 max-w-sm w-full sm:w-96 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-black/[0.08] dark:border-white/[0.12] animate-in slide-in-from-bottom-5 duration-300 select-none transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Animated Icon Avatar */}
        <div className="relative w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-900/50 flex items-center justify-center text-[#0071e3] shrink-0">
          <FileText className="w-5 h-5 text-[#0071e3] dark:text-[#2997ff]" />
          <div className="absolute -inset-0.5 rounded-xl border border-[#0071e3]/40 animate-ping opacity-60 pointer-events-none" />
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3] dark:text-[#2997ff] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0071e3] dark:text-[#2997ff]" />
              Auditoría en segundo plano
            </span>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onMaximize}
                title="Ampliar a pantalla completa"
                className="p-1 rounded-md text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onCancel}
                title="Descartar vista"
                className="p-1 rounded-md text-[#86868b] hover:text-[#ff3b30] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] truncate mt-0.5">
            {task.fileName}
          </p>

          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#86868b] dark:text-[#a1a1a6]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0071e3] shrink-0" />
            <span className="truncate">{task.step}</span>
          </div>

          {/* Pulse Progress Bar */}
          <div className="mt-2.5 w-full bg-black/[0.05] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#0071e3] via-blue-400 to-[#34c759] animate-[pulse_1.5s_infinite] w-full" />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-[#86868b]">
            <span>Puedes seguir navegando</span>
            <button
              type="button"
              onClick={onMaximize}
              className="text-[#0071e3] dark:text-[#2997ff] font-medium hover:underline cursor-pointer"
            >
              Ver detalles
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
