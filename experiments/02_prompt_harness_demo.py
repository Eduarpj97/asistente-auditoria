"""
Audiflow - Laboratorio Experimental 02: Prompting con Test Harness y Validacion Pydantic
Objetivo: Probar la evaluacion automatizada de prompts frente a esquemas estructurados de riesgo.
"""

import sys
import os
import json
import time
from typing import List, Literal
from pydantic import BaseModel, Field, ValidationError

# Asegurar codificacion UTF-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ==========================================
# 1. ESQUEMA DE DATOS ESTRICTO (PYDANTIC)
# ==========================================

class HallazgoAuditoria(BaseModel):
    clausula: str = Field(description="Nombre de la clausula")
    tipo_riesgo: Literal["SLA", "Penalidad", "Renovacion", "Responsabilidad", "Privacidad"]
    severidad: Literal["ALTA", "MEDIA", "BAJA"]
    cita_textual: str = Field(description="Cita textual del contrato")
    resumen_simple: str = Field(description="Explicacion para no abogados")

class DictamenContrato(BaseModel):
    id_contrato: str
    score_riesgo_global: int = Field(ge=0, le=100)
    semaforo: Literal["ROJO", "AMARILLO", "VERDE"]
    total_hallazgos: int
    hallazgos: List[HallazgoAuditoria]

# ==========================================
# 2. SIMULACION DE PROMPTS EN COMPETENCIA
# ==========================================

def ejecutar_prompt_generico() -> str:
    """Simula un prompt generico sin restricciones rigurosas."""
    return '''
    Aqui tienes el analisis del contrato:
    - Encontre que la responsabilidad es de solo 1 mes (muy riesgoso).
    - La renovacion es automatica a 60 dias.
    - El SLA es 99.5%.
    '''

def ejecutar_prompt_audiflow_estructurado() -> str:
    """Simula el prompt especializado de Audiflow con salida JSON estricta."""
    datos = {
        "id_contrato": "CTR-SaaS-2026-001",
        "score_riesgo_global": 78,
        "semaforo": "ROJO",
        "total_hallazgos": 3,
        "hallazgos": [
            {
                "clausula": "CLAUSULA SEXTA - LIMITACION DE RESPONSABILIDAD",
                "tipo_riesgo": "Responsabilidad",
                "severidad": "ALTA",
                "cita_textual": "estara estrictamente limitada al monto efectivamente pagado por el CLIENTE en el mes calendario inmediatamente anterior al siniestro.",
                "resumen_simple": "Si el proveedor borra tus datos o el sistema falla, solo te indemnizara con 1 mes de servicio. Riesgo financiero critico."
            },
            {
                "clausula": "CLAUSULA CUARTA - VIGENCIA Y RENOVACION AUTOMATICA",
                "tipo_riesgo": "Renovacion",
                "severidad": "MEDIA",
                "cita_textual": "se renovara tacita y automaticamente... con una antelacion minima de sesenta (60) dias naturales",
                "resumen_simple": "Debes cancelar con 2 meses de anticipacion o quedaras obligado a pagar otro ano completo."
            },
            {
                "clausula": "CLAUSULA SEGUNDA Y TERCERA - SLA Y PENALIDADES",
                "tipo_riesgo": "SLA",
                "severidad": "BAJA",
                "cita_textual": "garantiza una disponibilidad mensual del servicio ('Uptime') del noventa y nueve punto cinco por ciento (99.5%)",
                "resumen_simple": "Disponibilidad del 99.5% aceptable con tabla de creditos del 10% y 25%."
            }
        ]
    }
    return json.dumps(datos)

# ==========================================
# 3. ARNÉS DE EVALUACIÓN (TEST HARNESS)
# ==========================================

def evaluar_con_harness(nombre_prompt: str, generador_salida):
    print(f"\nProbando: {nombre_prompt}")
    inicio = time.time()
    salida_cruda = generador_salida()
    duracion = (time.time() - inicio) * 1000
    
    valido = False
    dictamen = None
    error_msg = ""
    
    try:
        data_json = json.loads(salida_cruda)
        dictamen = DictamenContrato(**data_json)
        valido = True
    except (json.JSONDecodeError, ValidationError) as e:
        error_msg = str(e).split('\n')[0]
        valido = False
        
    return {
        "nombre": nombre_prompt,
        "tiempo_ms": round(duracion, 2),
        "cumple_schema_pydantic": valido,
        "objeto_validado": dictamen,
        "error": error_msg
    }

def main():
    print("=" * 75)
    print("   AUDIFLOW - TEST HARNESS DE EVALUACION DE PROMPTS Y PYDANTIC")
    print("=" * 75)
    
    resultados = [
        evaluar_con_harness("Prompt A (Generico / Texto Libre)", ejecutar_prompt_generico),
        evaluar_con_harness("Prompt B (Especializado Audiflow / JSON Schema)", ejecutar_prompt_audiflow_estructurado)
    ]
    
    print("\n" + "=" * 75)
    print("   MATRIZ COMPARATIVA DE RENDIMIENTO DEL HARNESS")
    print("=" * 75)
    print(f"{'Estrategia':<40} | {'Schema OK?':<12} | {'Semaforo':<10} | {'Score Riesgo'}")
    print("-" * 75)
    
    for r in resultados:
        status_schema = "[SI] Valido" if r["cumple_schema_pydantic"] else "[NO] Invalido"
        if r["objeto_validado"]:
            sem = r["objeto_validado"].semaforo
            score = f"{r['objeto_validado'].score_riesgo_global}/100"
        else:
            sem = "N/A"
            score = "Fallo parseo"
            
        print(f"{r['nombre']:<40} | {status_schema:<12} | {sem:<10} | {score}")
        
    print("-" * 75)
    print("\n[CONCLUSION DEL HARNESS]:")
    print("El Prompt Especializado B cumple el 100% de los requisitos tecnicos de FastAPI")
    print("y entrega datos listos para renderizar el semaforo de riesgo en el Frontend.")

if __name__ == "__main__":
    main()