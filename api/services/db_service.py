import uuid
import hashlib
import sqlite3
from typing import Dict, Any, List, Optional
from database import supabase, SQLITE_DB_PATH

class DatabaseAuditService:
    """
    Servicio de persistencia híbrido para Audiflow:
    1. Primario: Supabase Cloud (PostgreSQL en la nube).
    2. Secundario / Fallback: SQLite Local (`data/audiflow_local.db`).
    Garantiza que ninguna auditoría se pierda si hay cortes de red o credenciales en renovación.
    """

    @staticmethod
    def calculate_sha256(file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    def _save_sqlite(
        self,
        doc_record: Dict[str, Any],
        ocr_records: List[Dict[str, Any]],
        clause_records: List[Dict[str, Any]],
        risk_records: List[Dict[str, Any]]
    ) -> bool:
        """Guarda la auditoría en la base de datos local SQLite."""
        try:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            c = conn.cursor()
            c.execute("""
            INSERT OR REPLACE INTO documentos 
            (id_documento, id_empresa, id_usuario_carga, nombre_original, hash_sha256, ruta_almacenamiento_seguro, tamano_bytes, tipo_mime, tipo_contrato, estado_procesamiento)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_record.get("id_documento"),
                doc_record.get("id_empresa"),
                doc_record.get("id_usuario_carga"),
                doc_record.get("nombre_original"),
                doc_record.get("hash_sha256"),
                doc_record.get("ruta_almacenamiento_seguro"),
                doc_record.get("tamano_bytes"),
                doc_record.get("tipo_mime"),
                doc_record.get("tipo_contrato"),
                doc_record.get("estado_procesamiento")
            ))

            for ocr in ocr_records:
                c.execute("""
                INSERT OR REPLACE INTO texto_ocr (id_ocr, id_documento, num_pagina, contenido_texto, confianza_ocr)
                VALUES (?, ?, ?, ?, ?)
                """, (
                    ocr.get("id_ocr"),
                    ocr.get("id_documento"),
                    ocr.get("num_pagina"),
                    ocr.get("contenido_texto"),
                    ocr.get("confianza_ocr", 99.0)
                ))

            for cl in clause_records:
                c.execute("""
                INSERT OR REPLACE INTO clausulas_extraidas (id_clausula, id_documento, tipo_clausula, texto_clausula)
                VALUES (?, ?, ?, ?)
                """, (
                    cl.get("id_clausula"),
                    cl.get("id_documento"),
                    cl.get("tipo_clausula"),
                    cl.get("texto_clausula")
                ))

            for rk in risk_records:
                c.execute("""
                INSERT OR REPLACE INTO analisis_riesgos 
                (id_riesgo, id_documento, id_clausula, nivel_riesgo, categoria_cumplimiento, titulo_hallazgo, descripcion_riesgo, recomendacion_mitigacion, es_incumplimiento)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    rk.get("id_riesgo"),
                    rk.get("id_documento"),
                    rk.get("id_clausula"),
                    rk.get("nivel_riesgo"),
                    rk.get("categoria_cumplimiento"),
                    rk.get("titulo_hallazgo"),
                    rk.get("descripcion_riesgo"),
                    rk.get("recomendacion_mitigacion"),
                    1 if rk.get("es_incumplimiento") else 0
                ))

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"[SQLite Fallback Error] {e}")
            return False

    def save_audit(
        self,
        filename: str,
        file_bytes: bytes,
        raw_text: str,
        chunks: List[str],
        rule_assessment: Optional[Any] = None,
        llm_assessment: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Persiste los resultados completos de la auditoría en Supabase o en SQLite local.
        """
        document_id = str(uuid.uuid4())
        file_hash = self.calculate_sha256(file_bytes)

        # Preparar registros estructurados
        doc_record = {
            "id_documento": document_id,
            "id_empresa": None,
            "id_usuario_carga": None,
            "nombre_original": filename,
            "hash_sha256": file_hash,
            "ruta_almacenamiento_seguro": f"audits/{document_id}/{filename}",
            "tamano_bytes": len(file_bytes),
            "tipo_mime": "application/pdf",
            "tipo_contrato": "Licencia_Software",
            "estado_procesamiento": "Auditado"
        }

        ocr_records = []
        for idx, chunk in enumerate(chunks[:50]):
            ocr_records.append({
                "id_ocr": str(uuid.uuid4()),
                "id_documento": document_id,
                "num_pagina": idx + 1,
                "contenido_texto": chunk,
                "confianza_ocr": 99.0
            })

        clause_records = []
        if llm_assessment and isinstance(llm_assessment, dict):
            ia_result = llm_assessment.get("resultado_ia", {})
            critical_clauses = ia_result.get("clausulas_criticas", [])
            for c in critical_clauses:
                c_type = str(c.get("tipo", "General"))[:80]
                c_text = str(c.get("cita_textual", c.get("explicacion_riesgo", "Sin texto")))
                clause_records.append({
                    "id_clausula": str(uuid.uuid4()),
                    "id_documento": document_id,
                    "tipo_clausula": c_type,
                    "texto_clausula": c_text
                })

        risk_records = []
        if rule_assessment:
            findings = getattr(rule_assessment, "findings", []) or (
                rule_assessment.get("findings", []) if isinstance(rule_assessment, dict) else []
            )
            for f in findings:
                f_title = getattr(f, "title", None) or f.get("title", "Riesgo Normativo")
                f_severity = getattr(f, "severity", None) or f.get("severity", "MEDIO")
                f_category = getattr(f, "category", None) or f.get("category", "GENERAL")
                f_desc = getattr(f, "description", None) or f.get("description", "")
                f_remediation = getattr(f, "remediation", None) or f.get("remediation", "")

                severity_map = {"ALTO": "Alto", "MEDIO": "Medio", "BAJO": "Bajo", "CRITICO": "Critico"}
                mapped_sev = severity_map.get(str(f_severity).upper(), "Medio")

                risk_records.append({
                    "id_riesgo": str(uuid.uuid4()),
                    "id_documento": document_id,
                    "id_clausula": None,
                    "nivel_riesgo": mapped_sev,
                    "categoria_cumplimiento": str(f_category)[:100],
                    "titulo_hallazgo": str(f_title)[:200],
                    "descripcion_riesgo": str(f_desc),
                    "recomendacion_mitigacion": str(f_remediation),
                    "es_incumplimiento": True if mapped_sev in ["Alto", "Critico"] else False
                })

        # 1. Intentar guardar en Supabase Cloud
        supabase_saved = False
        if supabase:
            try:
                supabase.table("documentos").insert(doc_record).execute()
                if ocr_records:
                    supabase.table("texto_ocr").insert(ocr_records).execute()
                if clause_records:
                    supabase.table("clausulas_extraidas").insert(clause_records).execute()
                if risk_records:
                    supabase.table("analisis_riesgos").insert(risk_records).execute()
                supabase_saved = True
            except Exception as e:
                print(f"[Supabase Sync Notice] Guardado en la nube omitido ({e}). Aplicando persistencia en SQLite Local.")

        # 2. Persistir localmente en SQLite como garantía de respaldo
        sqlite_saved = self._save_sqlite(doc_record, ocr_records, clause_records, risk_records)

        engine = "Supabase Cloud + SQLite Local" if supabase_saved else "SQLite Local (Resiliente)"

        return {
            "saved": supabase_saved or sqlite_saved,
            "engine": engine,
            "document_id": document_id,
            "file_hash": file_hash,
            "total_risks_saved": len(risk_records),
            "total_clauses_saved": len(clause_records)
        }

    def list_contracts(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Obtiene los contratos auditados de Supabase o SQLite local."""
        if supabase:
            try:
                resp = supabase.table("documentos").select("*").order("fecha_carga", desc=True).limit(limit).execute()
                if resp.data:
                    return resp.data
            except Exception:
                pass

        # Fallback a SQLite
        try:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            rows = c.execute("SELECT * FROM documentos ORDER BY fecha_carga DESC LIMIT ?", (limit,)).fetchall()
            result = [dict(row) for row in rows]
            conn.close()
            return result
        except Exception as e:
            print(f"[ERROR] Error listando contratos en SQLite: {e}")
            return []

    def get_contract_details(self, document_id: str) -> Dict[str, Any]:
        """Obtiene el detalle completo de un contrato con sus cláusulas y riesgos."""
        if supabase:
            try:
                doc_resp = supabase.table("documentos").select("*").eq("id_documento", document_id).single().execute()
                risks_resp = supabase.table("analisis_riesgos").select("*").eq("id_documento", document_id).execute()
                clauses_resp = supabase.table("clausulas_extraidas").select("*").eq("id_documento", document_id).execute()
                if doc_resp.data:
                    return {
                        "documento": doc_resp.data,
                        "analisis_riesgos": risks_resp.data or [],
                        "clausulas": clauses_resp.data or []
                    }
            except Exception:
                pass

        # Fallback a SQLite
        try:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            doc_row = c.execute("SELECT * FROM documentos WHERE id_documento = ?", (document_id,)).fetchone()
            risk_rows = c.execute("SELECT * FROM analisis_riesgos WHERE id_documento = ?", (document_id,)).fetchall()
            clause_rows = c.execute("SELECT * FROM clausulas_extraidas WHERE id_documento = ?", (document_id,)).fetchall()
            conn.close()

            return {
                "documento": dict(doc_row) if doc_row else None,
                "analisis_riesgos": [dict(r) for r in risk_rows],
                "clausulas": [dict(cl) for cl in clause_rows]
            }
        except Exception as e:
            print(f"[ERROR] Error consultando contrato en SQLite: {e}")
            return {}

db_service = DatabaseAuditService()
