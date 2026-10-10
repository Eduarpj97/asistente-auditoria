# services/llm_audit_service.py
import os
import json
import time
import subprocess
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
import re

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://132.145.198.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
SSH_KEY_PATH = os.getenv("OLLAMA_SSH_KEY", r"C:\Users\Eduardo\Desktop\Ollama 3.1.key")
VPS_HOST = os.getenv("OLLAMA_VPS_HOST", "132.145.198.1")
VPS_USER = os.getenv("OLLAMA_VPS_USER", "ubuntu")
NORMATIVAS_URL = os.getenv("NORMATIVAS_URL", "https://audiflow-audit.abbynex.site/normativas/normativa_auditoria_vigente_2026.md")

class LLMAuditService:
    """
    Servicio de integración con el motor de IA local/VPS (Ollama / Llama 3.1).
    Realiza análisis semántico de contratos, detección de cláusulas abusivas y evaluación de SLAs.
    Incorpora auto-túnel SSH transparente y tolerante a fallos para operar en cualquier red Wi-Fi.
    """
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._active_url = None

    def _is_reachable(self, url: str, timeout: float = 1.0) -> bool:
        """Comprueba de forma rápida si un endpoint de Ollama responde."""
        try:
            req = urllib.request.Request(f"{url.rstrip('/')}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status == 200
        except Exception:
            return False

    def _ensure_endpoint(self) -> str:
        """
        Garantiza un canal de comunicación activo con Ollama.
        1. Prueba el túnel local en 127.0.0.1:11434.
        2. Si no responde, prueba el acceso directo configurado (VPS).
        3. Si la red Wi-Fi bloquea el puerto 11434, auto-inicia el túnel SSH cifrado
           vía puerto 22 hacia la VPS para evitar bloqueos de red o firewalls.
        """
        # Si ya teníamos un endpoint activo verificado recientemente
        if self._active_url and self._is_reachable(self._active_url, timeout=0.8):
            return self._active_url

        # 1. Probar túnel local
        if self._is_reachable("http://127.0.0.1:11434", timeout=0.8):
            self._active_url = "http://127.0.0.1:11434"
            return self._active_url

        # 2. Probar conexión directa
        if self._is_reachable(self.base_url, timeout=1.0):
            self._active_url = self.base_url
            return self._active_url

        # 3. Iniciar túnel SSH seguro si existe la clave en el equipo
        if os.path.exists(SSH_KEY_PATH):
            try:
                cmd = [
                    "ssh.exe",
                    "-i", SSH_KEY_PATH,
                    "-o", "StrictHostKeyChecking=no",
                    "-o", "ServerAliveInterval=30",
                    "-o", "ServerAliveCountMax=3",
                    "-o", "ExitOnForwardFailure=yes",
                    "-N",
                    "-L", "11434:127.0.0.1:11434",
                    f"{VPS_USER}@{VPS_HOST}"
                ]
                flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
                subprocess.Popen(cmd, creationflags=flags)
                # Esperar a que el túnel enlace
                for _ in range(8):
                    time.sleep(0.5)
                    if self._is_reachable("http://127.0.0.1:11434", timeout=0.5):
                        self._active_url = "http://127.0.0.1:11434"
                        return self._active_url
            except Exception as ex:
                print(f"[LLMAuditService] Error iniciando auto-túnel SSH: {ex}")

        # Retornar base_url por defecto como fallback
        return self.base_url

    def _sanitize_text(self, text: str, max_chars: int = 3500) -> str:
        """
        Sanitiza el texto extraído del contrato para evitar que secuencias de escape
        inválidas o caracteres no imprimibles corrompan el decodificador JSON de Ollama.
        """
        if not text:
            return ""
        # Filtrar caracteres de control no imprimibles excepto saltos de línea y tabuladores
        clean = "".join(ch for ch in text if ch.isprintable() or ch in "\n\r\t")
        # Sustituir barras invertidas por barras diagonales para prevenir escapes rotos
        clean = clean.replace("\\", "/")
        return clean[:max_chars].strip()

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
        for c_match in re.finditer(r'\{[^{}]*"tipo"\s*:\s*"([^"]+)"[^{}]*\}', raw_text):
            try:
                clausulas.append(json.loads(c_match.group(0)))
            except Exception:
                pass

        default_summary = (
            "Este documento es un acuerdo entre dos o más partes donde se definen las condiciones para prestar un servicio, entregar un producto o cumplir compromisos comerciales. Incluye las obligaciones de cada quien, las formas de pago, los plazos y las consecuencias si alguna de las partes no cumple."
        )

        return {
            "score_riesgo_ia": int(score_match.group(1)) if score_match else 50,
            "nivel_riesgo_ia": nivel_match.group(1) if nivel_match else "MEDIO",
            "resumen_ejecutivo": resumen_match.group(1) if resumen_match else default_summary,
            "clausulas_criticas": clausulas
        }

    def check_health(self) -> Dict[str, Any]:
        """Verifica la conectividad y modelos disponibles en la VPS de Ollama."""
        endpoint = self._ensure_endpoint()
        url = f"{endpoint}/api/tags"
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
                        "endpoint": endpoint,
                        "modelo_configurado": self.model,
                        "latencia_ms": latencia_ms,
                        "modelos_disponibles": modelos
                    }
        except Exception as e:
            return {
                "status": "OFFLINE",
                "endpoint": endpoint,
                "modelo_configurado": self.model,
                "error": str(e),
                "instrucciones": "Verifique la conectividad con la VPS o inicie Ollama localmente."
            }

    def get_normativa_2026_summary(self) -> str:
        """
        Retorna las directrices esenciales del compendio regulatorio 2026
        para inyectar en el contexto del modelo.
        """
        return (
            "DIRECTRICES NORMATIVAS Y ESTATUTOS VIGENTES (ACTUALIZADO A 2026):\n"
            "- AML/SARLAFT (2026): Identificación obligatoria de Beneficiarios Finales (UBO al 5%) y causal de rescisión unilateral inmediata por reporte en listas restrictivas (ONU/OFAC).\n"
            "- PROTECCIÓN DE DATOS & IA (2026): Prohibición expresa de usar datos contractuales para reentrenar modelos de IA sin autorización previa. Notificación obligatoria de incidentes o brechas de seguridad en <72 horas.\n"
            "- ANTICORRUPCIÓN (ISO 37001 / FCPA): Cero tolerancia a sobornos, dádivas o pagos de facilitación, y canales anónimos de denuncia protegidos.\n"
            "- SEGURIDAD (ISO 27001:2022 / NIS2): Cifrado obligatorio en tránsito/reposo y derecho de auditoría técnica y forense.\n"
            "- EQUILIBRIO CONTRACTUAL: Nulidad absoluta de cláusulas que exoneren de responsabilidad por dolo o culpa grave. SLAs con compensación económica obligatoria.\n"
        )

    def analyze_contract_semantics(self, contract_text: str, max_chars: int = 2500) -> Dict[str, Any]:
        """
        Envía el contrato al modelo Llama 3.1 para auditoría semántica profunda aplicando las normativas 2026.
        """
        sample_text = self._sanitize_text(contract_text, max_chars)
        normativas_ref = self.get_normativa_2026_summary()

        system_prompt = (
            "Eres Audiflow, un auditor legal de contratos e instrumentos jurídicos.\n"
            "INSTRUCCIONES CLAVE:\n"
            "1. En 'resumen_ejecutivo', explica en 2 o 3 oraciones en LENGUAJE SIMPLE Y COTIDIANO de qué se trata exactamente el documento analizado según su contenido real (ej. si es una matrícula de universidad, acuerdo de servicios, compraventa, etc., indicando las partes y el objeto). NO uses plantillas genéricas fijas ni numerales.\n"
            "2. En 'clausulas_criticas', identifica 1 o 2 estipulaciones que contengan riesgos o asimetrías según las normativas vigentes (RGPD, AML, anticorrupción, penalidades desproporcionadas). Si el documento es un acuerdo simple o constancia sin cláusulas de riesgo, indica un score bajo (ej. 5 o 10) y deja 'clausulas_criticas' vacío.\n"
            "Para cada cláusula crítica detectada indica:\n"
            "   - 'tipo': Categoría jurídica.\n"
            "   - 'severidad': ALTO | MEDIO | BAJO.\n"
            "   - 'ubicacion_exacta': Dónde se ubica en el documento.\n"
            "   - 'cita_textual': Fragmento literal del documento original.\n"
            "   - 'explicacion_riesgo': Por qué representa riesgo.\n"
            "   - 'fundamento_normativo': Norma aplicable.\n"
            "   - 'recomendacion_legal': Qué hacer para corregirlo.\n"
            "   - 'redaccion_sugerida': Propuesta para adenda.\n\n"
            "Debes responder OBLIGATORIAMENTE en formato JSON válido con esta estructura:\n"
            "{\n"
            '  "score_riesgo_ia": <numero entero 0-100>,\n'
            '  "nivel_riesgo_ia": "<ALTO | MEDIO | BAJO>",\n'
            '  "resumen_ejecutivo": "<resumen específico en lenguaje simple de qué trata este documento>",\n'
            '  "clausulas_criticas": []\n'
            "}"
        )

        user_prompt = f"Documento a auditar:\n\n{sample_text}\n\nGenera el JSON:"

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
                "temperature": 0.1,  # Fidelidad máxima
                "num_ctx": 1536,     # Tamaño óptimo para procesar en CPU ARM
                "num_predict": 350,  # Presupuesto conciso para respuesta rápida sin timeout (<45s)
                "num_thread": 4      # Utilizar los 4 núcleos completos de la CPU ARM Ampere A1
            }
        }

        endpoint = self._ensure_endpoint()
        url = f"{endpoint}/api/chat"
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                headers={"Content-Type": "application/json; charset=utf-8"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                if resp.status == 200:
                    raw_data = json.loads(resp.read().decode("utf-8"))
                    content = raw_data.get("message", {}).get("content", "{}")
                    parsed_result = self._parse_json_resilient(content)
                    return {
                        "exito": True,
                        "motor": f"Ollama ({self.model})",
                        "endpoint": endpoint,
                        "resultado_ia": parsed_result
                    }
        except urllib.error.HTTPError as he:
            err_body = ""
            try:
                err_body = he.read().decode("utf-8", errors="ignore")
            except Exception:
                pass
            print(f"[LLMAuditService] HTTPError en Ollama ({he.code}): {he.reason} - {err_body}")
        except Exception as e:
            print(f"[LLMAuditService] Excepción de conexión con Ollama: {e}")

        # Fallback cuando Ollama está offline: resumen genérico en lenguaje simple
        fallback_summary = (
            "Este documento es un acuerdo legal entre dos o más partes que define las condiciones del servicio o negocio pactado, incluyendo obligaciones, pagos, plazos y responsabilidades de cada parte involucrada."
        )

        return {
            "exito": False,
            "motor": f"Ollama ({self.model})",
            "endpoint": endpoint,
            "resultado_ia": {
                "score_riesgo_ia": 0,
                "nivel_riesgo_ia": "MODERADO",
                "resumen_ejecutivo": fallback_summary,
                "clausulas_criticas": []
            }
        }

llm_service = LLMAuditService()