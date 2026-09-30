# services/llm_audit_service.py
import os
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://132.145.198.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

class LLMAuditService:
    """
    Servicio de integración con el motor de IA local/VPS (Ollama / Llama 3.1).
    Realiza análisis semántico de contratos, detección de cláusulas abusivas y evaluación de SLAs.
    """
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

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
        # Truncar para optimizar el tiempo de atención y procesamiento en CPU
        sample_text = contract_text[:max_chars]

        system_prompt = (
            "Eres Audiflow, un auditor legal de élite especializado en contratos de software y acuerdos financieros. "
            "Analiza el contrato y evalúa los riesgos legales y financieros. "
            "Debes responder OBLIGATORIAMENTE en formato JSON válido con esta estructura exacta:\n"
            "{\n"
            '  "score_riesgo_ia": <numero entero 0-100>,\n'
            '  "nivel_riesgo_ia": "<ALTO | MEDIO | BAJO>",\n'
            '  "resumen_ejecutivo": "<síntesis concisa de 2 o 3 oraciones del riesgo global>",\n'
            '  "clausulas_criticas": [\n'
            '    {\n'
            '      "tipo": "<SLA | Penalidad | Renovacion | Responsabilidad | Privacidad | Jurisdiccion>",\n'
            '      "severidad": "<ALTO | MEDIO | BAJO>",\n'
            '      "cita_textual": "<fragmento breve del contrato>",\n'
            '      "explicacion_riesgo": "<por qué es riesgoso>",\n'
            '      "recomendacion_negociacion": "<qué pedir al proveedor>"\n'
            '    }\n'
            '  ]\n'
            "}"
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
                "num_predict": 180,  # Dictamen y cláusulas críticas concisas
                "num_thread": 3      # 3 hilos: 3x más rápido en Ampere A1 (evita contención de cache)
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
                    return {
                        "exito": True,
                        "motor": f"Ollama ({self.model})",
                        "resultado_ia": json.loads(content)
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