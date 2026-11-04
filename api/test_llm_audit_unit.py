import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from services.llm_audit_service import llm_service
except ImportError:
    from api.services.llm_audit_service import llm_service


class TestLLMAuditUnit(unittest.TestCase):
    """Pruebas unitarias para el motor de auditoría de contratos e IA con Arnés 2.0."""

    def test_typology_detection_arrendamiento(self):
        """Verifica la clasificación heurística para contratos de arrendamiento."""
        text = "CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL. El arrendador entrega el inmueble al arrendatario por un canon de $2.000.000."
        tipo, expl = llm_service.detect_typology_heuristic(text)
        self.assertEqual(tipo, "Contrato de Arrendamiento")
        self.assertTrue("arrendador" in expl.lower() or "canon" in expl.lower())

    def test_typology_detection_laboral(self):
        """Verifica la clasificación heurística para contratos individuales de trabajo."""
        text = "CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO FIJO. El empleador contrata al trabajador bajo continua subordinación con salario mensual."
        tipo, expl = llm_service.detect_typology_heuristic(text)
        self.assertEqual(tipo, "Contrato Individual de Trabajo")
        self.assertTrue("subordinación" in expl.lower() or "laboral" in expl.lower())

    def test_typology_detection_prestacion_servicios(self):
        """Verifica la clasificación para prestación de servicios con autonomía técnica."""
        text = "CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES. El contratista actuará con total autonomía técnica a cambio de honorarios."
        tipo, expl = llm_service.detect_typology_heuristic(text)
        self.assertEqual(tipo, "Contrato de Prestación de Servicios")
        self.assertTrue("honorarios" in expl.lower() or "autonomía" in expl.lower())

    def test_typology_detection_nda(self):
        """Verifica la clasificación para acuerdos de confidencialidad."""
        text = "NON-DISCLOSURE AGREEMENT (NDA). ACUERDO DE CONFIDENCIALIDAD Y NO DIVULGACIÓN DE SECRETOS INDUSTRIALES."
        tipo, expl = llm_service.detect_typology_heuristic(text)
        self.assertEqual(tipo, "Acuerdo de Confidencialidad (NDA)")
        self.assertTrue("confidencial" in expl.lower() or "proteger" in expl.lower())

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
        self.assertEqual(len(harnessed["clausulas_criticas"]), 1)
        self.assertEqual(harnessed["clausulas_criticas"][0]["tipo"], "Penalidad")
        self.assertEqual(harnessed["clausulas_criticas"][0]["estado_arnes"], "VERIFICADO_LITERAL")

    def test_anti_hallucination_harness_rejects_partial_hallucination_with_4_matching_words(self):
        """
        Prueba clave del Arnés 2.0:
        Verifica que una cita extensa inventada que solo coincide en 4 palabras comunes
        sea RECHAZADA por baja cobertura (< 65%), corrigiendo la debilidad del arnés anterior.
        """
        contract_text = (
            "El contratista entregará los informes mensuales en Bogotá al cliente durante los primeros cinco días de cada mes."
        )

        # Cita inventada por el LLM: inventa una multa gigantesca, pero contiene "en Bogotá al cliente durante los" (5 palabras reales)
        mock_llm_output = {
            "score_riesgo_ia": 95,
            "nivel_riesgo_ia": "CRÍTICO",
            "clausulas_criticas": [
                {
                    "tipo": "Penalidad",
                    "cita_textual": "el contratista pagará una multa de quinientos millones de pesos en Bogotá al cliente durante los próximos diez años",
                    "explicacion_riesgo": "Multa millonaria alucinada por la IA."
                }
            ]
        }

        harnessed = llm_service.apply_anti_hallucination_harness(mock_llm_output, contract_text)

        # Debe ser DESCARTADA porque la cobertura de la cita es muy baja (< 65%)
        self.assertEqual(len(harnessed["clausulas_criticas"]), 0)
        self.assertLessEqual(harnessed["score_riesgo_ia"], 20)
        self.assertEqual(harnessed["nivel_riesgo_ia"], "BAJO")

    def test_anti_hallucination_harness_rejects_incoherent_legal_category(self):
        """
        Prueba clave del Arnés 2.0:
        Verifica que una cita 100% literal sea RECHAZADA si la conclusión jurídica
        es incongruente con el contenido de la cita (falta de fundamentación).
        """
        contract_text = (
            "Las partes celebrarán reuniones mensuales ordinarias para revisar el avance de los informes técnicos."
        )

        # Cita literal exacta, pero la conclusión jurídica es un disparate (Penalidad Grave)
        mock_llm_output = {
            "score_riesgo_ia": 80,
            "nivel_riesgo_ia": "ALTO",
            "clausulas_criticas": [
                {
                    "tipo": "Penalidad Grave",
                    "cita_textual": "Las partes celebrarán reuniones mensuales ordinarias",
                    "explicacion_riesgo": "Esta cláusula impone sanciones y multas desproporcionadas."
                }
            ]
        }

        harnessed = llm_service.apply_anti_hallucination_harness(mock_llm_output, contract_text)

        # Debe ser descartada por incongruencia jurídica (reuniones no sustentan una penalidad)
        self.assertEqual(len(harnessed["clausulas_criticas"]), 0)

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

        self.assertEqual(len(harnessed["clausulas_criticas"]), 0)
        self.assertLessEqual(harnessed["score_riesgo_ia"], 20)
        self.assertEqual(harnessed["nivel_riesgo_ia"], "BAJO")

    def test_resilient_json_parsing_with_truncated_response(self):
        """Verifica que el parser sea tolerante a truncamientos de red o de tokens."""
        truncated_json = '{"tipologia_contrato": "Contrato de Arrendamiento", "score_riesgo_ia": 45, "resumen_ejecutivo": "Arrendamiento de bien inmueble'
        result = llm_service._parse_json_resilient(truncated_json, "contrato de arrendamiento de local")

        self.assertIsInstance(result, dict)
        self.assertTrue(result.get("score_riesgo_ia") == 45 or "Arrendamiento" in result.get("tipologia_contrato", ""))


if __name__ == "__main__":
    unittest.main()
