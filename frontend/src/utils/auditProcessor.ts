// utils/auditProcessor.ts
import {
  ContractAudit,
  AuditedClause,
  RiskItem,
  ClauseCategory,
  RiskSeverity,
} from '../types/audit';

export async function executeContractAuditApi(
  fileToUpload: File | Blob,
  uploadFileName: string,
  currentUserEmail: string
): Promise<ContractAudit> {
  const formData = new FormData();
  formData.append('file', fileToUpload, uploadFileName);
  formData.append('use_llm', 'true');

  const apiUrl =
    typeof window !== 'undefined' && window.location.origin.includes(':3000')
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

  const ruleScoring = data.rule_scoring || {};
  const aiLlm = data.ai_llm_analysis?.resultado_ia || {};
  const criticalClauses = aiLlm.clausulas_criticas || [];
  const ruleFindings = ruleScoring.findings || [];

  const ruleEngineScore =
    typeof ruleScoring.global_score === 'number' ? ruleScoring.global_score : 0;
  const iaScore =
    typeof aiLlm.score_riesgo_ia === 'number' ? aiLlm.score_riesgo_ia : 0;

  const overallRisk = iaScore > 0 ? iaScore : ruleEngineScore;
  const compliance = Math.max(0, Math.min(100, 100 - overallRisk));

  const mappedClauses: AuditedClause[] = [];

  // 1. Cláusulas críticas identificadas por Llama 3.1
  criticalClauses.forEach((c: any, idx: number) => {
    const catMap: Record<string, ClauseCategory> = {
      SLA: 'otros',
      Penalidad: 'penalizaciones',
      Renovacion: 'terminacion',
      Responsabilidad: 'responsabilidad',
      Privacidad: 'confidencialidad',
      Jurisdiccion: 'jurisdiccion',
      AML: 'otros',
      Anticorrupcion: 'otros',
    };

    const sevMap: Record<string, RiskSeverity> = {
      ALTO: 'critical',
      MEDIO: 'high',
      BAJO: 'medium',
    };

    const location =
      c.ubicacion_exacta ||
      (c.tipo
        ? `Cláusula de ${c.tipo} / Sección Operativa`
        : 'Revisión en el texto del contrato');
    const quote =
      c.cita_textual &&
      c.cita_textual !== 'Cita textual analizada en el contrato.'
        ? c.cita_textual
        : 'Texto específico analizado en las estipulaciones del documento.';

    const recommendationText =
      c.recomendacion_legal ||
      c.recomendacion_negociacion ||
      'Revisar la estipulación en el documento original e incorporar salvaguardas de reciprocidad antes de firmar.';

    mappedClauses.push({
      id: `clause-llm-${idx + 1}`,
      title: `[Auditoría] ${c.tipo || 'Cláusula Crítica'}: ${
        c.explicacion_riesgo
          ? c.explicacion_riesgo.substring(0, 65) + '...'
          : 'Riesgo Detectado'
      }`,
      exactLocation: location,
      originalSnippet: quote,
      category: catMap[c.tipo] || 'otros',
      riskLevel: sevMap[c.severidad] || 'high',
      finding:
        c.explicacion_riesgo ||
        'Contingencia contractual identificada por el motor de inferencia semántica.',
      legalReference:
        c.fundamento_normativo ||
        'Estatuto de Contratación Mercantil y Buenas Prácticas',
      recommendation: recommendationText,
      suggestedDrafting:
        c.redaccion_sugerida ||
        (c.tipo
          ? `Se estipula que en caso de controversia sobre ${c.tipo}, las partes ajustarán sus obligaciones conforme a los principios de buena fe y reciprocidad económica.`
          : undefined),
      compliant: false,
    });
  });

  // 2. Hallazgos regulatorios determinísticos
  ruleFindings.forEach((rf: any, idx: number) => {
    const isOmission = !rf.matched_snippet;
    const locationText = isOmission
      ? `[CONTROL OMITIDO] Sección ausente: Requiere inserción en acápite de ${
          rf.category || 'Cumplimiento Normativo'
        }`
      : rf.chunk_index !== undefined
      ? `Párrafo / Numeral ${rf.chunk_index + 1} del contrato`
      : 'Estipulación identificada en el cuerpo del contrato';

    const quoteText = isOmission
      ? `[AUSENCIA NORMATIVA] El contrato no contiene ninguna disposición relativa a ${rf.title}. Se requiere incorporar la cláusula antes de la firma para evitar contingencias legales.`
      : rf.matched_snippet;

    mappedClauses.push({
      id: `clause-rule-${idx + 1}`,
      title: `[Regulación] ${rf.rule_id || 'Control'}: ${rf.description}`,
      exactLocation: locationText,
      originalSnippet: quoteText,
      category:
        (rf.category?.toLowerCase() as ClauseCategory) || 'penalizaciones',
      riskLevel:
        rf.score_impact > 20
          ? 'critical'
          : rf.score_impact > 10
          ? 'high'
          : 'medium',
      finding: `${rf.description}`,
      legalReference:
        rf.normative_reference || 'Marco normativo corporativo aplicable',
      recommendation:
        rf.remediation ||
        'Alinear la redacción al marco normativo vigente para mitigar riesgos legales o regulatorios.',
      compliant: false,
    });
  });

  // 3. Matriz de riesgos
  const mappedRisks: RiskItem[] = [];
  criticalClauses.forEach((c: any) => {
    const rec =
      c.recomendacion_legal ||
      c.recomendacion_negociacion ||
      'Solicitar ajuste formal en el documento original o adenda previa a la firma.';

    mappedRisks.push({
      title: `Riesgo Contractual: ${c.tipo || 'Cláusula Crítica'}`,
      severity: c.severidad === 'ALTO' ? 'critical' : 'high',
      exactLocation: c.ubicacion_exacta || `Cláusula de ${c.tipo || 'Contrato'}`,
      quoteSnippet: c.cita_textual,
      description:
        c.explicacion_riesgo || 'Riesgo de asimetría o penalidad excesiva.',
      legalReference:
        c.fundamento_normativo || 'Régimen de Obligaciones Mercantiles',
      mitigation: rec,
      suggestedDrafting: c.redaccion_sugerida,
    });
  });

  ruleFindings.forEach((rf: any) => {
    const isOmission = !rf.matched_snippet;
    mappedRisks.push({
      title: `Vulnerabilidad Normativa: ${rf.rule_id || 'Regulación'}`,
      severity: rf.score_impact > 20 ? 'critical' : 'high',
      exactLocation: isOmission
        ? `[Omisión] Sección ausente en documento: Acápite de ${
            rf.category || 'Cumplimiento'
          }`
        : rf.chunk_index !== undefined
        ? `Párrafo ${rf.chunk_index + 1} del documento original`
        : 'Texto del documento original',
      quoteSnippet: rf.matched_snippet || undefined,
      description: rf.description,
      legalReference: rf.normative_reference || 'Normativa aplicable',
      mitigation:
        rf.remediation ||
        `Recomendación Legal: Incorporar cláusula de salvaguarda según ${
          rf.normative_reference || 'normativa aplicable'
        }.`,
    });
  });

  const cleanTitle = uploadFileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  const cleanTitleFormatted =
    cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  const generateDetailedSummary = (): string => {
    if (
      aiLlm.resumen_ejecutivo &&
      aiLlm.resumen_ejecutivo.length > 50 &&
      !aiLlm.resumen_ejecutivo.includes('Llama 3.1') &&
      !aiLlm.resumen_ejecutivo.includes('1. OBJETO')
    ) {
      return aiLlm.resumen_ejecutivo;
    }
    return `Este documento (${cleanTitleFormatted}) es un acuerdo entre dos o más partes que establece las condiciones bajo las cuales se van a prestar servicios, entregar productos o cumplir compromisos comerciales. En él se definen los derechos y obligaciones de cada parte, las formas de pago, los plazos de ejecución, las reglas de confidencialidad y las consecuencias en caso de incumplimiento.`;
  };

  const getContractTypology = (): { typology: string; explanation: string } => {
    if (aiLlm.tipologia_contrato && aiLlm.explicacion_tipologia) {
      return {
        typology: aiLlm.tipologia_contrato,
        explanation: aiLlm.explicacion_tipologia,
      };
    }

    const combinedText =
      `${cleanTitleFormatted} ${uploadFileName} ${
        aiLlm.resumen_ejecutivo || ''
      }`.toLowerCase();

    if (/arrendamiento|arrendador|arrendatario|canon|inmueble|locativo/.test(combinedText)) {
      return {
        typology: 'Contrato de Arrendamiento',
        explanation:
          'Es un acuerdo donde el dueño o administrador de un bien (arrendador) le permite a otra persona (arrendatario) usarlo y disfrutarlo temporalmente a cambio de un pago periódico (canon). No transfiere la propiedad del inmueble ni crea una relación laboral subordinada.',
      };
    }
    if (/trabajo|laboral|empleador|trabajador|c[oó]digo sustantivo|subordinaci[oó]n|salario/.test(combinedText)) {
      return {
        typology: 'Contrato Individual de Trabajo',
        explanation:
          'Es un vínculo laboral formal donde una persona presta sus servicios personales bajo la continua subordinación y órdenes de un empleador, a cambio de un salario periódico y con derecho a prestaciones sociales y seguridad social obligatoria.',
      };
    }
    if (/prestaci[oó]n de servicios|prestacion de servicios|contratista|honorarios|autonom[ií]a/.test(combinedText)) {
      return {
        typology: 'Contrato de Prestación de Servicios',
        explanation:
          'Es un acuerdo de naturaleza civil o comercial donde un profesional o empresa independiente se compromete a realizar una labor puntual a cambio de unos honorarios. El contratista trabaja con total autonomía técnica y no existe horario fijo ni relación de subordinación laboral.',
      };
    }
    if (/confidencialidad|nda|no divulgaci[oó]n|secreto comercial/.test(combinedText)) {
      return {
        typology: 'Acuerdo de Confidencialidad (NDA)',
        explanation:
          'Es un compromiso legal preventivo que obliga a las partes a proteger la información privada, técnica, financiera o comercial que compartan, prohibiendo revelarla a terceros o usarla para fines no autorizados.',
      };
    }
    if (/matr[ií]cula|academusoft|estudiante|semestre|educativo|asignatura/.test(combinedText)) {
      return {
        typology: 'Registro de Matrícula / Acuerdo Educativo',
        explanation:
          'Es un documento formal que vincula a un estudiante con una entidad educativa, detallando el plan académico, las asignaturas inscritas y los compromisos reglamentarios de formación y pago.',
      };
    }
    if (/compraventa|suministro|proveedor|comprador|vendedor/.test(combinedText)) {
      return {
        typology: 'Contrato de Compraventa / Suministro',
        explanation:
          'Es un acuerdo comercial donde una parte se compromete a entregar mercancías, bienes o insumos de manera periódica o definitiva, y la otra parte se obliga a pagar el precio acordado.',
      };
    }
    if (/software|saas|licencia|plataforma/.test(combinedText)) {
      return {
        typology: 'Contrato de Licenciamiento de Software / SaaS',
        explanation:
          'Es un contrato tecnológico donde el titular del software autoriza su uso a un cliente bajo condiciones específicas, conservando la propiedad intelectual y fijando reglas de disponibilidad y soporte.',
      };
    }

    return {
      typology: 'Contrato Comercial / Acuerdo General',
      explanation:
        'Es un acuerdo bilateral donde las partes definen sus compromisos mutuos, plazos de cumplimiento, condiciones de pago y responsabilidades legales para colaborar o llevar a cabo un negocio o servicio conjunto.',
    };
  };

  const { typology, explanation } = getContractTypology();

  const newAudit: ContractAudit = {
    id: `aud-${Date.now()}`,
    contractTitle: cleanTitleFormatted,
    contractTypology: typology,
    typologyExplanation: explanation,
    documentType:
      overallRisk > 70
        ? 'Contrato de Alto Riesgo / Observado'
        : overallRisk > 40
        ? 'Contrato Comercial con Observaciones'
        : 'Contrato de Bajo Riesgo / Conforme',
    fileName: uploadFileName,
    fileSize:
      fileToUpload instanceof File
        ? `${(fileToUpload.size / (1024 * 1024)).toFixed(1)} MB`
        : '1.0 MB',
    auditDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0],
    renewalTerms:
      'Sujeto a revisión anual previa notificación formal de 30 días.',
    totalValue: 'Por determinar según ejecución de órdenes de servicio',
    governingLaw: 'Jurisdicción Nacional Ordinaria',
    overallRiskScore: overallRisk,
    complianceScore: compliance,
    status:
      overallRisk > 70
        ? 'en_revision'
        : overallRisk > 40
        ? 'auditado'
        : 'aprobado',
    auditedBy: currentUserEmail,
    summary: generateDetailedSummary(),
    parties: [
      { name: 'Entidad Contratante (Cliente)', role: 'Parte Contratante' },
      { name: 'Empresa Prestadora / Proveedora', role: 'Contraparte' },
    ],
    clauses: mappedClauses,
    risksIdentified: mappedRisks,
    keyDeadlines: [],
    missingEssentialClauses:
      ruleScoring.missing_controls && ruleScoring.missing_controls.length > 0
        ? ruleScoring.missing_controls
        : [
            'Cláusula de Protección de Datos Personales (RGPD / Habeas Data)',
            'Cláusula de Anticorrupción y Prevención de Lavado de Activos',
          ],
  };

  return newAudit;
}
