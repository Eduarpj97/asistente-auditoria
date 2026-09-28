import uuid
import hashlib
from typing import Dict, Any, List, Optional
from database import supabase

class DatabaseAuditService:
    """
    Servicio de persistencia en Supabase para documentos, fragmentos OCR,
    cláusulas detectadas y análisis de riesgos normativos.
    """

    @staticmethod
    def calculate_sha256(file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

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
        Persiste los resultados completos de la auditoría en Supabase.
        """
        if not supabase:
            return {"saved": False, "error": "Supabase client not initialized"}

        document_id = str(uuid.uuid4())
        file_hash = self.calculate_sha256(file_bytes)

        # 1. Guardar metadatos en tabla 'documentos'
        doc_record = {
            "id_documento": document_id,
            "nombre_original": filename,
            "hash_sha256": file_hash,
            "ruta_almacenamiento_seguro": f"audits/{document_id}/{filename}",
            "tamano_bytes": len(file_bytes),
            "tipo_mime": "application/pdf",
            "tipo_contrato": "Licencia_Software",
            "estado_procesamiento": "Auditado"
        }

        try:
            supabase.table("documentos").insert(doc_record).execute()
        except Exception as e:
            return {"saved": False, "error": f"Error insertando en 'documentos': {str(e)}"}

        # 2. Guardar fragmentos / chunks en tabla 'texto_ocr' (primeros 50 para optimizar)
        try:
            ocr_records = []
            for idx, chunk in enumerate(chunks[:50]):
                ocr_records.append({
                    "id_ocr": str(uuid.uuid4()),
                    "id_documento": document_id,
                    "num_pagina": idx + 1,
                    "contenido_texto": chunk,
                    "confianza_ocr": 99.0
                })
            if ocr_records:
                supabase.table("texto_ocr").insert(ocr_records).execute()
        except Exception as e:
            print(f"[WARNING] No se pudieron insertar fragmentos OCR: {e}")

        # 3. Guardar cláusulas críticas en 'clausulas_extraidas' si existen en LLM
        clause_id_map: Dict[str, str] = {}
        if llm_assessment and isinstance(llm_assessment, dict):
            ia_result = llm_assessment.get("resultado_ia", {})
            critical_clauses = ia_result.get("clausulas_criticas", [])
            for c in critical_clauses:
                clause_id = str(uuid.uuid4())
                c_type = str(c.get("tipo", "General"))[:80]
                c_text = str(c.get("cita_textual", c.get("explicacion_riesgo", "Sin texto")))
                clause_id_map[c_type] = clause_id
                try:
                    supabase.table("clausulas_extraidas").insert({
                        "id_clausula": clause_id,
                        "id_documento": document_id,
                        "tipo_clausula": c_type,
                        "texto_clausula": c_text
                    }).execute()
                except Exception as e:
                    print(f"[WARNING] Error insertando cláusula: {e}")

        # 4. Guardar hallazgos en 'analisis_riesgos'
        risk_records = []

        # Hallazgos de motor de reglas normativas
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

                severity_map = {
                    "ALTO": "Alto",
                    "MEDIO": "Medio",
                    "BAJO": "Bajo",
                    "CRITICO": "Critico"
                }
                mapped_sev = severity_map.get(str(f_severity).upper(), "Medio")

                risk_records.append({
                    "id_riesgo": str(uuid.uuid4()),
                    "id_documento": document_id,
                    "nivel_riesgo": mapped_sev,
                    "categoria_cumplimiento": str(f_category)[:100],
                    "titulo_hallazgo": str(f_title)[:200],
                    "descripcion_riesgo": str(f_desc),
                    "recomendacion_mitigacion": str(f_remediation),
                    "es_incumplimiento": True if mapped_sev in ["Alto", "Critico"] else False
                })

        # Insertar los riesgos
        if risk_records:
            try:
                supabase.table("analisis_riesgos").insert(risk_records).execute()
            except Exception as e:
                print(f"[WARNING] Error insertando en 'analisis_riesgos': {e}")

        return {
            "saved": True,
            "document_id": document_id,
            "file_hash": file_hash,
            "total_risks_saved": len(risk_records)
        }

    def list_contracts(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Obtiene la lista de los últimos contratos auditados guardados en Supabase."""
        if not supabase:
            return []
        try:
            resp = supabase.table("documentos").select("*").order("fecha_carga", desc=True).limit(limit).execute()
            return resp.data or []
        except Exception as e:
            print(f"[ERROR] Error listando contratos: {e}")
            return []

    def get_contract_details(self, document_id: str) -> Dict[str, Any]:
        """Obtiene el detalle completo de un contrato con sus cláusulas y riesgos."""
        if not supabase:
            return {}
        try:
            doc_resp = supabase.table("documentos").select("*").eq("id_documento", document_id).single().execute()
            risks_resp = supabase.table("analisis_riesgos").select("*").eq("id_documento", document_id).execute()
            clauses_resp = supabase.table("clausulas_extraidas").select("*").eq("id_documento", document_id).execute()

            return {
                "documento": doc_resp.data,
                "analisis_riesgos": risks_resp.data or [],
                "clausulas": clauses_resp.data or []
            }
        except Exception as e:
            print(f"[ERROR] Error consultando contrato {document_id}: {e}")
            return {}

db_service = DatabaseAuditService()
