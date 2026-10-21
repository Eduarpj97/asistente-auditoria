import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.services.llm_audit_service import llm_service


class TestLLMAuditUnit:
    """Pruebas unitarias para el motor de auditoría de contratos e IA."""

    def test_typology_detection_arrendamiento(self):
        """Verifica la clasificación heurística para contratos de arrendamiento."""
        text = "CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL. El arrendador entrega el inmueble al arrendatario por un canon de $2.000.000."
        tipo, expl = llm_service.detect_typology_heuristic(text)
        assert tipo == "Contrato de Arrendamiento"
        assert "arrendador" in expl.lower() or "canon" in expl.lower()

    def test_typology_detection_laboral(self):
        """Verifica la clasificación heurística para contratos individuales de trabajo."""
        text = "CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO FIJO. El empleador contrata al trabajador bajo continua subordinación con salario mensual."
        tipo, expl = llm_service.detect_typology_heuristic(text)
        assert tipo == "Contrato Individual de Trabajo"
        assert "subordinación" in expl.lower() or "laboral" in expl.lower()

    def test_typology_detection_prestacion_servicios(self):
        """Verifica la clasificación para prestación de servicios con autonomía técnica."""
        text = "CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES. El contratista actuará con total autonomía técnica a cambio de honorarios."
        tipo, expl = llm_service.detect_typology_heuristic(text)
        assert tipo == "Contrato de Prestación de Servicios"
        assert "honorarios" in expl.lower() or "autonomía" in expl.lower()

    def test_typology_detection_nda(self):
        """Verifica la clasificación para acuerdos de confidencialidad."""
        text = "NON-DISCLOSURE AGREEMENT (NDA). ACUERDO DE CONFIDENCIALIDAD Y NO DIVULGACIÓN DE SECRETOS INDUSTRIALES."
        tipo, expl = llm_service.detect_typology_heuristic(text)
        assert tipo == "Acuerdo de Confidencialidad (NDA)"
        assert "confidencial" in expl.lower() or "proteger" in expl.lower()

    def test_anti_hallucination_harness_discards_fabricated_clauses(self):
        """
        Verifica que el arnés anti-alucinaciones descarte cualquier cláusula crítica
        cuya cita textual NO exista en el documento original.
        """
        contract_text = (
            "El contratista pagará una penalidad del 30% por cada día de mora en la entrega final del servicio."
        )

        mock_llm_output = {
            "score_riesgo_ia": 85,
            "nivel_riesgo_ia": "ALTO",
            "clausulas_criticas": [
                {
                    "tipo": "Penalidad",
                    "cita_textual": "penalidad del 30% por cada día de mora",
                    "explicacion_riesgo": "Penalidad excesiva por mora."
                },
                {
                    "tipo": "Confiscación Ilegal",
                    "cita_textual": "la empresa confiscará todos los bienes personales sin orden judicial",
                    "explicacion_riesgo": "Cláusula alucinada por el modelo."
                }
            ]
        }

        harnessed = llm_service.apply_anti_hallucination_harness(mock_llm_output, contract_text)

        # Solo debe sobrevivir la cláusula real presente en el texto
        assert len(harnessed["clausulas_criticas"]) == 1
        assert harnessed["clausulas_criticas"][0]["tipo"] == "Penalidad"

    def test_anti_hallucination_harness_normalizes_risk_score_on_clean_docs(self):
        """
        Verifica que si todas las cláusulas fueron alucinadas (o el doc está limpio),
        el índice de riesgo de la IA se normalice automáticamente a un nivel bajo.
        """
        contract_text = "Acuerdo de cooperación mutua sin penalidades ni sanciones."

        mock_llm_output = {
            "score_riesgo_ia": 90,
            "nivel_riesgo_ia": "CRÍTICO",
            "clausulas_criticas": [
                {
                    "tipo": "Sanción Fantasma",
                    "cita_textual": "el usuario pagará un millón de dólares de indemnización inmediata"
                }
            ]
        }

        harnessed = llm_service.apply_anti_hallucination_harness(mock_llm_output, contract_text)

        assert len(harnessed["clausulas_criticas"]) == 0
        assert harnessed["score_riesgo_ia"] <= 20
        assert harnessed["nivel_riesgo_ia"] == "BAJO"

    def test_resilient_json_parsing_with_truncated_response(self):
        """Verifica que el parser sea tolerante a truncamientos de red o de tokens."""
        truncated_json = '{"tipologia_contrato": "Contrato de Arrendamiento", "score_riesgo_ia": 45, "resumen_ejecutivo": "Arrendamiento de bien inmueble'
        result = llm_service._parse_json_resilient(truncated_json, "contrato de arrendamiento de local")

        assert isinstance(result, dict)
        assert result.get("score_riesgo_ia") == 45 or "Arrendamiento" in result.get("tipologia_contrato", "")
