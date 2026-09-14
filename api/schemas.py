# schemas.py
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class TrafficLightColor(str, Enum):
    ROJO = "ROJO"
    AMARILLO = "AMARILLO"
    VERDE = "VERDE"

class RiskSeverity(str, Enum):
    ALTO = "ALTO"
    MEDIO = "MEDIO"
    BAJO = "BAJO"

class RegulatoryCategory(str, Enum):
    PROTECCION_DATOS = "PROTECCION_DATOS"
    AML_CFT = "AML_CFT"
    ANTICORRUPCION_ETICA = "ANTICORRUPCION_ETICA"
    SEGURIDAD_INFORMACION = "SEGURIDAD_INFORMACION"
    CUMPLIMIENTO_CONTRACTUAL = "CUMPLIMIENTO_CONTRACTUAL"
    GENERAL = "GENERAL"

class RiskFinding(BaseModel):
    rule_id: str = Field(..., description="Identificador único de la regla normativa")
    title: str = Field(..., description="Título del hallazgo de riesgo")
    category: RegulatoryCategory = Field(..., description="Categoría o dimensión regulatoria")
    severity: RiskSeverity = Field(..., description="Nivel de severidad del riesgo")
    score_impact: float = Field(..., description="Puntos de impacto en el score de riesgo")
    description: str = Field(..., description="Detalle o descripción de la contingencia detectada")
    remediation: str = Field(..., description="Recomendación preventiva o de mitigación para cumplimiento")
    normative_reference: str = Field(..., description="Referencia a marco legal, estándar o política aplicable")
    matched_snippet: Optional[str] = Field(None, description="Fragmento de texto relevante donde se detectó el riesgo")
    chunk_index: Optional[int] = Field(None, description="Índice del segmento/chunk asociado")

class CategoryScore(BaseModel):
    category: RegulatoryCategory = Field(..., description="Categoría regulatoria")
    category_name: str = Field(..., description="Nombre amigable de la categoría")
    score: float = Field(..., description="Puntaje de riesgo de la categoría (0-100)")
    level: TrafficLightColor = Field(..., description="Semáforo de la categoría (ROJO, AMARILLO, VERDE)")
    findings_count: int = Field(..., description="Total de hallazgos en esta categoría")

class RiskAssessmentResponse(BaseModel):
    global_score: float = Field(..., ge=0.0, le=100.0, description="Puntaje de riesgo consolidado (0.0 a 100.0)")
    traffic_light: TrafficLightColor = Field(..., description="Color del semáforo general: ROJO, AMARILLO o VERDE")
    risk_level_label: str = Field(..., description="Etiqueta descriptiva del nivel de riesgo")
    executive_summary: str = Field(..., description="Resumen ejecutivo del estado de cumplimiento y riesgos")
    findings_summary: dict[str, int] = Field(..., description="Conteo de hallazgos por nivel de severidad (ALTO, MEDIO, BAJO)")
    category_breakdown: list[CategoryScore] = Field(..., description="Desglose de riesgos por categoría regulatoria")
    findings: list[RiskFinding] = Field(..., description="Lista detallada de hallazgos normativos detectados")

class RiskRuleInfo(BaseModel):
    rule_id: str
    title: str
    category: RegulatoryCategory
    severity: RiskSeverity
    weight: float
    is_mandatory_clause: bool
    normative_reference: str
    description: str
    remediation: str

class EvaluateRiskRequest(BaseModel):
    text: Optional[str] = Field(None, description="Texto completo a evaluar")
    chunks: Optional[list[str]] = Field(None, description="Lista opcional de segmentos/chunks a evaluar")
    categories: Optional[list[RegulatoryCategory]] = Field(None, description="Filtrar evaluación por categorías regulatorias específicas")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "El presente contrato no incluye cláusula de protección de datos ni verificación de lavado de activos.",
                "categories": ["PROTECCION_DATOS", "AML_CFT"]
            }
        }

class ProcessingRequest(BaseModel):
    chunk_size: int = Field(default=500, ge=100, le=2000, description="Tamaño del segmento en tokens")
    chunk_overlap: int = Field(default=50, ge=0, le=500, description="Superposición entre segmentos")

class ProcessingResponse(BaseModel):
    filename: str
    total_characters: int
    total_chunks: int
    chunks: list[str]
    risk_assessment: Optional[RiskAssessmentResponse] = Field(None, description="Evaluación y semáforo de riesgo normativo")

    class Config:
        json_schema_extra = {
            "example": {
                "filename": "documento.pdf",
                "total_characters": 1500,
                "total_chunks": 3,
                "chunks": ["Texto del fragmento 1...", "Texto del fragmento 2..."],
                "risk_assessment": {
                    "global_score": 15.0,
                    "traffic_light": "VERDE",
                    "risk_level_label": "Riesgo Bajo - Cumplimiento Adecuado",
                    "executive_summary": "El documento cumple satisfactoriamente con los requisitos normativos evaluados.",
                    "findings_summary": {"ALTO": 0, "MEDIO": 1, "BAJO": 0},
                    "category_breakdown": [],
                    "findings": []
                }
            }
        }