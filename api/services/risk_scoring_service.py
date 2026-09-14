# services/risk_scoring_service.py
import re
from typing import Optional
from schemas import (
    TrafficLightColor,
    RiskSeverity,
    RegulatoryCategory,
    RiskFinding,
    CategoryScore,
    RiskAssessmentResponse,
    RiskRuleInfo
)

CATEGORY_NAMES = {
    RegulatoryCategory.PROTECCION_DATOS: "Protección de Datos & Privacidad (GDPR / Habeas Data)",
    RegulatoryCategory.AML_CFT: "Prevención de Lavado de Activos & FT (SARLAFT / SAGRILAFT)",
    RegulatoryCategory.ANTICORRUPCION_ETICA: "Anticorrupción, Ética & Antisoborno (FCPA / ISO 37001)",
    RegulatoryCategory.SEGURIDAD_INFORMACION: "Seguridad de la Información & Ciberseguridad",
    RegulatoryCategory.CUMPLIMIENTO_CONTRACTUAL: "Cumplimiento Contractual, Laboral & Legal",
    RegulatoryCategory.GENERAL: "Riesgos Normativos Generales"
}

PROHIBITION_PATTERNS = re.compile(
    r"\b(prohib\w+|cero\s+tolerancia|abstenerse|no\s+(se\s+)?(permit|autoriz|admit)\w*|rechaz\w+|evitar|sancion\w*)\b",
    re.IGNORECASE
)

class RegulatoryRule:
    def __init__(
        self,
        rule_id: str,
        title: str,
        category: RegulatoryCategory,
        severity: RiskSeverity,
        weight: float,
        description: str,
        remediation: str,
        normative_reference: str,
        is_mandatory_clause: bool = False,
        presence_patterns: Optional[list[str]] = None,
        mandatory_patterns: Optional[list[str]] = None
    ):
        self.rule_id = rule_id
        self.title = title
        self.category = category
        self.severity = severity
        self.weight = weight
        self.description = description
        self.remediation = remediation
        self.normative_reference = normative_reference
        self.is_mandatory_clause = is_mandatory_clause
        self.presence_patterns = [re.compile(p, re.IGNORECASE | re.MULTILINE) for p in (presence_patterns or [])]
        self.mandatory_patterns = [re.compile(p, re.IGNORECASE | re.MULTILINE) for p in (mandatory_patterns or [])]

# Catálogo exhaustivo de reglas normativas preconfiguradas
REGULATORY_RULES_CATALOG: list[RegulatoryRule] = [
    # --- 1. PROTECCIÓN DE DATOS (GDPR / LEY 1581 / HABEAS DATA) ---
    RegulatoryRule(
        rule_id="PRIV_001",
        title="Omisión de Cláusula de Protección de Datos Personales (Habeas Data)",
        category=RegulatoryCategory.PROTECCION_DATOS,
        severity=RiskSeverity.ALTO,
        weight=30.0,
        description="El documento no contiene estipulaciones sobre tratamiento, confidencialidad ni autorización de datos personales.",
        remediation="Incorporar una cláusula específica de tratamiento de datos personales conforme al RGPD / Ley de Protección de Datos aplicable, definiendo finalidades y derechos de los titulares.",
        normative_reference="RGPD Art. 6, 7, 28 / Ley 1581 de 2012",
        is_mandatory_clause=True,
        mandatory_patterns=[
            r"protecci[oó]n de datos",
            r"datos personales",
            r"habeas data",
            r"tratamiento de datos",
            r"derechos arco",
            r"titular de los datos"
        ]
    ),
    RegulatoryRule(
        rule_id="PRIV_002",
        title="Transferencia no consentida o cesión irrestricta de datos personales",
        category=RegulatoryCategory.PROTECCION_DATOS,
        severity=RiskSeverity.ALTO,
        weight=25.0,
        description="Se identificó texto que sugiere la cesión, venta o transferencia de datos sensibles a terceros sin autorización previa expresa.",
        remediation="Condicionar toda transferencia o cesión de datos a la autorización explícita y previa del titular o base legal legítima.",
        normative_reference="RGPD Art. 44-49 / Circular SIC",
        presence_patterns=[
            r"(ceder|vender|transferir|compartir)\s+(libremente|sin\s+autorizaci[oó]n|a\s+terceros\s+sin\s+restricci[oó]n)\s+(los\s+datos|informaci[oó]n\s+personal)",
            r"renuncia\s+al\s+derecho\s+de\s+(cancelaci[oó]n|supresi[oó]n|habeas\s+data)",
            r"facultad\s+irrevocable\s+para\s+comercializar\s+(los\s+datos|informaci[oó]n\s+privada)"
        ]
    ),
    RegulatoryRule(
        rule_id="PRIV_003",
        title="Falta de mención de canales o ejercicio de Derechos de los Titulares",
        category=RegulatoryCategory.PROTECCION_DATOS,
        severity=RiskSeverity.MEDIO,
        weight=15.0,
        description="Aunque se mencionan datos personales, se restringe o no se indica claramente el procedimiento para ejercer derechos ARCO.",
        remediation="Especificar un correo electrónico, canal físico o virtual y tiempos máximos de respuesta para la atención de solicitudes de los titulares.",
        normative_reference="RGPD Art. 12-15 / Régimen Legal de Protección de Datos",
        presence_patterns=[
            r"no\s+(habr[aá]|tendr[aá])\s+derecho\s+a\s+(solicitar\s+la\s+supresi[oó]n|rectificar|revocar)",
            r"sin\s+(posibilidad|derecho)\s+de\s+revocar\s+la\s+autorizaci[oó]n"
        ]
    ),

    # --- 2. PREVENCIÓN DE LAVADO DE ACTIVOS Y FINANCIACIÓN DEL TERRORISMO (AML/CFT) ---
    RegulatoryRule(
        rule_id="AML_001",
        title="Omisión de Cláusula de Prevención de Lavado de Activos y Verificación de Listas",
        category=RegulatoryCategory.AML_CFT,
        severity=RiskSeverity.ALTO,
        weight=35.0,
        description="No se identificó declaración de origen lícito de fondos ni compromiso de consulta en listas restrictivas vinculantes (OFAC, ONU, etc.).",
        remediation="Incluir cláusula SARLAFT/SAGRILAFT/AML certificando el origen lícito de recursos y autorizando la verificación en listas de control internacional.",
        normative_reference="Recomendaciones GAFI / Circulares SAGRILAFT-SARLAFT",
        is_mandatory_clause=True,
        mandatory_patterns=[
            r"lavado de activos",
            r"origen de fondos",
            r"financiac[oó]n del terrorismo",
            r"sarlaft",
            r"sagrilaft",
            r"listas restrictivas",
            r"ofac",
            r"origen l[ií]cito"
        ]
    ),
    RegulatoryRule(
        rule_id="AML_002",
        title="Riesgo de Operaciones en Efectivo no Justificadas o Instrumentos Anónimos",
        category=RegulatoryCategory.AML_CFT,
        severity=RiskSeverity.ALTO,
        weight=30.0,
        description="Se detectan referencias a transacciones en efectivo no trazables, cuentas no identificadas o instrumentos al portador incompatibles con la debida diligencia.",
        remediation="Exigir que todos los pagos y transferencias se realicen exclusivamente a través de entidades financieras vigiladas a nombre del titular del contrato.",
        normative_reference="Estatuto Orgánico del Sistema Financiero / Normas Anti-Money Laundering",
        presence_patterns=[
            r"pagos?\s+en\s+efectivo\s+sin\s+(recibo|soporte|factura|bancarizar)",
            r"cuentas?\s+(an[oó]nimas?|no\s+declaradas?)",
            r"terceros?\s+no\s+identificados?\s+como\s+beneficiarios?"
        ]
    ),
    RegulatoryRule(
        rule_id="AML_003",
        title="Falta de Cláusula de Terminación Inmediata por Inclusión en Listas Sancionatorias",
        category=RegulatoryCategory.AML_CFT,
        severity=RiskSeverity.MEDIO,
        weight=15.0,
        description="El documento no explicita la facultad de rescindir el acuerdo sin penalidad si una de las partes es incluida en listas internacionales sancionatorias.",
        remediation="Pactar causal de terminación unilateral inmediata, sin derecho a indemnización, en caso de reporte en listas restrictivas o investigaciones por delitos financieros.",
        normative_reference="Lineamientos UIAF / Compliance Internacional",
        presence_patterns=[
            r"no\s+podr[aá]\s+terminarse\s+(el\s+contrato|la\s+relaci[oó]n)\s+por\s+inclusi[oó]n\s+en\s+listas"
        ]
    ),

    # --- 3. ANTICORRUPCIÓN, ÉTICA & ANTISOBORNO ---
    RegulatoryRule(
        rule_id="CORR_001",
        title="Omisión de Cláusula Anticorrupción y Cero Tolerancia al Soborno",
        category=RegulatoryCategory.ANTICORRUPCION_ETICA,
        severity=RiskSeverity.ALTO,
        weight=25.0,
        description="El contrato o política carece de estipulaciones expresas que prohíban sobornos, dádivas o pagos de facilitación a funcionarios o terceros.",
        remediation="Incluir cláusula anticorrupción alineada a la Ley Antisoborno / FCPA / ISO 37001 que prohíba estrictamente beneficios indebidos.",
        normative_reference="Foreign Corrupt Practices Act (FCPA) / Ley Antisoborno",
        is_mandatory_clause=True,
        mandatory_patterns=[
            r"anticorrupci[oó]n",
            r"antisoborno",
            r"soborno",
            r"pagos de facilitaci[oó]n",
            r"c[oó]digo de [eé]tica",
            r"corrupci[oó]n",
            r"fcpa"
        ]
    ),
    RegulatoryRule(
        rule_id="CORR_002",
        title="Riesgo de Pagos de Facilitación o Dádivas Irregulares",
        category=RegulatoryCategory.ANTICORRUPCION_ETICA,
        severity=RiskSeverity.ALTO,
        weight=30.0,
        description="Se identifican menciones que toleran o permiten pagos de facilitación, comisiones ocultas o dádivas desproporcionadas.",
        remediation="Establecer política de regalos con tope estricto y prohibición absoluta de entrega de cualquier valor a funcionarios públicos o tomadores de decisión.",
        normative_reference="Normas Internacionales Antisoborno (ISO 37001)",
        presence_patterns=[
            r"(autoriz|permit|admit|realiz|pact|efectu)\w*\s+(los\s+)?pagos?\s+de\s+facilitaci[oó]n",
            r"pagos?\s+de\s+facilitaci[oó]n\s+(permitidos?|autorizados?|admitidos?|sin\s+restricci[oó]n)",
            r"comisi[oó]n\s+oculta",
            r"(entregar|ofrecer|aceptar)\s+(obsequios?|d[aá]divas?|sobornos?)\s+para\s+(agilizar|influir|asegurar)",
            r"influencia\s+indebida\s+ante\s+funcionarios?"
        ]
    ),
    RegulatoryRule(
        rule_id="CORR_003",
        title="Restricción a Canales de Denuncia o Represalias contra Denunciantes",
        category=RegulatoryCategory.ANTICORRUPCION_ETICA,
        severity=RiskSeverity.MEDIO,
        weight=15.0,
        description="Se detectan estipulaciones que coartan el uso de la línea ética o imponen sanciones al denunciante de buena fe.",
        remediation="Garantizar la confidencialidad, no represalias y acceso a canales anónimos de denuncia ética conforme a las mejores prácticas de gobernanza.",
        normative_reference="Directiva de Protección a Denunciantes (Whistleblower Directive)",
        presence_patterns=[
            r"prohibido\s+(denunciar|notificar\s+a\s+autoridades)",
            r"represalias?\s+contra\s+denunciantes?",
            r"sanci[oó]n\s+por\s+utilizar\s+l[ií]neas?\s+[eé]ticas?"
        ]
    ),

    # --- 4. SEGURIDAD DE LA INFORMACIÓN & CIBERSEGURIDAD ---
    RegulatoryRule(
        rule_id="SEC_001",
        title="Omisión de Deber de Confidencialidad y Seguridad de la Información",
        category=RegulatoryCategory.SEGURIDAD_INFORMACION,
        severity=RiskSeverity.MEDIO,
        weight=20.0,
        description="El documento no cuenta con disposiciones claras de resguardo de información confidencial ni estándares de seguridad exigidos.",
        remediation="Añadir cláusula de confidencialidad robusta con obligación de custodia, no divulgación y adopción de medidas técnicas y organizativas de ciberseguridad.",
        normative_reference="Estándar ISO/IEC 27001 / Buenas prácticas NIST",
        is_mandatory_clause=True,
        mandatory_patterns=[
            r"confidencialidad",
            r"informaci[oó]n confidencial",
            r"seguridad de la informaci[oó]n",
            r"secreto comercial",
            r"no divulgaci[oó]n"
        ]
    ),
    RegulatoryRule(
        rule_id="SEC_002",
        title="Exoneración ante Brechas de Seguridad o Falta de Notificación de Incidentes",
        category=RegulatoryCategory.SEGURIDAD_INFORMACION,
        severity=RiskSeverity.ALTO,
        weight=25.0,
        description="El texto exime al custodio de notificar incidentes de seguridad de la información o desliga la responsabilidad por fugas o ciberataques previsibles.",
        remediation="Pactar la obligación de notificar cualquier brecha de seguridad en un plazo no mayor a 48-72 horas y mitigar inmediatamente los impactos.",
        normative_reference="RGPD Art. 33 / ISO 27001 Control A.16",
        presence_patterns=[
            r"no\s+estar[aá]\s+obligado\s+a\s+notificar\s+(brechas?|incidentes?|fugas?|ataques?)",
            r"exoneraci[oó]n\s+por\s+fuga\s+de\s+datos\s+sin\s+investigaci[oó]n",
            r"ninguna\s+responsabilidad\s+por\s+violaci[oó]n\s+de\s+seguridad"
        ]
    ),

    # --- 5. CUMPLIMIENTO CONTRACTUAL, LABORAL & LEGAL ---
    RegulatoryRule(
        rule_id="LEGAL_001",
        title="Cláusula Leonina o Exoneración Desproporcionada por Dolo o Culpa Grave",
        category=RegulatoryCategory.CUMPLIMIENTO_CONTRACTUAL,
        severity=RiskSeverity.ALTO,
        weight=30.0,
        description="Se identificó renuncia a reclamar o exoneración de responsabilidad ante dolo o culpa grave, lo cual suele ser nulo de pleno derecho y de alto riesgo.",
        remediation="Ajustar la cláusula de limitación de responsabilidad para excluir expresamente de cualquier tope indemnizatorio el dolo, la culpa grave y las violaciones a la ley.",
        normative_reference="Código Civil / Régimen General de Obligaciones",
        presence_patterns=[
            r"exoneraci[oó]n\s+por\s+(dolo|culpa\s+grave)",
            r"renuncia\s+a\s+toda\s+acci[oó]n\s+judicial\s+incluso\s+en\s+caso\s+de\s+(dolo|fraude)",
            r"ninguna\s+responsabilidad\s+a[uú]n\s+por\s+incumplimiento\s+grave"
        ]
    ),
    RegulatoryRule(
        rule_id="LEGAL_002",
        title="Desequilibrio Abusivo en Penalidades o Responsabilidad Ilimitada Unilateral",
        category=RegulatoryCategory.CUMPLIMIENTO_CONTRACTUAL,
        severity=RiskSeverity.MEDIO,
        weight=15.0,
        description="Se identifican estipulaciones con sanciones exorbitantes aplicables únicamente a una de las partes o penalidades desproporcionadas.",
        remediation="Garantizar reciprocidad en las penalidades contractuales e incorporar un límite cuantitativo razonable de responsabilidad (cap de responsabilidad).",
        normative_reference="Estatuto del Consumidor / Principios UNIDROIT",
        presence_patterns=[
            r"responsabilidad\s+ilimitada\s+exclusivamente\s+para",
            r"indemnizar[aá]\s+por\s+cualquier\s+causa\s+sin\s+l[ií]mite\s+alguno",
            r"penalidad\s+desproporcionada\s+sin\s+derecho\s+a\s+defensa"
        ]
    ),
    RegulatoryRule(
        rule_id="LEGAL_003",
        title="Riesgo de Solidaridad Laboral o Evasión de Cargas de Seguridad Social",
        category=RegulatoryCategory.CUMPLIMIENTO_CONTRACTUAL,
        severity=RiskSeverity.MEDIO,
        weight=15.0,
        description="Se detectan indicios de subordinación no reconocida o falta de exigencia de aportes al sistema de seguridad social integral.",
        remediation="Requerir acreditación mensual de pago de aportes al Sistema de Seguridad Social y parafiscales, estipulando indemnidad laboral.",
        normative_reference="Código Sustantivo del Trabajo / Régimen de Seguridad Social",
        presence_patterns=[
            r"sin\s+afiliaci[oó]n\s+a\s+seguridad\s+social",
            r"eludir\s+aportes\s+parafiscales",
            r"renuncia\s+a\s+derechos\s+laborales\s+irrenunciables"
        ]
    )
]

class RiskScoringEngine:
    def __init__(self, rules: Optional[list[RegulatoryRule]] = None):
        self.rules = rules or REGULATORY_RULES_CATALOG

    def get_rules_info(self) -> list[RiskRuleInfo]:
        """Retorna la lista de reglas configuradas para documentación y auditoría."""
        return [
            RiskRuleInfo(
                rule_id=r.rule_id,
                title=r.title,
                category=r.category,
                severity=r.severity,
                weight=r.weight,
                is_mandatory_clause=r.is_mandatory_clause,
                normative_reference=r.normative_reference,
                description=r.description,
                remediation=r.remediation
            )
            for r in self.rules
        ]

    def _extract_snippet(self, text: str, match_start: int, match_end: int, window: int = 60) -> str:
        """Extrae un extracto contextual legible con puntos suspensivos alrededor del hallazgo."""
        start = max(0, match_start - window)
        end = min(len(text), match_end + window)
        snippet = text[start:end].strip().replace("\n", " ")
        if start > 0:
            snippet = f"...{snippet}"
        if end < len(text):
            snippet = f"{snippet}..."
        return snippet

    def _is_negation_or_prohibition(self, chunk: str, match_start: int) -> bool:
        """Verifica si el hallazgo está precedido en la misma oración por un término de prohibición o cumplimiento."""
        lookback_start = max(0, match_start - 120)
        preceding = chunk[lookback_start:match_start]
        # Delimitar al inicio de la cláusula u oración
        last_boundary = max(preceding.rfind("."), preceding.rfind(";"), preceding.rfind("\n"))
        if last_boundary != -1:
            preceding = preceding[last_boundary + 1:]
        return bool(PROHIBITION_PATTERNS.search(preceding))

    def assess_risk(
        self,
        text_or_chunks: str | list[str],
        filter_categories: Optional[list[RegulatoryCategory]] = None
    ) -> RiskAssessmentResponse:
        """
        Ejecuta el análisis y scoring de riesgos normativos generando el semáforo y reporte ejecutivo.
        """
        if isinstance(text_or_chunks, str):
            full_text = text_or_chunks
            chunks = [text_or_chunks]
        elif isinstance(text_or_chunks, list):
            chunks = text_or_chunks if text_or_chunks else [""]
            full_text = "\n\n".join(chunks)
        else:
            full_text = ""
            chunks = [""]

        active_rules = self.rules
        if filter_categories:
            active_rules = [r for r in active_rules if r.category in filter_categories]

        findings: list[RiskFinding] = []

        # 1. Evaluación de reglas por presencia (en cada chunk para trazabilidad)
        for rule in active_rules:
            if rule.presence_patterns:
                matched_rule = False
                for c_idx, chunk in enumerate(chunks):
                    for pattern in rule.presence_patterns:
                        match = pattern.search(chunk)
                        if match:
                            # Comprobar que no sea una prohibición expresa / cláusula de cumplimiento
                            if self._is_negation_or_prohibition(chunk, match.start()):
                                continue

                            snippet = self._extract_snippet(chunk, match.start(), match.end())
                            findings.append(
                                RiskFinding(
                                    rule_id=rule.rule_id,
                                    title=rule.title,
                                    category=rule.category,
                                    severity=rule.severity,
                                    score_impact=rule.weight,
                                    description=rule.description,
                                    remediation=rule.remediation,
                                    normative_reference=rule.normative_reference,
                                    matched_snippet=snippet,
                                    chunk_index=c_idx
                                )
                            )
                            matched_rule = True
                            break # Una coincidencia de presencia por regla por chunk
                    if matched_rule:
                        break # Evitar duplicar la misma regla múltiples veces en el mismo documento

            # 2. Evaluación de reglas por omisión (en el texto completo del documento)
            if rule.is_mandatory_clause and rule.mandatory_patterns:
                # Comprobar si al menos un patrón obligatorio está presente en el documento completo
                found_clause = any(pattern.search(full_text) for pattern in rule.mandatory_patterns)
                if not found_clause:
                    findings.append(
                        RiskFinding(
                            rule_id=rule.rule_id,
                            title=rule.title,
                            category=rule.category,
                            severity=rule.severity,
                            score_impact=rule.weight,
                            description=rule.description,
                            remediation=rule.remediation,
                            normative_reference=rule.normative_reference,
                            matched_snippet=None,
                            chunk_index=None
                        )
                    )

        # 3. Conteo de hallazgos por severidad
        findings_summary = {
            RiskSeverity.ALTO.value: sum(1 for f in findings if f.severity == RiskSeverity.ALTO),
            RiskSeverity.MEDIO.value: sum(1 for f in findings if f.severity == RiskSeverity.MEDIO),
            RiskSeverity.BAJO.value: sum(1 for f in findings if f.severity == RiskSeverity.BAJO),
        }

        # 4. Cálculo del puntaje global y determinación del Semáforo
        # Semáforo:
        # ROJO: Si hay hallazgos de severidad ALTA o puntaje >= 70
        # AMARILLO: Si no hay ALTA pero hay hallazgos MEDIOS o puntaje entre 30 y 69
        # VERDE: Si no hay hallazgos o solo leves (BAJO) con puntaje < 30
        num_alto = findings_summary[RiskSeverity.ALTO.value]
        num_medio = findings_summary[RiskSeverity.MEDIO.value]
        num_bajo = findings_summary[RiskSeverity.BAJO.value]

        if num_alto > 0:
            traffic_light = TrafficLightColor.ROJO
            global_score = min(100.0, 70.0 + ((num_alto - 1) * 10.0) + (num_medio * 5.0) + (num_bajo * 2.0))
            risk_label = "Riesgo Alto - Requiere Intervención Legal Inmediata"
        elif num_medio > 0:
            traffic_light = TrafficLightColor.AMARILLO
            global_score = min(65.0, 35.0 + ((num_medio - 1) * 10.0) + (num_bajo * 5.0))
            risk_label = "Riesgo Medio - Observaciones Normativas Preventivas"
        elif num_bajo > 0:
            traffic_light = TrafficLightColor.VERDE
            global_score = min(25.0, 10.0 + ((num_bajo - 1) * 5.0))
            risk_label = "Riesgo Bajo - Observaciones Menores"
        else:
            traffic_light = TrafficLightColor.VERDE
            global_score = 0.0
            risk_label = "Riesgo Bajo - Cumplimiento Conforme"

        # 5. Desglose por categorías regulatorias
        categories_evaluated = filter_categories or [
            RegulatoryCategory.PROTECCION_DATOS,
            RegulatoryCategory.AML_CFT,
            RegulatoryCategory.ANTICORRUPCION_ETICA,
            RegulatoryCategory.SEGURIDAD_INFORMACION,
            RegulatoryCategory.CUMPLIMIENTO_CONTRACTUAL
        ]

        category_breakdown: list[CategoryScore] = []
        for cat in categories_evaluated:
            cat_findings = [f for f in findings if f.category == cat]
            cat_alto = sum(1 for f in cat_findings if f.severity == RiskSeverity.ALTO)
            cat_medio = sum(1 for f in cat_findings if f.severity == RiskSeverity.MEDIO)
            cat_bajo = sum(1 for f in cat_findings if f.severity == RiskSeverity.BAJO)

            if cat_alto > 0:
                cat_level = TrafficLightColor.ROJO
                cat_score = min(100.0, 70.0 + ((cat_alto - 1) * 15.0) + (cat_medio * 7.0))
            elif cat_medio > 0:
                cat_level = TrafficLightColor.AMARILLO
                cat_score = min(65.0, 35.0 + ((cat_medio - 1) * 15.0) + (cat_bajo * 5.0))
            elif cat_bajo > 0:
                cat_level = TrafficLightColor.VERDE
                cat_score = min(25.0, 15.0 + ((cat_bajo - 1) * 5.0))
            else:
                cat_level = TrafficLightColor.VERDE
                cat_score = 0.0

            category_breakdown.append(
                CategoryScore(
                    category=cat,
                    category_name=CATEGORY_NAMES.get(cat, cat.value),
                    score=round(cat_score, 2),
                    level=cat_level,
                    findings_count=len(cat_findings)
                )
            )

        # 6. Generación del resumen ejecutivo automático
        executive_summary = self._generate_executive_summary(
            traffic_light,
            global_score,
            findings_summary,
            findings,
            category_breakdown
        )

        return RiskAssessmentResponse(
            global_score=round(global_score, 2),
            traffic_light=traffic_light,
            risk_level_label=risk_label,
            executive_summary=executive_summary,
            findings_summary=findings_summary,
            category_breakdown=category_breakdown,
            findings=findings
        )

    def _generate_executive_summary(
        self,
        traffic_light: TrafficLightColor,
        score: float,
        summary: dict[str, int],
        findings: list[RiskFinding],
        categories: list[CategoryScore]
    ) -> str:
        total = len(findings)
        red_cats = [c.category_name for c in categories if c.level == TrafficLightColor.ROJO]
        yellow_cats = [c.category_name for c in categories if c.level == TrafficLightColor.AMARILLO]

        if traffic_light == TrafficLightColor.ROJO:
            text = (
                f"ALERTA CRÍTICA (Semáforo ROJO - Score {score:.1f}/100): Se detectaron {summary['ALTO']} "
                f"incumplimientos o contingencias normativas de severidad ALTA que exponen a la organización "
                f"a sanciones legales o regulatorias directas. "
            )
            if red_cats:
                text += f"Las dimensiones más críticas son: {', '.join(red_cats)}. "
            text += "Se requiere revisión prioritaria y adecuación de cláusulas antes de proceder con la firma o aprobación."
            return text

        elif traffic_light == TrafficLightColor.AMARILLO:
            text = (
                f"ATENCIÓN REQUERIDA (Semáforo AMARILLO - Score {score:.1f}/100): Se detectaron {summary['MEDIO']} "
                f"observaciones normativas de severidad media. "
            )
            if yellow_cats:
                text += f"Dimensiones que requieren refuerzo preventivo: {', '.join(yellow_cats)}. "
            text += "Se recomienda aplicar las recomendaciones de mitigación sugeridas para evitar contingencias futuras."
            return text

        else:
            if total == 0:
                return (
                    f"CONFORME (Semáforo VERDE - Score {score:.1f}/100): El documento cumple satisfactoriamente "
                    "con los estándares normativos analizados. Contiene las cláusulas regulatorias esenciales y "
                    "no presenta indicios de incumplimiento."
                )
            else:
                return (
                    f"CUMPLIMIENTO ADECUADO (Semáforo VERDE - Score {score:.1f}/100): Documento con bajo perfil "
                    f"de riesgo normativo. Se detectaron únicamente {total} observaciones menores no críticas."
                )

# Instancia singleton del motor de scoring
risk_engine = RiskScoringEngine()
