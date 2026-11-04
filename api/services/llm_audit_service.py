# services/llm_audit_service.py
import os
import json
import time
import subprocess
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, Tuple, List
import re

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://132.145.198.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
SSH_KEY_PATH = os.getenv("OLLAMA_SSH_KEY", r"C:\Users\Eduardo\Desktop\Ollama 3.1.key")
VPS_HOST = os.getenv("OLLAMA_VPS_HOST", "132.145.198.1")
VPS_USER = os.getenv("OLLAMA_VPS_USER", "ubuntu")
NORMATIVAS_URL = os.getenv("NORMATIVAS_URL", "https://audiflow-audit.abbynex.site/normativas/normativa_auditoria_vigente_2026.md")


# ─── ARNÉS ANTI-ALUCINACIÓN 2.0: TAXONOMÍA Y GROUNDING MULTIDIMENSIONAL ──────
COMMON_LEGAL_STOPWORDS = {
    "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o", "u", "e",
    "en", "a", "al", "del", "por", "para", "con", "sin", "sobre", "entre", "se", "su",
    "sus", "que", "como", "mas", "más", "pero", "este", "esta", "estos", "estas", "cual", "cuales"
}

LEGAL_TAXONOMY_PATTERNS = {
    "penalidad": [
        r"\bpenalid\w*", r"\bmulta\w*", r"\bsanci[oó]n\w*", r"\bmora\b", r"\bcl[aá]usula penal\b", 
        r"\bindemniz\w*", r"\binter[eé]s\w*", r"\bretenci[oó]n\w*", r"\bdescuento\w*", r"%", 
        r"\bperjuicio\w*", r"\bincumplimiento\w*", r"\btarifa\b", r"\bpago\b", r"\busura\b"
    ],
    "sla": [
        r"\bdisponib\w*", r"\bnivel de servicio\b", r"\bsla\b", r"\buptime\b", r"\btiempo de respuesta\b",
        r"\bventana de mantenimiento\b", r"99\.", r"95\.", r"\bsoporte t[eé]cnico\b", r"\bincidencia\w*",
        r"\bhorario\b", r"\bhora\w*", r"\bminuto\w*", r"\blatencia\b"
    ],
    "responsabilidad": [
        r"\bresponsab\w*", r"\bindemn\w*", r"\bda[nñ]o\w*", r"\bperjuicio\w*", r"\bdolo\b", r"\bculpa\b", 
        r"\bexoner\w*", r"\blimitaci[oó]n\b", r"\bexcluy\w*", r"\bdirecto\b", r"\bindirecto\b",
        r"\blucro cesante\b", r"\bda[nñ]o emergente\b", r"\btercero\w*", r"\breclamo\w*"
    ],
    "terminacion": [
        r"\btermina\w*", r"\brescisi[oó]n\b", r"\bresoluci[oó]n\b", r"\bunilateral\b", r"\bpreaviso\b", 
        r"\bjusta causa\b", r"\bincumplimiento grave\b", r"\brevoca\w*", r"\bdesist\w*",
        r"\bvencimiento\b", r"\bvigencia\b", r"\bpr[oó]rroga\b", r"\brenovaci[oó]n\b"
    ],
    "privacidad": [
        r"\bconfidenc\w*", r"\bsecreto\b", r"\breserva\b", r"\bdatos personales\b", r"\bhabeas data\b", 
        r"\brgpd\b", r"\bdivulga\w*", r"\bprivacidad\b", r"\bseguridad de la informaci[oó]n\b",
        r"\bno divulgaci[oó]n\b", r"\bcifrado\b", r"\btercero\w*"
    ],
    "propiedad_intelectual": [
        r"\bpropiedad intelectual\b", r"\bderechos de autor\b", r"\blicencia\w*", r"\bpatente\w*", 
        r"\bmarca\w*", r"\btitularidad\b", r"\bceder\b", r"\bcesi[oó]n\b", r"\bsoftware\b", 
        r"\bc[oó]digo fuente\b", r"\bobras\b", r"\bcreaci[oó]n\w*", r"\binvenci[oó]n\w*"
    ],
    "jurisdiccion": [
        r"\bjurisdicci[oó]n\b", r"\bley aplicable\b", r"\barbitr\w*", r"\btribunal\w*", r"\bjueces\b", 
        r"\bamigable componedor\b", r"\bcompetencia\b", r"\bdiligencia\b", r"\bdomicilio\b"
    ]
}

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

    def build_smart_contract_digest(self, full_text: str, chunks: Optional[List[str]] = None, max_chars: int = 8000) -> str:
        """
        Smart Chunking: Para contratos extensos (+10 o 20 páginas), ensambla un extracto inteligente
        con el inicio estructural (partes, objeto, vigencia) y los fragmentos más críticos
        con cláusulas de riesgo (penalidades, terminación, multas, exclusividad, responsabilidad).
        """
        if not full_text:
            return ""

        # Si el contrato es corto (cabe completo en max_chars), usarlo directo
        if len(full_text) <= max_chars:
            return self._sanitize_text(full_text, max_chars)

        # Si no se suministran chunks, dividirlos por párrafos
        if not chunks:
            raw_chunks = re.split(r'\n\s*\n', full_text)
            chunks = [c.strip() for c in raw_chunks if len(c.strip()) > 30]

        if not chunks:
            return self._sanitize_text(full_text, max_chars)

        # 1. Base fija: los primeros chunks (usualmente las primeras 2 páginas con partes y objeto)
        selected_chunks = []
        current_len = 0
        budget_head = int(max_chars * 0.45) # ~3600 caracteres para el encabezado

        for idx, chunk in enumerate(chunks):
            if current_len + len(chunk) <= budget_head or idx < 2:
                selected_chunks.append(chunk)
                current_len += len(chunk)
            else:
                break

        # 2. Búsqueda semántica de chunks con términos de alta sensibilidad en el resto del contrato
        risk_keywords = re.compile(
            r'penalidad|sanci[oó]n|multa|mora|indemnizaci[oó]n|rescisi[oó]n|resoluci[oó]n|'
            r'terminaci[oó]n\s+anticipada|exoneraci[oó]n|responsabilidad|inmunidad|dolo|'
            r'renovaci[oó]n\s+autom[aá]tica|exclusividad|confidencialidad|fuero|jurisdicci[oó]n|'
            r'tribunal|arbitral|lista\s+restrictiva|ofac|lavado|corrupci[oó]n',
            re.IGNORECASE
        )

        remaining_chunks = chunks[len(selected_chunks):]
        scored_chunks = []

        for ch in remaining_chunks:
            matches = len(risk_keywords.findall(ch))
            if matches > 0:
                scored_chunks.append((matches, ch))

        # Ordenar chunks por mayor densidad de cláusulas de riesgo
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        # Agregar los fragmentos más críticos respetando el presupuesto total de caracteres
        for _, ch in scored_chunks:
            if current_len + len(ch) + 4 <= max_chars:
                selected_chunks.append(ch)
                current_len += len(ch)
            if current_len >= max_chars:
                break

        # Ensamblar el concentrado inteligente
        digest = "\n\n[...]\n\n".join(selected_chunks)
        return self._sanitize_text(digest, max_chars)

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

    def calculate_textual_grounding(self, cita: str, norm_contract: str) -> Tuple[bool, int, str]:
        """
        Arnés 2.0 - Capa 1: Cobertura Proporcional y Fidelidad Textual.
        No se conforma con 4 palabras arbitrarias: exige coincidencia literal exacta (100%)
        o una cobertura de palabras léxicas continuas >= 65% en el contrato.
        """
        norm_cita = re.sub(r'\s+', ' ', cita.strip().lower())
        if not norm_cita:
            return False, 0, "Cita vacía."

        # 1. Coincidencia literal directa completa
        if norm_cita in norm_contract:
            return True, 100, "Cita literal exacta confirmada en el contrato."

        words = re.findall(r'\b\w+\b', norm_cita)
        if not words:
            return False, 0, "Sin palabras reconocibles."

        lexical_words = [w for w in words if len(w) >= 3 and w not in COMMON_LEGAL_STOPWORDS]
        if not lexical_words:
            return False, 0, "La cita solo contiene conectores genéricos sin sustancia textual."

        # Citas cortas (<= 5 palabras) deben coincidir literalmente
        if len(words) <= 5:
            if norm_cita in norm_contract:
                return True, 100, "Cita corta confirmada."
            return False, 0, "Cita corta no encontrada textualmente en el contrato."

        # Para citas más extensas: verificar cobertura proporcional mediante ventanas continuas
        covered_word_indices = set()
        n = len(words)
        window_sizes = [6, 5, 4, 3]

        for ws in window_sizes:
            for i in range(n - ws + 1):
                sub = " ".join(words[i:i+ws])
                if sub in norm_contract:
                    if any(w in lexical_words for w in words[i:i+ws]):
                        for idx in range(i, i + ws):
                            covered_word_indices.add(idx)

        lexical_indices = [i for i, w in enumerate(words) if w in lexical_words]
        covered_lexical = [i for i in lexical_indices if i in covered_word_indices]

        coverage_ratio = len(covered_lexical) / len(lexical_indices) if lexical_indices else 0.0
        fidelidad_pct = int(round(coverage_ratio * 100))

        # Regla estricta: Se requiere al menos un 65% de cobertura de palabras léxicas
        if coverage_ratio >= 0.65:
            return True, fidelidad_pct, f"Cita verificada con alta cobertura textual ({fidelidad_pct}% >= 65%)."
        else:
            return False, fidelidad_pct, f"Cita descartada por baja cobertura textual ({fidelidad_pct}% < 65%). Posible alucinación parcial."

    def validate_legal_soundness(self, tipo: str, cita: str, explicacion: str) -> Tuple[bool, str, str]:
        """
        Arnés 2.0 - Capa 2: Validez y Coherencia Jurídica.
        Verifica que el tipo de riesgo alegado tenga sustento léxico-jurídico real
        en la cita del contrato, y que la explicación aporte fundamentación no tautológica.
        """
        tipo_str = str(tipo or "").strip().lower()

        matched_category = None
        if any(k in tipo_str for k in ["penal", "multa", "sanci", "mora"]):
            matched_category = "penalidad"
        elif any(k in tipo_str for k in ["sla", "servicio", "disponib", "uptime"]):
            matched_category = "sla"
        elif any(k in tipo_str for k in ["responsab", "indemn", "daño", "perjuicio"]):
            matched_category = "responsabilidad"
        elif any(k in tipo_str for k in ["termina", "resolu", "renova", "resci", "prorro"]):
            matched_category = "terminacion"
        elif any(k in tipo_str for k in ["priva", "confiden", "dato", "segurid"]):
            matched_category = "privacidad"
        elif any(k in tipo_str for k in ["intelectual", "autor", "licenc", "software", "patente", "marca"]):
            matched_category = "propiedad_intelectual"
        elif any(k in tipo_str for k in ["jurisdic", "ley", "arbitr", "tribunal"]):
            matched_category = "jurisdiccion"

        if not matched_category:
            if len(explicacion.strip()) < 15:
                return False, "INSUFICIENTE", "Fundamentación jurídica vacía o insuficiente."
            return True, "PARCIAL", "Tipología genérica con fundamentación básica."

        # El respaldo léxico de la figura jurídica DEBE estar en la CITA textual del contrato
        patterns = LEGAL_TAXONOMY_PATTERNS.get(matched_category, [])
        has_lexical_grounding = any(re.search(pat, cita.lower()) for pat in patterns)

        if not has_lexical_grounding:
            return False, "INCONGRUENTE", f"Incongruencia jurídica: Se catalogó como '{tipo}', pero la cita no contiene términos relativos a '{matched_category}'."

        if len(explicacion.strip()) < 15 or explicacion.strip().lower() in ["es riesgosa", "riesgo alto", "no aplica"]:
            return True, "PARCIAL", "Respaldo léxico presente pero justificación jurídica débil."

        return True, "CONFIRMADA", f"Coherencia jurídica confirmada para categoría '{matched_category}'."

    def apply_anti_hallucination_harness(self, parsed: Dict[str, Any], raw_contract: str) -> Dict[str, Any]:
        """
        Arnés Anti-Alucinación y Validación Jurídica 2.0:
        1. Capa de Fidelidad Textual: Cobertura proporcional continua (mínimo 65% de palabras léxicas).
        2. Capa de Coherencia Jurídica: Concordancia léxica entre la tipología declarada y el texto citado.
        3. Capa de Calibración: Ponderación de severidad y descarte de conclusiones sin respaldo.
        """
        if not isinstance(parsed, dict):
            return parsed

        norm_contract = re.sub(r'\s+', ' ', raw_contract.lower())
        validated_clauses = []

        for c in parsed.get("clausulas_criticas", []):
            if not isinstance(c, dict):
                continue
            cita = str(c.get("cita_textual", "")).strip()
            tipo = str(c.get("tipo", "Riesgo Contractual")).strip()
            explicacion = str(c.get("explicacion_riesgo", "")).strip()

            # Placeholder o cita vacía
            if len(cita) < 8 or cita.lower() in [
                "cita textual analizada en el contrato.",
                "n/a",
                "no aplica",
                "texto específico analizado en las estipulaciones del documento."
            ]:
                continue

            # 1. Capa de Fidelidad Textual (Grounding)
            is_grounded, fidelity_pct, ground_msg = self.calculate_textual_grounding(cita, norm_contract)
            if not is_grounded:
                print(f"[ARNÉS ANTI-ALUCINACIÓN 2.0] Descartada cláusula por fallo textual: {tipo} ({fidelity_pct}%) - {ground_msg}")
                continue

            # 2. Capa de Validez y Coherencia Jurídica
            is_sound, sound_level, sound_msg = self.validate_legal_soundness(tipo, cita, explicacion)
            if not is_sound:
                print(f"[ARNÉS ANTI-ALUCINACIÓN 2.0] Descartada cláusula por fallo jurídico: {tipo} - {sound_msg}")
                continue

            # 3. Calibración y Enriquecimiento con Métricas Transparentes
            c["fidelidad_textual_pct"] = fidelity_pct
            c["coherencia_juridica"] = sound_level
            c["estado_arnes"] = "VERIFICADO_LITERAL" if fidelity_pct == 100 else "VERIFICADO_ROBUSTO"
            c["motivo_arnes"] = f"{ground_msg} {sound_msg}"

            # Calibración de severidad: si la justificación jurídica es parcial, evitar alarmismo
            if sound_level == "PARCIAL" and c.get("severidad") == "ALTO":
                c["severidad"] = "MEDIO"

            validated_clauses.append(c)

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

    def analyze_contract_semantics(self, contract_text: str, chunks: Optional[List[str]] = None, max_chars: int = 8000) -> Dict[str, Any]:
        """
        Envía el contrato al modelo Llama 3.1 para auditoría semántica profunda aplicando las normativas 2026
        con arnés estricto anti-alucinaciones y verificación cruzada en tiempo real.
        """
        sample_text = self.build_smart_contract_digest(contract_text, chunks=chunks, max_chars=max_chars)
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
                    harnessed_result = self.apply_anti_hallucination_harness(parsed_result, contract_text)
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