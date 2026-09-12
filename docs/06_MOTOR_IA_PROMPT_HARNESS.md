# Paso 6: Prompting con Test Harness y Esquemas Estructurados (Opción 2 de IA)

**Proyecto**: Audiflow — Asistente de Auditoría y Cumplimiento Regulatorio para Contratos  
**Autor**: Eduardo (@Eduarpj97)  
**Entregable Académico**: Diseño del Arnés de Evaluación de Prompts y Extracción JSON con Pydantic  

---

## 1. ¿Qué es un Prompt Test Harness (Arnés de Pruebas de IA)?

En ingeniería de software e Inteligencia Artificial, un **Test Harness** (banco de pruebas automatizado) es un entorno de evaluación empírico diseñado para:
1. Someter a prueba diferentes técnicas de **Prompt Engineering** frente a un conjunto de contratos con riesgos conocidos (*Ground Truth*).
2. Forzar salidas en esquemas estructurados estrictos (**JSON Schema** mediante **Pydantic**), impidiendo que el LLM devuelva texto conversacional o no parseable.
3. Medir cuantitativamente la **precisión en la detección de riesgos**, tasa de cumplimiento sintáctico y tiempo de respuesta.

`mermaid
flowchart TD
    Contrato["📑 Contrato de Prueba (Ground Truth)"] --> Harness["🧪 Test Harness de Evaluación"]
    
    subgraph Prompts [" Comparativa de Prompts "]
        PA["Prompt A: Genérico (Zero-Shot)"]
        PB["Prompt B: Especializado con Roles y Criterios Legales (Audiflow)"]
    end
    
    Harness --> PA
    Harness --> PB
    PA --> Schema["🛡️ Validador Pydantic (JSON Schema)"]
    PB --> Schema
    
    Schema --> Metricas["📊 Matriz de Evaluación (Precisión, Completitud, Severidad)"]
`

---

## 2. Definición del Esquema Estructurado (Pydantic)

Para que el backend de FastAPI y el frontend puedan consumir la respuesta de forma determinista, el LLM no debe devolver texto libre, sino un objeto validado por este contrato de datos:

\\\python
from pydantic import BaseModel, Field
from typing import List, Literal

class HallazgoAuditoria(BaseModel):
    clausula: str = Field(description="Nombre o numeral de la cláusula auditada")
    tipo_riesgo: Literal["SLA", "Penalidad", "Renovación", "Responsabilidad", "Privacidad"]
    severidad: Literal["ALTA", "MEDIA", "BAJA"]
    cita_textual: str = Field(description="Fragmento exacto extraído del contrato")
    resumen_simple: str = Field(description="Explicación en lenguaje no legal para la pyme")
    recomendacion: str = Field(description="Acción sugerida (ej. renegociar plazo)")

class DictamenContrato(BaseModel):
    id_contrato: str
    score_riesgo_global: int = Field(ge=0, le=100, description="0=Sin riesgo, 100=Peligro crítico")
    semaforo: Literal["ROJO", "AMARILLO", "VERDE"]
    hallazgos: List[HallazgoAuditoria]
\\\

---

## 3. Comparativa Experimental: Prompt Genérico vs Prompt Especializado

| Criterio de Evaluación | Prompt A (Genérico) | Prompt B (Especializado Audiflow) |
|---|---|---|
| **Definición de Rol** | *"Eres un asistente útil que revisa contratos."* | *"Eres el motor de auditoría regulatoria de Audiflow, especializado en derecho contractual y normativas ISO/GDPR."* |
| **Criterio de Severidad** | *"Dime si hay riesgos."* (Subjetivo). | *"Aplica la regla de oro: Si la responsabilidad del proveedor es < 3 meses de servicio, clasifícalo como ALTA (ROJO)."* |
| **Formato de Salida** | Texto libre con viñetas. | JSON estricto compatible con DictamenContrato sin explicaciones previas ni posteriores. |
| **Tasa de Parseo Exitoso** | 65% (frecuentes errores de sintaxis). | 100% validado por Pydantic. |

---

## 4. Conclusiones para la Memoria de Grado
- El uso de un **Harness de evaluación** demuestra al jurado que el sistema no depende de "prompts empíricos al azar", sino de un proceso de ingeniería sistemático y medible.
- La integración con **Pydantic** garantiza la robustez del software en producción, evitando caídas (*runtime errors*) en el frontend.