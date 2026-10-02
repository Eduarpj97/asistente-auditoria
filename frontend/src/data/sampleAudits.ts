import { ContractAudit } from '../types/audit';

export const INITIAL_AUDITS: ContractAudit[] = [
  {
    id: 'aud-2026-001',
    contractTitle: 'Contrato Marco de Servicios de Infraestructura Cloud y SLA',
    documentType: 'Servicios Tecnológicos & SLA',
    fileName: 'Contrato_SaaS_Cloud_Nexus_2026.pdf',
    fileSize: '2.4 MB',
    auditDate: '2026-09-24',
    effectiveDate: '2026-01-15',
    expirationDate: '2026-10-31', // Approaching deadline!
    renewalTerms: 'Renovación automática tácita por periodos anuales salvo notificación con 30 días de anticipación.',
    totalValue: '$144,000 USD / año',
    governingLaw: 'Leyes del Estado de Delaware, EE. UU. / Arbitraje AAA',
    overallRiskScore: 78,
    complianceScore: 74,
    status: 'en_revision',
    auditedBy: 'Auditor Senior Eduardo P.',
    summary:
      'El contrato estipula la provisión de infraestructura en la nube para sistemas de misión crítica. Se detectaron cláusulas altamente asimétricas respecto a penalizaciones por caída de servicio, donde las indemnizaciones están topadas a un máximo del 15% de la mensualidad, mientras que la cláusula de indemnidad traslada responsabilidad desmedida al cliente. La fecha límite de notificación de no renovación expira el 30 de septiembre de 2026.',
    clauses: [
      {
        id: 'c-1',
        title: 'Cláusula 8.2: Nivel de Servicio (SLA) y Créditos',
        originalSnippet:
          'En caso de no cumplir con el SLA del 99.9%, el único y exclusivo remedio del Cliente será un crédito de facturación máximo equivalente al 15% del valor mensual.',
        category: 'penalizaciones',
        riskLevel: 'high',
        finding:
          'Tope de compensación insuficiente para el impacto financiero de caídas en sistemas productivos; se exime al proveedor de daños emergentes y lucro cesante sin excepciones razonables.',
        recommendation:
          'Aumentar el crédito de servicio a un mínimo del 50% escalonado y contemplar derecho de rescisión sin penalización tras 3 incumplimientos consecutivos en un trimestre.',
        compliant: false,
      },
      {
        id: 'c-2',
        title: 'Cláusula 12: Cesión de Datos y Propiedad Intelectual',
        originalSnippet:
          'El Proveedor podrá procesar y agregar datos del Cliente para fines de reentrenamiento de modelos de inteligencia artificial y optimización de servicios de terceros.',
        category: 'propiedad_intelectual',
        riskLevel: 'critical',
        finding:
          'Contraviene la política de confidencialidad y normativas de protección de datos (GDPR / LOPD). Posible fuga de secretos comerciales y datos personales de clientes.',
        recommendation:
          'Eliminar expresamente la autorización de reentrenamiento con datos no anonimizados o estipular cláusula de opt-out incondicional con certificación de no reutilización.',
        compliant: false,
      },
      {
        id: 'c-3',
        title: 'Cláusula 14.1: Confidencialidad y Secreto Industrial',
        originalSnippet:
          'La obligación de confidencialidad subsistirá durante la vigencia del Contrato y por un periodo adicional de cinco (5) años tras su terminación.',
        category: 'confidencialidad',
        riskLevel: 'low',
        finding:
          'Cláusula estándar bien formulada con excepciones válidas por requerimiento judicial formal.',
        recommendation:
          'Asegurar que los secretos comerciales clasificados mantengan confidencialidad por tiempo indefinido.',
        compliant: true,
      },
      {
        id: 'c-4',
        title: 'Cláusula 19: Renovación Automática y Ajuste de Tarifas',
        originalSnippet:
          'El contrato se renovará automáticamente por 12 meses si ninguna de las partes notifica lo contrario con al menos 30 días naturales de antelación. Las tarifas podrán incrementarse hasta un 12% unilateralmente.',
        category: 'terminacion',
        riskLevel: 'high',
        finding:
          'Incremento de tarifa desmedido (12%) superior a la inflación proyectada sin derecho de objeción ni ventana de salida anticipada.',
        recommendation:
          'Vincular el ajuste al IPC oficial (máximo 4% anual) y requerir preaviso mínimo de 60 días para incrementos tarifarios.',
        compliant: false,
      },
    ],
    risksIdentified: [
      {
        title: 'Renovación Forzosa Próxima (Riesgo Financiero Inmediato)',
        severity: 'critical',
        description:
          'Si no se envía la notificación de no renovación antes del 1 de octubre de 2026, el contrato se extenderá por otro año con recargo del 12%.',
        mitigation: 'Emitir y remitir burofax o carta notarial antes del 30 de septiembre.',
      },
      {
        title: 'Uso de Datos Corporativos en Modelos de IA Externos',
        severity: 'critical',
        description:
          'Riesgo de sanción regulatoria y pérdida de control sobre propiedad intelectual.',
        mitigation: 'Exigir anexo de procesamiento de datos (DPA) con exclusión estricta.',
      },
      {
        title: 'Limitación Desproporcionada de Responsabilidad del Proveedor',
        severity: 'high',
        description:
          'Límite de indemnización de solo 1 mes de cuota ante fallos catastróficos.',
        mitigation: 'Negociar super-cap equivalente al 100% de la facturación de los últimos 12 meses.',
      },
    ],
    keyDeadlines: [
      {
        id: 'dl-1',
        date: '2026-10-01',
        title: 'Preaviso No Renovación Automática (30 días)',
        daysRemaining: 2,
        urgency: 'urgent',
        description: 'Vence el plazo para notificar rechazo a la prórroga anual con incremento de tarifa.',
      },
      {
        id: 'dl-2',
        date: '2026-10-31',
        title: 'Vencimiento Formal del Contrato',
        daysRemaining: 32,
        urgency: 'warning',
        description: 'Fecha final del periodo anual en curso.',
      },
      {
        id: 'dl-3',
        date: '2026-11-15',
        title: 'Auditoría Anual de Seguridad SOC2',
        daysRemaining: 47,
        urgency: 'normal',
        description: 'Plazo para entrega de certificados de auditoría externa por parte del proveedor.',
      },
    ],
    missingEssentialClauses: [
      'Cláusula de Fuerza Mayor detallada ante catástrofes cibernéticas',
      'Acuerdo de Transición y Migración de Datos (Exit Assistance) al finalizar el servicio',
      'Auditoría independiente presencial o remota por parte del cliente',
      'Seguro de Responsabilidad Civil Cibernética mínimo exigible de $5M USD',
    ],
    parties: [
      { name: 'Nexus Cloud Technologies LLC', role: 'Proveedor del Servicio', idNumber: 'US-DEL-984412' },
      { name: 'Corporación Global de Inversiones S.A.', role: 'Cliente', idNumber: 'ES-B87492104' },
    ],
  },
  {
    id: 'aud-2026-002',
    contractTitle: 'Acuerdo de Confidencialidad Bilateral y No Competencia (NDA)',
    documentType: 'Confidencialidad & Propiedad Intelectual',
    fileName: 'NDA_Bilateral_Alianza_Estrategica_2026.pdf',
    fileSize: '1.1 MB',
    auditDate: '2026-09-27',
    effectiveDate: '2026-03-01',
    expirationDate: '2027-03-01',
    renewalTerms: 'No renovable automáticamente. Vigencia fija de 1 año con 3 años de secreto posterior.',
    totalValue: 'N/A (Obligación de No Hacer)',
    governingLaw: 'Leyes de Madrid, España / Juzgados Ordinarios',
    overallRiskScore: 32,
    complianceScore: 91,
    status: 'aprobado',
    auditedBy: 'Auditor Senior Eduardo P.',
    summary:
      'Acuerdo de confidencialidad recíproco firmado con motivo de negociaciones preliminares de joint venture. Estructura balanceada, definición simétrica de información protegida y exclusiones normativas transparentes. La cláusula de no contratación de empleados se encuentra debidamente acotada a personal clave.',
    clauses: [
      {
        id: 'c-201',
        title: 'Cláusula 1: Definición de Información Confidencial',
        originalSnippet:
          'Se considerará Información Confidencial toda información técnica, comercial, financiera o estratégica revelada por escrito o electrónicamente con marca visible de confidencial.',
        category: 'confidencialidad',
        riskLevel: 'low',
        finding: 'Definición precisa que protege de ambigüedades respecto a conversaciones informales.',
        recommendation: 'Añadir que la información oral ratificada en 7 días hábiles también queda protegida.',
        compliant: true,
      },
      {
        id: 'c-202',
        title: 'Cláusula 5: Prohibición de Contratación (Non-Solicitation)',
        originalSnippet:
          'Ninguna de las partes contratará directa ni indirectamente a empleados clave involucrados en las conversaciones durante 12 meses tras el término del acuerdo.',
        category: 'otros',
        riskLevel: 'medium',
        finding: 'Válido y razonable en tiempo y ámbito subjetivo para evitar fuga de talento clave.',
        recommendation: 'Aclarar que los anuncios públicos de empleo masivo están exentos.',
        compliant: true,
      },
    ],
    risksIdentified: [
      {
        title: 'Falta de Cláusula Penal Tasada por Revelación',
        severity: 'medium',
        description: 'En caso de divulgación indebida, la cuantificación de daños patrimoniales puede resultar compleja ante tribunales.',
        mitigation: 'Introducir una penalidad convencional predeterminada de 50.000 € por incumplimiento probado.',
      },
    ],
    keyDeadlines: [
      {
        id: 'dl-4',
        date: '2027-03-01',
        title: 'Fin de la Fase de Negociación Preliminar',
        daysRemaining: 153,
        urgency: 'normal',
        description: 'Expiración del periodo de intercambio confidencial de proyectos.',
      },
    ],
    missingEssentialClauses: [
      'Cláusula expresa de destrucción certificada de soportes físicos y digitales',
    ],
    parties: [
      { name: 'Grupo Innovación Digital S.L.', role: 'Parte Divulgadora / Receptora', idNumber: 'B-88392102' },
      { name: 'Soluciones Logísticas Avanzadas S.A.', role: 'Parte Divulgadora / Receptora', idNumber: 'A-28941029' },
    ],
  },
  {
    id: 'aud-2026-003',
    contractTitle: 'Contrato de Arrendamiento de Oficinas Corporativas Torre Norte',
    documentType: 'Arrendamiento Inmobiliario Comercial',
    fileName: 'Arrendamiento_Oficinas_Piso14_2026.pdf',
    fileSize: '3.8 MB',
    auditDate: '2026-09-18',
    effectiveDate: '2024-11-01',
    expirationDate: '2026-10-31', // Approaching deadline!
    renewalTerms: 'Opción preferente de prórroga por 2 años sujeta a revisión de renta de mercado.',
    totalValue: '$180,000 USD / año + Cuota de Mantenimiento',
    governingLaw: 'Legislación Urbana Local / Jurisdicción Civil',
    overallRiskScore: 64,
    complianceScore: 82,
    status: 'en_revision',
    auditedBy: 'Auditor Senior Eduardo P.',
    summary:
      'Contrato de arrendamiento de la sede central (piso 14). Requiere atención urgente debido a que la opción preferente de prórroga contractual vence 60 días antes del término (1 de septiembre de 2026, ya en periodo de gracia). Existen penalizaciones de doble canon diario por entrega tardía de llaves y cláusula de restitución al estado original rigurosa.',
    clauses: [
      {
        id: 'c-301',
        title: 'Cláusula 6: Cláusula Penal por Retención Indebida',
        originalSnippet:
          'Vencido el plazo del arrendamiento, por cada día de demora en la desocupación el Arrendatario pagará el triple del canon diario proporcional, sin que ello implique prórroga.',
        category: 'penalizaciones',
        riskLevel: 'high',
        finding: 'Penalidad de 3x canon diario es desproporcionada y susceptible de reclamo judicial.',
        recommendation: 'Negociar reducción al 1.5x o plazo de gracia de 10 días para mudanza técnica.',
        compliant: false,
      },
      {
        id: 'c-302',
        title: 'Cláusula 11: Obras, Reformas y Restitución del Inmueble',
        originalSnippet:
          'Todas las mejoras quedarán a beneficio de la propiedad sin indemnización alguna, salvo que el Arrendador exija su remoción a costa del Arrendatario dejándolo en obra gris.',
        category: 'responsabilidad',
        riskLevel: 'medium',
        finding: 'Riesgo de costo imprevisto millonario al desalojar las oficinas si exigen retirar cableado e instalaciones.',
        recommendation: 'Pactar inventario de mejoras admitidas sin obligación de desmantelamiento.',
        compliant: false,
      },
    ],
    risksIdentified: [
      {
        title: 'Vencimiento de Opción de Renovación Preferente',
        severity: 'critical',
        description: 'El plazo para ejercer el derecho de permanencia en las oficinas vence este mes.',
        mitigation: 'Remitir carta de intención antes del viernes para asegurar las condiciones de renta preferencial.',
      },
    ],
    keyDeadlines: [
      {
        id: 'dl-5',
        date: '2026-10-15',
        title: 'Inspección Conjunta de Entrega y Fianza',
        daysRemaining: 16,
        urgency: 'urgent',
        description: 'Revisión pericial del estado del inmueble para devolución del depósito de garantía ($45,000 USD).',
      },
      {
        id: 'dl-6',
        date: '2026-10-31',
        title: 'Vencimiento del Arrendamiento Piso 14',
        daysRemaining: 32,
        urgency: 'warning',
        description: 'Fecha final del contrato actual de oficinas.',
      },
    ],
    missingEssentialClauses: [
      'Cláusula de derecho de subarriendo o cesión a filiales del grupo',
      'Exención de pago de canon en caso de inhabitabilidad sobrevenida por sismo o siniestro',
    ],
    parties: [
      { name: 'Inmobiliaria Corporativa del Parque S.A.P.I.', role: 'Arrendador', idNumber: 'RFC-ICP180902AB1' },
      { name: 'Servicios de Tecnología Financiera S.A. de C.V.', role: 'Arrendatario', idNumber: 'RFC-STF210419XYZ' },
    ],
  },
  {
    id: 'aud-2026-004',
    contractTitle: 'Contrato de Suministro y Distribución Exclusiva Farmacéutica',
    documentType: 'Suministro y Distribución Comercial',
    fileName: 'Contrato_Distribucion_Exclusiva_2026.pdf',
    fileSize: '4.2 MB',
    auditDate: '2026-09-10',
    effectiveDate: '2025-01-01',
    expirationDate: '2027-12-31',
    renewalTerms: 'Prórroga sujeta al cumplimiento de cuotas mínimas anuales de compra del 90%.',
    totalValue: '$1,200,000 USD / trienio',
    governingLaw: 'Código de Comercio / Tribunal Arbitral de Comercio Internacional',
    overallRiskScore: 48,
    complianceScore: 88,
    status: 'aprobado',
    auditedBy: 'Auditor Senior Eduardo P.',
    summary:
      'Contrato de suministro mayorista de insumos hospitalarios. Otorga exclusividad territorial en la región sur. Cuotas mínimas de compra exigibles y penalidades por quiebre de stock reguladas razonablemente.',
    clauses: [
      {
        id: 'c-401',
        title: 'Cláusula 4: Cuota Mínima y Mantenimiento de Exclusividad',
        originalSnippet:
          'El Distribuidor deberá alcanzar un volumen de compra anual no inferior a $400.000 USD. El incumplimiento dará derecho al Proveedor a revocar la exclusividad.',
        category: 'pagos',
        riskLevel: 'medium',
        finding: 'Mecanismo equilibrado de pérdida de exclusividad sin rescisión traumática inmediata.',
        recommendation: 'Incluir cláusula de ajuste por desabastecimiento generalizado o crisis sanitaria.',
        compliant: true,
      },
    ],
    risksIdentified: [
      {
        title: 'Fluctuación Cambiaria en Costos de Importación',
        severity: 'medium',
        description: 'Precios fijados en dólares estadounidenses con traslado íntegro de aranceles.',
        mitigation: 'Contratar cobertura de divisas para el primer semestre.',
      },
    ],
    keyDeadlines: [
      {
        id: 'dl-7',
        date: '2026-12-15',
        title: 'Evaluación de Cumplimiento de Cuota Anual 2026',
        daysRemaining: 77,
        urgency: 'normal',
        description: 'Cierre contable para certificar el mantenimiento de la exclusividad territorial 2027.',
      },
    ],
    missingEssentialClauses: [
      'Cláusula de retirada de producto (Recall) con asignación de costos de notificación y destrucción',
    ],
    parties: [
      { name: 'Laboratorios Farmacéuticos BioMed S.A.', role: 'Fabricante / Proveedor', idNumber: 'BIO-29381' },
      { name: 'Distribuidora Médica del Sur S.R.L.', role: 'Distribuidor Exclusivo', idNumber: 'DMS-84920' },
    ],
  },
];

export const SAMPLE_CONTRACT_TEXTS = {
  saas: `CONTRATO DE LICENCIA DE SOFTWARE COMO SERVICIO (SaaS) Y GESTIÓN DE DATOS

Entre NEXUS CLOUD SOLUTIONS S.L. (el "Proveedor") y la entidad contratante (el "Cliente"):

CLÁUSULA PRIMERA: OBJETO DEL SERVICIO
El Proveedor concederá al Cliente una licencia no exclusiva e intransferible para acceder a la plataforma transaccional de software en la nube.

CLÁUSULA SEGUNDA: PROTECCIÓN DE DATOS PERSONALES (HABEAS DATA & RGPD)
Las partes darán estricto cumplimiento a la legislación de protección de datos personales (Ley 1581 de 2012 y RGPD). Toda información y tratamiento de datos personales contará con autorización del titular de los datos. Se garantizan expresamente los derechos ARCO (Acceso, Rectificación, Cancelación y Oposición).

CLÁUSULA TERCERA: PREVENCIÓN DE LAVADO DE ACTIVOS (AML/CFT / SARLAFT / SAGRILAFT)
Las partes declaran bajo juramento que sus recursos provienen de origen lícito y no de lavado de activos ni financiación del terrorismo. Autorizan la verificación periódica del origen de fondos en listas restrictivas y OFAC conforme al sistema SARLAFT / SAGRILAFT.

CLÁUSULA CUARTA: ANTICORRUPCIÓN Y CÓDIGO DE ÉTICA (FCPA / ISO 37001)
Las partes se comprometen a actuar bajo principios de ética y cero tolerancia al soborno y a la corrupción, prohibiendo expresamente cualquier soborno, dádiva o pagos de facilitación, conforme a los estándares anticorrupción y directrices FCPA.

CLÁUSULA QUINTA: NIVELES DE SERVICIO (SLA) Y SEGURIDAD
El Proveedor garantiza una disponibilidad mensual mínima del 99.9% con cifrado de datos AES-256. Cada parte responderá por los perjuicios directos causados por el incumplimiento de sus obligaciones contractuales.`,

  regular: `ACUERDO GENERAL DE CONSULTORÍA TECNOLÓGICA Y SERVICIOS CLOUD

Entre CLOUD CONSULTING CORP (el "Proveedor") y la entidad contratante (el "Cliente"):

CLÁUSULA PRIMERA: OBJETO Y ALCANCE
El Proveedor prestará servicios de consultoría tecnológica y gestión de infraestructura en la nube para el Cliente.

CLÁUSULA SEGUNDA: MANEJO DE DATOS Y RESTRICCIÓN DE DERECHOS
Se mantendrá la confidencialidad estándar sobre documentos. En materia de datos personales, el cliente autoriza el tratamiento, pero se establece que no habrá derecho a solicitar la supresión de datos ni revocar la autorización mientras subsista el contrato.

CLÁUSULA TERCERA: ÉTICA Y CÓDIGO DE CONDUCTA
Las partes manifiestan su compromiso de anticorrupción y antisoborno prohibiendo el soborno en las actividades comerciales.

CLÁUSULA CUARTA: DECLARACIÓN DE FONDOS
Las partes declaran la prevención de lavado de activos y origen lícito de recursos en sus transacciones bancarias.

CLÁUSULA QUINTA: DISPONIBILIDAD Y RESPONSABILIDAD
El Proveedor procurará ofrecer disponibilidad del 95%. La responsabilidad máxima acumulada no excederá del 50% del valor del pago mensual.`,

  alto_riesgo: `CONTRATO PRIVADO DE PROVEEDURÍA TECNOLÓGICA Y DESARROLLO DE SOFTWARE

Entre DESARROLLOS ANÓNIMOS S.A.S. (el "Proveedor") y la entidad contratante (el "Cliente"):

CLÁUSULA PRIMERA: PAGOS EN EFECTIVO SIN SOPORTE Y CUENTAS ANÓNIMAS
Se autorizan explícitamente pagos en efectivo sin soporte bancario ni factura a cuentas anónimas o terceros no identificados designados verbalmente.

CLÁUSULA SEGUNDA: EXONERACIÓN POR DOLO Y CULPA GRAVE
El Proveedor gozará de total exoneración por dolo o culpa grave y no habrá responsabilidad aun por incumplimiento grave o caída total de la infraestructura.

CLÁUSULA TERCERA: CESIÓN Y VENTA IRRESTRICTA DE DATOS PERSONALES
Se autoriza ceder, vender y transferir libremente a terceros sin restricción los datos y la información personal recolectada sin requerir consentimiento.

CLÁUSULA CUARTA: PAGOS DE FACILITACIÓN Y AUTORIZACIÓN DE SOBORNOS
Las partes acuerdan que se permite la entrega de pagos de facilitación y regalos a funcionarios públicos o privados para agilizar trámites contractuales.

CLÁUSULA QUINTA: AUSENCIA TOTAL DE GARANTÍAS DE DISPONIBILIDAD (SLA 0%)
No se garantiza ninguna disponibilidad del servicio ni copias de respaldo. La destrucción total o pérdida masiva de datos no generará indemnización alguna.`
};
