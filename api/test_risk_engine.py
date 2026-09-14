# test_risk_engine.py
import unittest
from io import BytesIO
from fastapi.testclient import TestClient
from main import app
from services.risk_scoring_service import risk_engine, RegulatoryCategory, TrafficLightColor, RiskSeverity

client = TestClient(app)

COMPLIANT_CONTRACT_TEXT = """
CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

CLÁUSULA PRIMERA - CONFIDENCIALIDAD Y SEGURIDAD DE LA INFORMACIÓN:
Las partes se obligan a mantener estricta reserva sobre toda la información confidencial y secreto comercial 
a la que tengan acceso en desarrollo del contrato, implementando medidas de seguridad de la información adecuadas.

CLÁUSULA SEGUNDA - PROTECCIÓN DE DATOS PERSONALES (HABEAS DATA):
En cumplimiento del marco legal de protección de datos personales y la Ley 1581 de 2012, el titular de los datos 
autoriza el tratamiento de datos para los fines estrictamente contractuales. Las partes garantizan el ejercicio de los derechos ARCO.

CLÁUSULA TERCERA - PREVENCIÓN DE LAVADO DE ACTIVOS (AML/CFT):
Las partes declaran bajo la gravedad de juramento que sus recursos provienen de origen lícito y no provienen de 
lavado de activos ni financiación del terrorismo. Asimismo, autorizan la verificación periódica en listas restrictivas y OFAC 
conforme al sistema SARLAFT / SAGRILAFT.

CLÁUSULA CUARTA - ANTICORRUPCIÓN Y CÓDIGO DE ÉTICA:
Las partes se comprometen a actuar bajo principios de ética y cero tolerancia al soborno y a la corrupción, prohibiendo expresamente 
cualquier soborno, dádiva o pagos de facilitación, conforme a los estándares anticorrupción y directrices FCPA.

CLÁUSULA QUINTA - RESPONSABILIDAD:
Cada parte responderá por los perjuicios directos causados por el incumplimiento de sus obligaciones contractuales.
"""

MEDIUM_RISK_TEXT = """
ACUERDO GENERAL DE COLABORACIÓN

CLÁUSULA DE INFORMACIÓN:
Se mantendrá la confidencialidad básica de los documentos compartidos.
Asimismo, en materia de datos personales, el titular autoriza el tratamiento, pero no habrá derecho a solicitar 
la supresión de datos ni revocar la autorización mientras subsista el contrato.

CLÁUSULA DE ÉTICA:
Se respetarán las normas de anticorrupción y antisoborno aplicables.
Las partes declaran el origen de fondos y prevención de lavado de activos.
"""

HIGH_RISK_TEXT = """
CONTRATO PRIVADO DE SUMINISTRO

CLÁUSULA ESPECIAL DE PAGOS:
Se autorizan pagos en efectivo sin factura ni soporte bancario a cuentas anónimas o terceros designados verbalmente.

CLÁUSULA DE RESPONSABILIDAD:
El contratante gozará de total exoneración por dolo o culpa grave y no habrá responsabilidad aún por incumplimiento grave.

CLÁUSULA DE DATOS:
La empresa podrá transferir libremente a terceros sin restricción la información personal recolectada.
"""

def generate_minimal_pdf(text: str) -> bytes:
    """Genera un archivo PDF válido en memoria con texto embebido."""
    escaped_text = text.replace("(", "\\(").replace(")", "\\)")
    pdf_template = (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj << /Length " + str(len(escaped_text) + 40).encode("latin1") + b" >> stream\n"
        b"BT\n"
        b"/F1 12 Tf\n"
        b"50 700 Td\n"
        b"(" + escaped_text.encode("latin1", errors="ignore") + b") Tj\n"
        b"ET\n"
        b"endstream\n"
        b"endobj\n"
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"xref\n"
        b"0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000244 00000 n \n"
        b"0000000350 00000 n \n"
        b"trailer << /Size 6 /Root 1 0 R >>\n"
        b"startxref\n"
        b"430\n"
        b"%%EOF"
    )
    return pdf_template


class TestRiskEngine(unittest.TestCase):

    def test_engine_green_compliant_text(self):
        """Texto conforme debe arrojar Semáforo VERDE y puntaje bajo (< 30)."""
        assessment = risk_engine.assess_risk(COMPLIANT_CONTRACT_TEXT)
        self.assertEqual(assessment.traffic_light, TrafficLightColor.VERDE)
        self.assertLess(assessment.global_score, 30.0)
        self.assertEqual(assessment.findings_summary["ALTO"], 0)
        self.assertTrue(
            "CONFORME" in assessment.executive_summary or "CUMPLIMIENTO" in assessment.executive_summary
        )

    def test_engine_red_high_risk_text(self):
        """Texto con contingencias críticas debe arrojar Semáforo ROJO y score >= 70."""
        assessment = risk_engine.assess_risk(HIGH_RISK_TEXT)
        self.assertEqual(assessment.traffic_light, TrafficLightColor.ROJO)
        self.assertGreaterEqual(assessment.global_score, 70.0)
        self.assertGreater(assessment.findings_summary["ALTO"], 0)
        self.assertGreater(len(assessment.findings), 0)
        snippets = [f.matched_snippet for f in assessment.findings if f.matched_snippet is not None]
        self.assertGreater(len(snippets), 0)
        self.assertTrue(any("..." in s for s in snippets))

    def test_engine_yellow_medium_risk_text(self):
        """Texto con restricciones pero sin delitos graves debe arrojar Semáforo AMARILLO/ROJO según filtro."""
        assessment = risk_engine.assess_risk(
            MEDIUM_RISK_TEXT,
            filter_categories=[RegulatoryCategory.PROTECCION_DATOS, RegulatoryCategory.SEGURIDAD_INFORMACION]
        )
        self.assertIn(assessment.traffic_light, [TrafficLightColor.AMARILLO, TrafficLightColor.ROJO])
        rule_ids = [f.rule_id for f in assessment.findings]
        self.assertTrue("PRIV_003" in rule_ids or "PRIV_001" in rule_ids)

    def test_engine_category_filtering(self):
        """Verifica que el filtro de categorías regulatorias limite las reglas evaluadas."""
        assessment = risk_engine.assess_risk(
            HIGH_RISK_TEXT,
            filter_categories=[RegulatoryCategory.AML_CFT]
        )
        for finding in assessment.findings:
            self.assertEqual(finding.category, RegulatoryCategory.AML_CFT)

    def test_engine_empty_input(self):
        """Un texto vacío debe evaluar omisiones obligatorias y no arrojar excepciones."""
        assessment = risk_engine.assess_risk("")
        self.assertGreater(assessment.global_score, 0)
        self.assertEqual(assessment.traffic_light, TrafficLightColor.ROJO)


class TestRiskAPIEndpoints(unittest.TestCase):

    def test_api_evaluate_risk_compliant(self):
        """Prueba del endpoint /v1/evaluate-risk con texto conforme."""
        response = client.post(
            "/v1/evaluate-risk",
            json={"text": COMPLIANT_CONTRACT_TEXT}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["traffic_light"], "VERDE")
        self.assertLess(data["global_score"], 30.0)
        self.assertIn("category_breakdown", data)
        self.assertGreater(len(data["category_breakdown"]), 0)

    def test_api_evaluate_risk_critical(self):
        """Prueba del endpoint /v1/evaluate-risk con texto de alto riesgo."""
        response = client.post(
            "/v1/evaluate-risk",
            json={"text": HIGH_RISK_TEXT}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["traffic_light"], "ROJO")
        self.assertGreaterEqual(data["global_score"], 70.0)
        self.assertGreaterEqual(data["findings_summary"]["ALTO"], 1)

    def test_api_evaluate_risk_chunks(self):
        """Prueba del endpoint /v1/evaluate-risk enviando una lista de chunks."""
        chunks = [
            "Primer segmento con cláusula de confidencialidad y secreto comercial.",
            "Segundo segmento con autorización de datos personales y habeas data.",
            "Tercer segmento con prevención de lavado de activos y origen lícito sarlaft.",
            "Cuarto segmento con anticorrupción, ética y cero tolerancia al soborno."
        ]
        response = client.post(
            "/v1/evaluate-risk",
            json={"chunks": chunks}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["traffic_light"], "VERDE")

    def test_api_evaluate_risk_empty_validation(self):
        """Prueba que el endpoint rechace solicitudes sin 'text' ni 'chunks'."""
        response = client.post(
            "/v1/evaluate-risk",
            json={}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Debe proporcionar al menos 'text' o 'chunks'", response.json()["detail"])

    def test_api_get_risk_rules(self):
        """Prueba del endpoint /v1/risk-rules para consultar el catálogo normativo."""
        response = client.get("/v1/risk-rules")
        self.assertEqual(response.status_code, 200)
        rules = response.json()
        self.assertIsInstance(rules, list)
        self.assertGreaterEqual(len(rules), 10)
        first_rule = rules[0]
        self.assertIn("rule_id", first_rule)
        self.assertIn("category", first_rule)
        self.assertIn("severity", first_rule)
        self.assertIn("weight", first_rule)
        self.assertIn("remediation", first_rule)

    def test_api_process_pdf_with_risk_scoring(self):
        """Prueba end-to-end de /v1/process-pdf con evaluación de riesgo activada."""
        pdf_bytes = generate_minimal_pdf("Proteccion de datos personales y confidencialidad")
        response = client.post(
            "/v1/process-pdf",
            files={"file": ("contrato_test.pdf", pdf_bytes, "application/pdf")},
            data={"chunk_size": 200, "chunk_overlap": 20, "calculate_risk": "true"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["filename"], "contrato_test.pdf")
        self.assertIn("risk_assessment", data)
        self.assertIsNotNone(data["risk_assessment"])
        self.assertIn(data["risk_assessment"]["traffic_light"], ["VERDE", "AMARILLO", "ROJO"])

    def test_api_process_pdf_without_risk_scoring(self):
        """Prueba de /v1/process-pdf con calculate_risk=False."""
        pdf_bytes = generate_minimal_pdf("Solo procesamiento de texto plano sin scoring")
        response = client.post(
            "/v1/process-pdf",
            files={"file": ("test_sin_riesgo.pdf", pdf_bytes, "application/pdf")},
            data={"chunk_size": 200, "chunk_overlap": 20, "calculate_risk": "false"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsNone(data["risk_assessment"])


if __name__ == "__main__":
    unittest.main()
