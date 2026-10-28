# services/llm_audit_service.py
import os
import json
import time
import subprocess
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, Tuple
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

    def _sanitize_text(self, text: str, max_chars: int = 10000) -> str:
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

    def detect_typology_heuristic(self, text: str) -> Tuple[str, str]:
        """
        Clasifica heurísticamente la tipología del contrato y genera una explicación
        en lenguaje simple y accesible para cualquier persona.
        """
        t = text.lower()
        if re.search(r'arrendamiento|arrendador|arrendatario|canon\s+de\s+arrendamiento|inmueble|locativo', t):
            return (
                "Contrato de Arrendamiento",
                "Es un acuerdo donde el dueño o administrador de un bien (arrendador) le permite a otra persona (arrendatario) usarlo y disfrutarlo temporalmente a cambio de un pago periódico (canon). No transfiere la propiedad del bien ni crea una relación laboral."
            )
        elif re.search(r'contrato\s+(individual\s+)?de\s+trabajo|laboral|empleador|trabajador|c[oó]digo\s+sustantivo|subordinaci[oó]n|salario\s+mensual', t):
            return (
                "Contrato Individual de Trabajo",
                "Es un vínculo laboral formal donde una persona presta sus servicios personales bajo las órdenes directas y continuas de un empleador (subordinación), a cambio de un salario periódico y con cobertura de prestaciones sociales y seguridad social obligatoria."
            )
        elif re.search(r'prestaci[oó]n\s+de\s+servicios|contratista|honorarios|independencia\s+t[eé]cnica|autonom[ií]a\s+t[eé]cnica', t):
            return (
                "Contrato de Prestación de Servicios",
                "Es un acuerdo civil o comercial donde un profesional o empresa independiente se compromete a realizar una labor puntual a cambio de unos honorarios. El contratista trabaja con total autonomía y no existe relación de empleo ni horario laboral obligatorio."
            )
        elif re.search(r'confidencialidad|non-disclosure|nda|secreto\s+(comercial|industrial)|no\s+divulgaci[oó]n', t):
            return (
                "Acuerdo de Confidencialidad (NDA)",
                "Es un compromiso legal preventivo que obliga a las partes a proteger la información privada, financiera o técnica que compartan, prohibiendo revelarla a terceros o usarla para fines no autorizados."
            )
        elif re.search(r'matr[ií]cula|academusoft|estudiante|semestre|educativo|asignatura|cr[eé]ditos\s+acad[eé]micos', t):
            return (
                "Registro de Matrícula / Acuerdo Educativo",
                "Es un documento formal que vincula a un estudiante con una institución educativa, detallando el plan académico, las asignaturas inscritas y los compromisos reglamentarios de formación y pago."
            )
        elif re.search(r'compraventa|suministro|suministrante|comprador|vendedor|mercanc[ií]as|proveedor', t):
            return (
                "Contrato de Compraventa / Suministro",
                "Es un acuerdo comercial donde una parte se compromete a entregar mercancías, bienes o insumos de manera periódica o definitiva, y la otra parte se obliga a pagar el precio acordado."
            )
        elif re.search(r'software|saas|licencia\s+de\s+uso|plataforma\s+digital|c[oó]digo\s+fuente', t):
            return (
                "Contrato de Licenciamiento de Software / SaaS",
                "Es un contrato tecnológico donde el propietario del software autoriza su uso a un cliente o usuario bajo condiciones específicas, conservando la propiedad intelectual y fijando reglas de disponibilidad y soporte."
            )
        else:
            return (
                "Contrato Comercial / Acuerdo General",
                "Es un acuerdo bilateral donde las partes definen sus compromisos mutuos, plazos de cumplimiento, condiciones de pago y responsabilidades legales para colaborar o llevar a cabo un negocio o servicio conjunto."
            )

    def _parse_json_resilient(self, raw_text: str, sample_text: str = "") -> Dict[str, Any]:
        """
        Parsea el JSON generado por Llama 3.1 de forma tolerante a fallos y truncamientos.
        Garantiza que tipologia_contrato, explicacion_tipologia, resumen_ejecutivo, score y cláusulas nunca se pierdan.
        """
        parsed: Optional[Dict[str, Any]] = None

        # 1. Intento directo estándar
        try:
            data = json.loads(raw_text)
            if isinstance(data, dict):
                parsed = data
        except Exception:
            pass

        # 2. Intento de auto-reparar corchetes y llaves truncadas
        if parsed is None:
            try:
                clean = raw_text.strip()
                if clean.count('"') % 2 != 0:
                    clean += '"'
                for _ in range(5):
                    try:
                        data = json.loads(clean)
                        if isinstance(data, dict):
                            parsed = data
                            break
                    except Exception:
                        if clean.rfind("{") > clean.rfind("}"):
                            clean += "}"
                        elif clean.rfind("[") > clean.rfind("]"):
                            clean += "]"
                        else:
                            break
            except Exception:
                pass

        # Determinar fallback heurístico de tipología
        heuristic_tipo, heuristic_expl = self.detect_typology_heuristic(sample_text)

        if parsed is not None:
            # Asegurar campos de tipología si el LLM no los trajo o vinieron vacíos
            if not parsed.get("tipologia_contrato") or len(str(parsed.get("tipologia_contrato", "")).strip()) < 3:
                parsed["tipologia_contrato"] = heuristic_tipo
            if not parsed.get("explicacion_tipologia") or len(str(parsed.get("explicacion_tipologia", "")).strip()) < 10:
                parsed["explicacion_tipologia"] = heuristic_expl
            return parsed

        # 3. Extracción de contingencia por Regex
        score_match = re.search(r'"score_riesgo_ia"\s*:\s*(\d+)', raw_text)
        nivel_match = re.search(r'"nivel_riesgo_ia"\s*:\s*"([^"]+)"', raw_text)
        resumen_match = re.search(r'"resumen_ejecutivo"\s*:\s*"([^"]+)"', raw_text)
        tipo_match = re.search(r'"tipologia_contrato"\s*:\s*"([^"]+)"', raw_text)
        expl_match = re.search(r'"explicacion_tipologia"\s*:\s*"([^"]+)"', raw_text)

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
            "tipologia_contrato": tipo_match.group(1) if tipo_match else heuristic_tipo,
            "explicacion_tipologia": expl_match.group(1) if expl_match else heuristic_expl,
            "score_riesgo_ia": int(score_match.group(1)) if score_match else 50,
            "nivel_riesgo_ia": nivel_match.group(1) if nivel_match else "MEDIO",
            "resumen_ejecutivo": resumen_match.group(1) if resumen_match else default_summary,
            "clausulas_criticas": clausulas
        }

    def apply_anti_hallucination_harness(self, parsed: Dict[str, Any], raw_contract: str) -> Dict[str, Any]:
        """
        Arnés de verificación cruzada en Python:
        Valida que cada hallazgo de la IA esté físicamente respaldado por el texto del contrato.
        Elimina alucinaciones, citas inventadas y falsos positivos.
        """
        if not isinstance(parsed, dict):
            return parsed

        norm_contract = re.sub(r'\s+', ' ', raw_contract.lower())
        validated_clauses = []

        for c in parsed.get("clausulas_criticas", []):
            if not isinstance(c, dict):
                continue
            cita = str(c.get("cita_textual", "")).strip()
            # Si no hay cita o es un placeholder genérico
            if len(cita) < 8 or cita.lower() in [
                "cita textual analizada en el contrato.",
                "n/a",
                "no aplica",
                "texto específico analizado en las estipulaciones del documento."
            ]:
                continue

            # Limpiar cita para búsqueda tolerante (sin signos de puntuación)
            norm_cita = re.sub(r'\s+', ' ', cita.lower())
            
            # Verificar si la cita completa o un fragmento significativo de al menos 4 palabras existe en el contrato
            palabras = [p for p in re.split(r'\W+', norm_cita) if len(p) > 2]
            found = False
            
            if norm_cita in norm_contract:
                found = True
            elif len(palabras) >= 4:
                # Comprobar si al menos una subsecuencia de 4 palabras consecutivas existe en el contrato
                for i in range(len(palabras) - 3):
                    chunk = " ".join(palabras[i:i+4])
                    if chunk in norm_contract:
                        found = True
                        break
            elif len(palabras) > 0:
                # Si la cita es corta pero sus palabras clave están
                matched_count = sum(1 for p in palabras if p in norm_contract)
                if matched_count / len(palabras) >= 0.75:
                    found = True

            if found:
                validated_clauses.append(c)
            else:
                print(f"[ARNÉS ANTI-ALUCINACIÓN] Descartada cláusula sin respaldo literal: {c.get('tipo', 'Desconocido')} - '{cita[:60]}...'")

        parsed["clausulas_criticas"] = validated_clauses

        # Ajuste de consistencia: si no hay cláusulas críticas válidas en el documento
        if not validated_clauses:
            current_score = parsed.get("score_riesgo_ia", 0)
            if isinstance(current_score, int) and current_score > 25:
                # Si no hay cláusulas críticas reales, el score se normaliza a nivel bajo
                parsed["score_riesgo_ia"] = 10
                parsed["nivel_riesgo_ia"] = "BAJO"

        return parsed

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

    def analyze_contract_semantics(self, contract_text: str, max_chars: int = 8000) -> Dict[str, Any]:
        """
        Envía el contrato al modelo Llama 3.1 para auditoría semántica profunda aplicando las normativas 2026
        con arnés estricto anti-alucinaciones y verificación cruzada en tiempo real.
        """
        sample_text = self._sanitize_text(contract_text, max_chars)
        normativas_ref = self.get_normativa_2026_summary()

        system_prompt = (
            "Eres Audiflow, un auditor legal de contratos e instrumentos jurídicos con arnés de precisión forense.\n"
            "REGLAS OBLIGATORIAS DEL ARNÉS ANTI-ALUCINACIÓN:\n"
            "1. MUNDO CERRADO: Tu único universo de información es estrictamente el texto contenido dentro de las etiquetas <CONTRATO> y </CONTRATO>. Queda prohibido inferir, inventar cláusulas o asumir hechos no explícitamente escritos.\n"
            "2. GROUNDING Y CITA OBLIGATORIA: En 'clausulas_criticas', toda observación DEBE contener una 'cita_textual' copiada de forma exacta y literal del contrato original. Si una cláusula no existe textualmente, está terminantemente prohibido reportarla.\n"
            "3. VÁLVULA DE ESCAPE (CERO FALSOS POSITIVOS): Si el documento no presenta cláusulas abusivas ni riesgos graves, DEBES responder con 'clausulas_criticas': [] (lista vacía) y un 'score_riesgo_ia' bajo (ej. 5 o 10). NUNCA inventes cláusulas para rellenar el análisis.\n"
            "4. TAXONOMÍA ESTRICTA: En 'tipologia_contrato', clasifica el documento en una de estas categorías oficiales: 'Contrato de Prestación de Servicios', 'Contrato Individual de Trabajo', 'Contrato de Arrendamiento', 'Acuerdo de Confidencialidad (NDA)', 'Contrato de Compraventa / Suministro', 'Contrato de Licenciamiento de Software / SaaS', 'Registro de Matrícula / Acuerdo Educativo', o 'Contrato Comercial General'.\n"
            "5. EXPLICACIÓN EN LENGUAJE SIMPLE: En 'explicacion_tipologia', explica en lenguaje cotidiano qué significa esta figura jurídica, qué relación genera entre las partes y sus implicaciones prácticas.\n"
            "6. RESUMEN FACTUAL: En 'resumen_ejecutivo', explica en 2 o 3 oraciones sencillas y en lenguaje cotidiano de qué se trata exactamente el documento analizado según su contenido real (partes y objeto concreto). NO uses plantillas fijas.\n\n"
            "Estructura JSON obligatoria:\n"
            "{\n"
            '  "tipologia_contrato": "<categoría oficial>",\n'
            '  "explicacion_tipologia": "<explicación en lenguaje simple>",\n'
            '  "score_riesgo_ia": <número entero 0-100>,\n'
            '  "nivel_riesgo_ia": "<ALTO | MEDIO | BAJO>",\n'
            '  "resumen_ejecutivo": "<resumen específico de qué trata este documento>",\n'
            '  "clausulas_criticas": [\n'
            '    {\n'
            '      "tipo": "<Penalidad | SLA | Responsabilidad | Renovacion | Privacidad | Jurisdiccion>",\n'
            '      "severidad": "ALTO | MEDIO | BAJO",\n'
            '      "ubicacion_exacta": "<dónde se ubica en el documento>",\n'
            '      "cita_textual": "<fragmento LITERAL copiado del contrato>",\n'
            '      "explicacion_riesgo": "<por qué representa riesgo>",\n'
            '      "fundamento_normativo": "<norma o principio aplicable>",\n'
            '      "recomendacion_legal": "<qué hacer para corregirlo>",\n'
            '      "redaccion_sugerida": "<propuesta redactada para adenda>"\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        user_prompt = (
            f"<CONTRATO>\n{sample_text}\n</CONTRATO>\n\n"
            "Aplica rigurosamente las reglas del arnés anti-alucinación sobre el texto del contrato anterior y responde exclusivamente en formato JSON válido:"
        )

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
                "num_ctx": 4096,     # Tamaño óptimo para procesar en CPU ARM
                "num_predict": 600,  # Presupuesto conciso para respuesta rápida sin timeout (<45s)
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
                    parsed_result = self._parse_json_resilient(content, sample_text)
                    # Aplicar arnés de verificación cruzada de evidencias
                    harnessed_result = self.apply_anti_hallucination_harness(parsed_result, sample_text)
                    return {
                        "exito": True,
                        "motor": f"Ollama ({self.model})",
                        "endpoint": endpoint,
                        "resultado_ia": harnessed_result
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

        # Fallback cuando Ollama está offline: resumen genérico y tipología en lenguaje simple
        fallback_tipo, fallback_expl = self.detect_typology_heuristic(sample_text)
        fallback_summary = (
            "Este documento es un acuerdo legal entre dos o más partes que define las condiciones del servicio o negocio pactado, incluyendo obligaciones, pagos, plazos y responsabilidades de cada parte involucrada."
        )

        return {
            "exito": False,
            "motor": f"Ollama ({self.model})",
            "endpoint": endpoint,
            "resultado_ia": {
                "tipologia_contrato": fallback_tipo,
                "explicacion_tipologia": fallback_expl,
                "score_riesgo_ia": 0,
                "nivel_riesgo_ia": "MODERADO",
                "resumen_ejecutivo": fallback_summary,
                "clausulas_criticas": []
            }
        }

llm_service = LLMAuditService()