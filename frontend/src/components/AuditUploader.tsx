import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  HelpCircle,
  FileCode,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Minimize2,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  ContractAudit,
  AuditedClause,
  RiskItem,
  ClauseCategory,
  RiskSeverity,
  BackgroundAuditTask,
} from '../types/audit';
import { SAMPLE_CONTRACT_TEXTS } from '../data/sampleAudits';
import { executeContractAuditApi } from '../utils/auditProcessor';

interface AuditUploaderProps {
  onAuditCompleted: (audit: ContractAudit) => void;
  currentUserEmail?: string;
  onStartBackgroundAudit?: (fileToUpload: File | Blob, uploadFileName: string) => void;
  activeTask?: BackgroundAuditTask | null;
  onMinimizeAudit?: () => void;
  onReopenAuditModal?: () => void;
}

export const AuditUploader: React.FC<AuditUploaderProps> = ({
  onAuditCompleted,
  currentUserEmail = 'eduardo.auditor@audiflow.com',
  onStartBackgroundAudit,
  activeTask,
  onMinimizeAudit,
  onReopenAuditModal,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [contractText, setContractText] = useState<string>('');
  const [contractType, setContractType] = useState<'saas' | 'regular' | 'alto_riesgo'>('saas');
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (file: File) => {
    setErrorMessage('');
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setErrorMessage('Por favor sube un archivo en formato PDF o TXT.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('El archivo excede el límite máximo permitido de 20 MB.');
      return;
    }

    setSelectedFile(file);

    // Read as Base64 for server delivery
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo. Intenta de nuevo.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sampleKey: 'saas' | 'regular' | 'alto_riesgo') => {
    setErrorMessage('');
    setInputMode('text');
    setContractText(SAMPLE_CONTRACT_TEXTS[sampleKey]);
    setSelectedFile(null);
    setFileBase64(null);
  };

  // Run the automated AI Audit (invoking real Audiflow backend on port 8000)
  const handleExecuteAudit = async () => {
    if (!selectedFile && !contractText.trim()) {
      setErrorMessage('Por favor selecciona un archivo PDF o ingresa el texto del contrato a auditar.');
      return;
    }

    setErrorMessage('');

    try {
      let fileToUpload: File | Blob;
      let uploadFileName: string;

      if (selectedFile) {
        fileToUpload = selectedFile;
        uploadFileName = selectedFile.name;
      } else {
        // En modo texto: generar un PDF en memoria usando jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(contractText, 180);
        doc.text(splitText, 10, 10);
        const pdfBlob = doc.output('blob');
        uploadFileName = 'contrato_auditado.pdf';
        fileToUpload = new File([pdfBlob], uploadFileName, { type: 'application/pdf' });
      }

      // Si App.tsx orquesta la auditoría en segundo plano, delegarla para permitir navegación libre
      if (onStartBackgroundAudit) {
        onStartBackgroundAudit(fileToUpload, uploadFileName);
        return;
      }

      // Fallback local execution
      setIsAuditing(true);
      const steps = [
        'Extrayendo texto del contrato (OCR & Segmentación)...',
        'Evaluando 14 Controles Regulatorios (RGPD, SARLAFT, FCPA, ISO 27001)...',
        'Invocando inferencia semántica con Llama 3.1 8B en VPS de Oracle Cloud...',
        'Analizando cláusulas abusivas, asimetrías y penalizaciones de SLA...',
        'Consolidando dictamen jurídico y generando reporte de auditoría...',
      ];

      let currentStep = 0;
      setAuditStep(steps[0]);
      const stepInterval = setInterval(() => {
        currentStep = (currentStep + 1) % steps.length;
        setAuditStep(steps[currentStep]);
      }, 3800);

      const newAudit = await executeContractAuditApi(fileToUpload, uploadFileName, currentUserEmail);
      clearInterval(stepInterval);
      setIsAuditing(false);
      onAuditCompleted(newAudit);
    } catch (err: any) {
      console.error('Error invocando el backend de auditoría:', err);
      setErrorMessage(
        `Error al auditar el archivo con el backend: ${err.message}. Asegúrate de que el servidor en el puerto 8000 esté activo.`
      );
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Banner de Auditoría en progreso si está minimizada */}
      {activeTask && activeTask.status === 'auditing' && activeTask.isMinimized && (
        <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <RefreshCw className="w-4 h-4 text-[#0071e3] animate-spin shrink-0" />
            <div className="text-xs truncate">
              <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Auditoría en progreso:{' '}
                <span className="font-normal text-[#86868b]">{activeTask.fileName}</span>
              </p>
              <p className="text-[#86868b] truncate mt-0.5">{activeTask.step}</p>
            </div>
          </div>
          {onReopenAuditModal && (
            <button
              type="button"
              onClick={onReopenAuditModal}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0071e3] text-white hover:bg-[#0077ed] transition-colors shrink-0 cursor-pointer"
            >
              Ver progreso
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#0071e3] dark:text-[#2997ff] bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200/40 dark:border-blue-900/40 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
          Auditoría Contractual con IA
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mt-3">
          Cargar Archivo y Analizar Contrato
        </h1>
        <p className="text-[#86868b] text-xs sm:text-sm mt-1.5 leading-relaxed">
          Sube tus contratos en formato PDF para escanear automáticamente cada cláusula, identificar
          riesgos críticos, plazos de vencimiento y generar dictámenes legales accionables.
        </p>
      </div>

      {/* Input Mode Selector (iOS Segmented Pill) */}
      <div className="flex justify-center">
        <div className="inline-flex bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full">
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              inputMode === 'upload'
                ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Cargar Archivo PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              inputMode === 'text'
                ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Pegar Texto de Contrato</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[#ff3b30] text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Atención en la carga</p>
            <p className="mt-0.5 opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Upload Area (Apple Style) */}
      {inputMode === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer group bg-white dark:bg-[#1c1c1e] shadow-xs ${
            isDragging
              ? 'border-[#0071e3] bg-blue-50/40 dark:bg-blue-950/40 shadow-md scale-[1.01]'
              : selectedFile
              ? 'border-[#34c759] bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-black/[0.08] dark:border-white/[0.12] hover:border-[#0071e3]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#34c759] flex items-center justify-center mx-auto shadow-xs">
                <FileCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{selectedFile.name}</p>
                <p className="text-xs text-[#86868b] mt-1">
                  Tamaño: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Formato PDF listo
                  para auditar
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#34c759] text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Archivo cargado correctamente</span>
              </div>
              <p className="text-xs text-[#86868b]">
                Haz clic si deseas seleccionar otro documento o presiona el botón inferior para auditar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0071e3] group-hover:scale-105 transition-all duration-300 flex items-center justify-center mx-auto shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Arrastra y suelta tu contrato PDF aquí
                </p>
                <p className="text-xs text-[#86868b] mt-1">
                  o haz clic para explorar en tus carpetas locales
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-[11px] text-[#86868b] font-normal">
                <span>Formatos soportados: PDF, TXT</span>
                <span>•</span>
                <span>Hasta 20 MB por documento</span>
                <span>•</span>
                <span>Cifrado seguro AES-256</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Text Editor Mode */
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 border border-black/[0.04] dark:border-white/[0.06] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              Texto o cláusulas del contrato a evaluar
            </label>
            <span className="text-[11px] text-[#86868b]">
              {contractText.length} caracteres ingresados
            </span>
          </div>
          <textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            rows={10}
            placeholder="Pega aquí el contenido textual de tu contrato, adenda o cláusulas contractuales..."
            className="w-full p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1c1c1e] text-xs sm:text-sm font-mono leading-relaxed bg-black/[0.02] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors"
          />
        </div>
      )}

      {/* Preset Sample Contracts Selector */}
      <div className="bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl p-5 border border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0071e3]" />
            <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              ¿No tienes un PDF a mano? Prueba con un contrato de ejemplo:
            </h4>
          </div>
          <span className="text-[11px] text-[#86868b]">1-Clic Carga Inmediata</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSelectSample('saas')}
            className="p-3.5 text-left rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-[#34c759] hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-[#34c759]">
                SaaS & SLA Conforme
              </p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#34c759]">Bajo</span>
            </div>
            <p className="text-[11px] text-[#86868b] mt-1 line-clamp-2">
              Cumplimiento conforme: RGPD, SARLAFT, Anticorrupción FCPA y SLA 99.9%.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('regular')}
            className="p-3.5 text-left rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-[#ff9500] hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-[#ff9500]">
                Consultoría Cloud
              </p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-[#ff9500]">Medio</span>
            </div>
            <p className="text-[11px] text-[#86868b] mt-1 line-clamp-2">
              Observaciones moderadas: limitaciones en derechos de datos y omisión de certificación.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('alto_riesgo')}
            className="p-3.5 text-left rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-[#ff3b30] hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-[#ff3b30]">
                Proveeduría Abusiva
              </p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-[#ff3b30]">Alto</span>
            </div>
            <p className="text-[11px] text-[#86868b] mt-1 line-clamp-2">
              Riesgo crítico: pagos anónimos, exoneración por dolo y venta libre de datos.
            </p>
          </button>
        </div>
      </div>

      {/* Audit Action Button (Apple Pill Button) */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleExecuteAudit}
          disabled={isAuditing || (!selectedFile && !contractText.trim())}
          className={`w-full sm:w-auto min-w-[280px] py-3.5 px-8 rounded-full font-medium text-sm text-white flex items-center justify-center gap-3 transition-all duration-200 shadow-sm cursor-pointer ${
            isAuditing || (!selectedFile && !contractText.trim())
              ? 'bg-black/20 dark:bg-white/20 text-[#86868b] cursor-not-allowed shadow-none'
              : 'bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.99] hover:shadow-md'
          }`}
        >
          {isAuditing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Ejecutando Auditoría Legal...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Iniciar Auditoría Automática</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Progress Scanner Modal / Overlay during Audit */}
      {((activeTask && activeTask.status === 'auditing' && !activeTask.isMinimized) || isAuditing) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-black/[0.06] dark:border-white/[0.1] text-center space-y-5 animate-in zoom-in-95 duration-200">
            {/* Botón para minimizar y continuar navegando */}
            {onMinimizeAudit && (
              <button
                type="button"
                onClick={onMinimizeAudit}
                title="Continuar navegando en segundo plano"
                className="absolute top-4 right-4 p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}

            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 flex items-center justify-center text-[#0071e3]">
                <FileText className="w-10 h-10 animate-pulse text-[#0071e3]" />
              </div>
              <div className="absolute -inset-1 rounded-2xl border-2 border-[#0071e3]/30 animate-ping pointer-events-none" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Audiflow Motor de Auditoría
              </h3>
              <p className="text-xs text-[#86868b] mt-1 truncate max-w-xs mx-auto">
                {activeTask
                  ? activeTask.fileName
                  : 'Analizando el documento con modelos especializados en derecho contractual y riesgos.'}
              </p>
            </div>

            {/* Step Message */}
            <div className="p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0071e3] shrink-0" />
              <span className="truncate">{activeTask ? activeTask.step : auditStep}</span>
            </div>

            {/* Animated progress bar */}
            <div className="w-full bg-black/[0.04] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0071e3] to-[#5856d6] animate-[pulse_1.5s_infinite] w-full" />
            </div>

            {/* Action button to minimize and continue browsing */}
            {onMinimizeAudit && (
              <button
                type="button"
                onClick={onMinimizeAudit}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#0071e3] dark:text-[#2997ff] bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Navegar y revisar otros contratos en segundo plano</span>
              </button>
            )}

            <p className="text-[11px] text-[#86868b] leading-relaxed">
              Puedes cambiar de pestaña y continuar trabajando. Te avisaremos con una notificación y sonido en cuanto el dictamen esté listo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
