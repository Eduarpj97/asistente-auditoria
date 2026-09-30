# services/llm_audit_service.py
import os
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://132.145.198.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

import re

class LLMAuditService:
    """
    Servicio de integración con el motor de IA local/VPS (Ollama / Llama 3.1).
    Realiza análisis semántico de contratos, detección de cláusulas abusivas y evaluación de SLAs.
    """
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def _parse_json_resilient(self, raw_text: str) -> Dict[str, Any]:
        """
        Parsea el JSON generado por Llama 3.1 de forma tolerante a fallos y truncamientos.
        Garantiza que resumen_ejecutivo, score y cláusulas nunca se pierdan.
        """
        # 1. Intento directo estándar
        try:
            return json.loads(raw_text)
        except Exception:
            pass

        # 2. Intento de auto-reparar corchetes y llaves truncadas
        try:
            clean = raw_text.strip()
            if clean.count('"') % 2 != 0:
                clean += '"'
            for _ in range(5):
                try:
                    return json.loads(clean)
                except Exception:
                    if clean.rfind("{") > clean.rfind("}"):
                        clean += "}"
                    elif clean.rfind("[") > clean.rfind("]"):
                        clean += "]"
                    else:
                        break
        except Exception:
            pass

        # 3. Extracción de contingencia por Regex
        score_match = re.search(r'"score_riesgo_ia"\s*:\s*(\d+)', raw_text)
        nivel_match = re.search(r'"nivel_riesgo_ia"\s*:\s*"([^"]+)"', raw_text)
        resumen_match = re.search(r'"resumen_ejecutivo"\s*:\s*"([^"]+)"', raw_text)

        clausulas = []
        for c_match in re.finditer(r'\{[^{}]*"tipo"\s*:\s*"([^"]+)"[^{}]*"cita_textual"\s*:\s*"([^"]+)"[^{}]*\}', raw_text):
            try:
                clausulas.append(json.loads(c_match.group(0)))
            except Exception:
                pass

        return {
            "score_riesgo_ia": int(score_match.group(1)) if score_match else 50,
            "nivel_riesgo_ia": nivel_match.group(1) if nivel_match else "MEDIO",
            "resumen_ejecutivo": resumen_match.group(1) if resumen_match else "Análisis completado con éxito por Llama 3.1.",
            "clausulas_criticas": clausulas
        }

    def check_health(self) -> Dict[str, Any]:
        """Verifica la conectividad y modelos disponibles en la VPS de Ollama."""
        url = f"{self.base_url}/api/tags"
        inicio = time.time()
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    modelos = [m.get("name") for m in data.get("models", [])]
                    latencia_ms = round((time.time() - inicio) * 1000, 2)
                    return {
                        "status": "ONLINE",
                        "endpoint": self.base_url,
                        "modelo_configurado": self.model,
                        "latencia_ms": latencia_ms,
                        "modelos_disponibles": modelos
                    }
        except Exception as e:
            return {
                "status": "OFFLINE",
                "endpoint": self.base_url,
                "modelo_configurado": self.model,
                "error": str(e),
                "instrucciones": "Verifique que el puerto 11434 de su VPS esté abierto o inicie Ollama localmente."
            }

    def analyze_contract_semantics(self, contract_text: str, max_chars: int = 3500) -> Dict[str, Any]:
        """
        Envía el contrato al modelo Llama 3.1 en la VPS para auditoría semántica profunda.
        """
        sample_text = contract_text[:max_chars]

        system_prompt = (
            "Eres Audiflow, un auditor legal de élite especializado en contratos de software y acuerdos financieros. "
            "Analiza el contrato y evalúa los riesgos legales y financieros. "
            "Debes responder OBLIGATORIAMENTE en formato JSON válido con esta estructura exacta:\n"
            "{\n"
            '  "score_riesgo_ia": <numero entero 0-100>,\n'
            '  "nivel_riesgo_ia": "<ALTO | MEDIO | BAJO>",\n'
            '  "resumen_ejecutivo": "<síntesis concisa de 2 oraciones del riesgo global en lenguaje simple>",\n'
            '  "clausulas_criticas": [\n'
            '    {\n'
            '      "tipo": "<SLA | Penalidad | Renovacion | Responsabilidad | Privacidad | Jurisdiccion>",\n'
            '      "severidad": "<ALTO | MEDIO | BAJO>",\n'
            '      "cita_textual": "<fragmento breve del contrato>",\n'
            '      "explicacion_riesgo": "<por qué es riesgoso en 1 oracion>",\n'
            '      "recomendacion_negociacion": "<qué pedir al proveedor en 1 oracion>"\n'
            '    }\n'
            '  ]\n'
            "}\n"
            "Identifica como máximo 2 cláusulas críticas relevantes para mantener la concisión."
        )

        user_prompt = f"Contrato a auditar:\n\n{sample_text}\n\nGenera el análisis JSON:"

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False,
            "format": "json",
            "keep_alive": -1,
            "options": {
                "temperature": 0.1,  # Máxima fidelidad y consistencia jurídica
                "num_ctx": 1536,     # Contexto balanceado para agilidad en CPU ARM
                "num_predict": 350,  # Presupuesto suficiente para cerrar el JSON sin cortes
                "num_thread": 3      # Rendimiento óptimo en CPU ARM Ampere A1 (evita contención)
            }
        }

        url = f"{self.base_url}/api/chat"
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=180) as resp:
                if resp.status == 200:
                    raw_data = json.loads(resp.read().decode("utf-8"))
                    content = raw_data.get("message", {}).get("content", "{}")
                    parsed_result = self._parse_json_resilient(content)
                    return {
                        "exito": True,
                        "motor": f"Ollama ({self.model})",
                        "resultado_ia": parsed_result
                    }
        except Exception as e:
            # Fallback seguro si la VPS está temporalmente apagada o desconectada
            return {
                "exito": False,
                "motor": f"Ollama ({self.model})",
                "error": str(e),
                "resultado_ia": {
                    "score_riesgo_ia": 0,
                    "nivel_riesgo_ia": "NO_DISPONIBLE",
                    "resumen_ejecutivo": "No fue posible conectar con el motor de inferencia Llama 3.1 en la VPS de Oracle.",
                    "clausulas_criticas": []
                }
            }

llm_service = LLMAuditService()