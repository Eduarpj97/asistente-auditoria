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

    def analyze_contract_semantics(self, contract_text: str, max_chars: int = 3500) -> Dict[str, Any]:
        """
        Envía el contrato al modelo Llama 3.1 para auditoría semántica profunda aplicando las normativas 2026.
        """
        sample_text = self._sanitize_text(contract_text, max_chars)
        normativas_ref = self.get_normativa_2026_summary()

        system_prompt = (
            "Eres Audiflow, una herramienta profesional de auditoría legal y análisis pericial de contratos. "
            "Evalúa el contrato aplicando RIGUROSAMENTE las siguientes normativas y buenas prácticas:\n"
            f"{normativas_ref}\n\n"
            "INSTRUCCIONES CLAVE:\n"
            "1. En 'resumen_ejecutivo', escribe en LENGUAJE SIMPLE Y COTIDIANO de qué se trata el documento: qué se está contratando, quién le presta el servicio a quién, qué tipo de producto o servicio se ofrece y cuáles son las condiciones principales. Escríbelo como si se lo explicaras a alguien que no es abogado. NO uses numerales, listas formales ni diagnósticos.\n"
            "2. En 'clausulas_criticas', identifica estipulaciones riesgosas del documento original (penalidades excesivas, responsabilidad asimétrica, cláusulas abusivas, omisión de Habeas Data o AML) y para CADA UNA cita exactamente el documento original para sustentar el riesgo y emitir la recomendación legal correspondiente:\n"
            "   - 'tipo': Categoría jurídica (ej. Responsabilidad, Penalidad, Privacidad, AML, SLA, Terminación).\n"
            "   - 'severidad': ALTO | MEDIO | BAJO.\n"
            "   - 'ubicacion_exacta': Dónde revisar con lupa en el documento original (ej. 'Cláusula Quinta, Numeral 5.2', 'Cláusula Novena, Párrafo 2', o 'Sección ausente en el documento').\n"
            "   - 'cita_textual': Fragmento literal exacto extraído del documento original donde radica el riesgo.\n"
            "   - 'explicacion_riesgo': Explicación clara de por qué este punto específico genera riesgo.\n"
            "   - 'fundamento_normativo': Norma, ley o estándar legal aplicable.\n"
            "   - 'recomendacion_legal': Recomendación legal y preventiva específica ante este riesgo detectado.\n"
            "   - 'redaccion_sugerida': Propuesta de redacción contractual equilibrada para incluir en una adenda.\n\n"
            "Debes responder OBLIGATORIAMENTE en formato JSON válido con esta estructura:\n"
            "{\n"
            '  "score_riesgo_ia": <numero entero 0-100>,\n'
            '  "nivel_riesgo_ia": "<ALTO | MEDIO | BAJO>",\n'
            '  "resumen_ejecutivo": "<resumen claro explicando de qué trata y habla el documento>",\n'
            '  "clausulas_criticas": [\n'
            '    {\n'
            '      "tipo": "<tipo>",\n'
            '      "severidad": "<ALTO | MEDIO | BAJO>",\n'
            '      "ubicacion_exacta": "<dónde revisar con lupa>",\n'
            '      "cita_textual": "<cita literal del documento original>",\n'
            '      "explicacion_riesgo": "<detalle del riesgo>",\n'
            '      "fundamento_normativo": "<normativa>",\n'
            '      "recomendacion_legal": "<recomendación legal preventiva>",\n'
            '      "redaccion_sugerida": "<redacción sugerida para adenda>"\n'
            '    }\n'
            '  ]\n'
            "}\n"
            "Identifica de 2 a 3 cláusulas críticas relevantes."
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
                "num_ctx": 2048,     # Contexto suficiente para contrato y análisis detallado
                "num_predict": 700,  # Presupuesto para dictamen completo y citas
                "num_thread": 3      # Rendimiento óptimo en CPU ARM Ampere A1
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
            with urllib.request.urlopen(req, timeout=180) as resp:
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