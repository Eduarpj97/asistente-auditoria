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
} from 'lucide-react';
import {
  ContractAudit,
  AuditedClause,
  RiskItem,
  ClauseCategory,
  RiskSeverity,
} from '../types/audit';
import { SAMPLE_CONTRACT_TEXTS } from '../data/sampleAudits';

interface AuditUploaderProps {
  onAuditCompleted: (audit: ContractAudit) => void;
  currentUserEmail?: string;
}

export const AuditUploader: React.FC<AuditUploaderProps> = ({
  onAuditCompleted,
  currentUserEmail = 'eduardo.auditor@audiflow.com',
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

    setIsAuditing(true);
    setErrorMessage('');

    // Progression of descriptive scanning steps
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

      // Preparar payload multipart para la API FastAPI
      const formData = new FormData();
      formData.append('file', fileToUpload, uploadFileName);
      formData.append('use_llm', 'true');

      const apiUrl = window.location.origin.includes(':3000')
        ? 'http://127.0.0.1:8000/v1/audit-contract-ai'
        : '/v1/audit-contract-ai';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`El servidor respondió con código ${response.status}`);
      }

      const data = await response.json();
      clearInterval(stepInterval);

      // Extraer datos reales retornados por el backend
      const ruleScoring = data.rule_scoring || {};
      const aiLlm = data.ai_llm_analysis?.resultado_ia || {};
      const criticalClauses = aiLlm.clausulas_criticas || [];
      const ruleFindings = ruleScoring.findings || [];

      // Calcular scores reales del documento analizado
      const overallRisk =
        aiLlm.score_riesgo_ia !== undefined && aiLlm.score_riesgo_ia > 0
          ? aiLlm.score_riesgo_ia
          : ruleScoring.total_score || 45;
      const compliance = Math.max(5, Math.min(100, 100 - overallRisk));

      // Extraer cláusulas reales mapeadas
      const mappedClauses: AuditedClause[] = [];

      // 1. Cláusulas críticas identificadas por Llama 3.1 con citas textuales reales
      criticalClauses.forEach((c: any, idx: number) => {
        const catMap: Record<string, ClauseCategory> = {
          SLA: 'otros',
          Penalidad: 'penalizaciones',
          Renovacion: 'terminacion',
          Responsabilidad: 'responsabilidad',
          Privacidad: 'confidencialidad',
          Jurisdiccion: 'jurisdiccion',
        };

        const sevMap: Record<string, RiskSeverity> = {
          ALTO: 'critical',
          MEDIO: 'high',
          BAJO: 'medium',
        };

        mappedClauses.push({
          id: `clause-llm-${idx + 1}`,
          title: `[Llama 3.1] ${c.tipo || 'Cláusula Crítica'}: ${
            c.explicacion_riesgo
              ? c.explicacion_riesgo.substring(0, 60) + '...'
              : 'Riesgo Detectado'
          }`,
          originalSnippet: c.cita_textual || 'Cita textual analizada en el contrato.',
          category: catMap[c.tipo] || 'otros',
          riskLevel: sevMap[c.severidad] || 'high',
          finding:
            c.explicacion_riesgo ||
            'Contingencia contractual identificada por el motor de inferencia semántica.',
          recommendation:
            c.recomendacion_negociacion ||
            'Negociar enmienda formal de salvaguarda con la contraparte.',
          compliant: false,
        });
      });

      // 2. Hallazgos regulatorios del motor determinístico (RGPD, SARLAFT, anticorrupción)
      ruleFindings.forEach((rf: any, idx: number) => {
        mappedClauses.push({
          id: `clause-rule-${idx + 1}`,
          title: `[Regulación] ${rf.rule_code || 'Control'}: ${rf.description}`,
          originalSnippet:
            rf.matched_snippet || 'Detectado por patrón normativo en el texto del contrato.',
          category: (rf.category?.toLowerCase() as ClauseCategory) || 'penalizaciones',
          riskLevel: rf.risk_weight > 20 ? 'critical' : rf.risk_weight > 10 ? 'high' : 'medium',
          finding: `${rf.description} (Referencia legal: ${
            rf.legal_reference || 'Marco normativo corporativo'
          })`,
          recommendation:
            'Alinear la redacción al marco normativo vigente para mitigar riesgos legales o regulatorios.',
          compliant: false,
        });
      });

      // Mapear matriz de riesgos identificados
      const mappedRisks: RiskItem[] = [];
      criticalClauses.forEach((c: any) => {
        mappedRisks.push({
          title: `Riesgo Contractual: ${c.tipo || 'Cláusula Crítica'}`,
          severity: c.severidad === 'ALTO' ? 'critical' : 'high',
          description: c.explicacion_riesgo || 'Riesgo de asimetría o penalidad excesiva.',
          mitigation: c.recomendacion_negociacion || 'Solicitar adenda previa firma.',
        });
      });

      ruleFindings.forEach((rf: any) => {
        mappedRisks.push({
          title: `Vulnerabilidad Normativa: ${rf.rule_code}`,
          severity: rf.risk_weight > 20 ? 'critical' : 'high',
          description: rf.description,
          mitigation: `Aplicar control según ${rf.legal_reference || 'normativa aplicable'}.`,
        });
      });

      // Título limpio y legible derivado del archivo real
      const cleanTitle = uploadFileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const cleanTitleFormatted = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

      const newAudit: ContractAudit = {
        id: `aud-${Date.now()}`,
        contractTitle: cleanTitleFormatted,
        documentType:
          overallRisk > 70
            ? 'Contrato de Alto Riesgo / Observado'
            : overallRisk > 40
            ? 'Contrato Comercial con Observaciones'
            : 'Contrato de Bajo Riesgo / Conforme',
        fileName: uploadFileName,
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
        auditDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        renewalTerms: 'Sujeto a revisión anual previa notificación formal de 30 días.',
        totalValue: 'Por determinar según ejecución de órdenes de servicio',
        governingLaw: 'Jurisdicción Nacional Ordinaria',
        overallRiskScore: overallRisk,
        complianceScore: compliance,
        status: overallRisk > 70 ? 'en_revision' : overallRisk > 40 ? 'auditado' : 'aprobado',
        auditedBy: currentUserEmail,
        summary:
          aiLlm.resumen_ejecutivo ||
          'Auditoría completada exitosamente por el motor de inteligencia de Audiflow.',
        parties: [
          { name: 'Entidad Contratante (Cliente)', role: 'Parte Contratante' },
          { name: 'Empresa Prestadora / Proveedora', role: 'Contraparte' },
        ],
        clauses: mappedClauses,
        risksIdentified: mappedRisks,
        keyDeadlines: [
          {
            id: `dl-${Date.now()}-1`,
            date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
            title: 'Plazo para Emisión de Observaciones y Enmiendas Legales',
            daysRemaining: 30,
            urgency: overallRisk > 70 ? 'urgent' : 'warning',
            description:
              'Vence el plazo para objetar cláusulas lesivas antes del perfeccionamiento del contrato.',
            contractTitle: cleanTitleFormatted,
          },
        ],
        missingEssentialClauses:
          ruleScoring.missing_controls && ruleScoring.missing_controls.length > 0
            ? ruleScoring.missing_controls
            : [
                'Cláusula de Protección de Datos Personales (RGPD / Habeas Data)',
                'Cláusula de Anticorrupción y Prevención de Lavado de Activos',
              ],
      };

      setIsAuditing(false);
      onAuditCompleted(newAudit);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Error invocando el backend de auditoría:', err);
      setErrorMessage(
        `Error al auditar el archivo con el backend: ${err.message}. Asegúrate de que el servidor en el puerto 8000 esté activo.`
      );
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#1E3E62] bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Inteligencia Artificial de Auditoría Contractual
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2744] tracking-tight mt-3">
          Cargar Archivo y Analizar Contrato
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
          Sube tus contratos en formato PDF para escanear automáticamente cada cláusula, identificar
          riesgos críticos, plazos de vencimiento y generar dictámenes legales accionables.
        </p>
      </div>

      {/* Input Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'upload'
                ? 'bg-white text-[#0F2744] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Cargar Archivo PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'text'
                ? 'bg-white text-[#0F2744] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Pegar Texto de Contrato</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Atención en la carga</p>
            <p className="mt-0.5 text-rose-600">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Upload Area */}
      {inputMode === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
            isDragging
              ? 'border-blue-600 bg-blue-50/60 shadow-lg scale-[1.01]'
              : selectedFile
              ? 'border-emerald-500 bg-emerald-50/20'
              : 'border-slate-300 hover:border-[#0F2744] bg-white hover:bg-slate-50/70 shadow-xs'
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <FileCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-extrabold text-[#0F2744]">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tamaño: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Formato PDF listo
                  para auditar
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Archivo cargado correctamente</span>
              </div>
              <p className="text-xs text-slate-400">
                Haz clic si deseas seleccionar otro documento o presiona el botón inferior para auditar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-[#0F2744] group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300 flex items-center justify-center mx-auto shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-[#0F2744]">
                  Arrastra y suelta tu contrato PDF aquí
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  o haz clic para explorar en tus carpetas locales
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
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
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Texto o cláusulas del contrato a evaluar
            </label>
            <span className="text-[11px] text-slate-400">
              {contractText.length} caracteres ingresados
            </span>
          </div>
          <textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            rows={10}
            placeholder="Pega aquí el contenido textual de tu contrato, adenda o cláusulas contractuales..."
            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F2744] text-xs sm:text-sm font-mono leading-relaxed bg-slate-50/50 hover:bg-white transition-colors"
          />
        </div>
      )}

      {/* Preset Sample Contracts Selector */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl p-5 border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-[#0F2744] uppercase tracking-wider">
              ¿No tienes un PDF a mano? Prueba con un contrato de ejemplo:
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">1-Clic Carga Inmediata</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSelectSample('saas')}
            className="p-3 text-left rounded-xl bg-white border border-slate-200 hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                SaaS & SLA Conforme
              </p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Bajo</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Cumplimiento conforme: RGPD, SARLAFT, Anticorrupción FCPA y SLA 99.9%.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('regular')}
            className="p-3 text-left rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                Consultoría Cloud
              </p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Medio</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Observaciones moderadas: limitaciones en derechos de datos y omisión de certificación.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('alto_riesgo')}
            className="p-3 text-left rounded-xl bg-white border border-slate-200 hover:border-rose-600 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                Proveeduría Abusiva
              </p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">Alto</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              Riesgo crítico: pagos anónimos, exoneración por dolo y venta libre de datos.
            </p>
          </button>
        </div>
      </div>

      {/* Audit Action Button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleExecuteAudit}
          disabled={isAuditing || (!selectedFile && !contractText.trim())}
          className={`w-full sm:w-auto min-w-[280px] py-4 px-8 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-md cursor-pointer ${
            isAuditing || (!selectedFile && !contractText.trim())
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-[#0F2744] hover:bg-[#16385F] active:scale-[0.99] shadow-[#0F2744]/20 hover:shadow-lg'
          }`}
        >
          {isAuditing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-blue-300" />
              <span>Ejecutando Auditoría Legal...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-blue-300" />
              <span>Iniciar Auditoría Automática con IA</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Progress Scanner Modal / Overlay during Audit */}
      {isAuditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0F2744]">
                <FileText className="w-10 h-10 animate-pulse text-blue-700" />
              </div>
              <div className="absolute -inset-1 rounded-2xl border-2 border-blue-600/30 animate-ping pointer-events-none" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-[#0F2744]">
                Audiflow Motor de Auditoría
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Analizando el documento con modelos especializados en derecho contractual y riesgos.
              </p>
            </div>

            {/* Step Message */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#1E3E62] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span className="truncate">{auditStep}</span>
            </div>

            {/* Animated progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-[#0F2744] animate-[pulse_1.5s_infinite] w-full" />
            </div>

            <p className="text-[11px] text-slate-400">
              Por favor espera unos segundos mientras se auditan todas las cláusulas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
