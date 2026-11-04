import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from services.risk_scoring_service import risk_engine, REGULATORY_RULES_CATALOG
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)


class TestRegulatoryProvenance(unittest.TestCase):
    """
    Suite de verificación de procedencia legal, jurisdicción,
    organismos emisores y vigencia normativa 2026.
    """

    def test_all_catalog_rules_have_complete_provenance(self):
        """Verifica que el 100% de las 14 reglas cuenten con su Ficha Técnica Jurídica completa."""
        rules = risk_engine.get_rules_info()
        self.assertGreaterEqual(len(rules), 14, "Deben existir al menos 14 directrices normativas en el catálogo.")

        for r in rules:
            self.assertTrue(r.rule_id, "Cada regla debe tener rule_id")
            self.assertTrue(r.title, f"Regla {r.rule_id} sin título")
            self.assertTrue(r.normative_reference, f"Regla {r.rule_id} sin referencia normativa")
            self.assertTrue(r.issuing_body, f"Regla {r.rule_id} sin organismo emisor")
            self.assertTrue(r.jurisdiction, f"Regla {r.rule_id} sin jurisdicción")
            self.assertTrue(r.official_source, f"Regla {r.rule_id} sin fuente oficial o gaceta")
            self.assertEqual(r.normative_status, "VIGENTE", f"Regla {r.rule_id} debe estar VIGENTE")
            self.assertEqual(r.last_reviewed, "2026-10-15", f"Regla {r.rule_id} debe estar revisada a 2026")
            self.assertTrue(r.applicability_criteria, f"Regla {r.rule_id} sin criterio de aplicabilidad al contrato")
            self.assertTrue(r.official_url and r.official_url.startswith("http"), f"Regla {r.rule_id} sin URL oficial válida")

    def test_specific_regulatory_regimes_present(self):
        """Verifica la cobertura estricta de los estatutos exigidos: RGPD, Habeas Data, SARLAFT, FCPA e ISO 27001."""
        rules_by_id = {r.rule_id: r for r in risk_engine.get_rules_info()}

        # 1. Protección de Datos / Habeas Data (Colombia Ley 1581)
        priv1 = rules_by_id.get("PRIV_001")
        self.assertIsNotNone(priv1)
        self.assertIn("1581", priv1.official_source)
        self.assertIn("Colombia", priv1.jurisdiction)
        self.assertIn("SIC", priv1.issuing_body)

        # 2. RGPD Unión Europea (Extraterritorial)
        priv2 = rules_by_id.get("PRIV_002")
        self.assertIsNotNone(priv2)
        self.assertIn("2016/679", priv2.official_source)
        self.assertIn("Unión Europea", priv2.jurisdiction)
        self.assertIn("Parlamento Europeo", priv2.issuing_body)

        # 3. SARLAFT / SAGRILAFT (Lavado de Activos)
        aml1 = rules_by_id.get("AML_001")
        self.assertIsNotNone(aml1)
        self.assertTrue("SAGRILAFT" in aml1.official_source or "SARLAFT" in aml1.official_source)
        self.assertIn("Superintendencia", aml1.issuing_body)

        # 4. FCPA (Anticorrupción EE.UU. / Transnacional)
        corr1 = rules_by_id.get("CORR_001")
        self.assertIsNotNone(corr1)
        self.assertIn("FCPA", corr1.official_source)
        self.assertIn("Estados Unidos", corr1.jurisdiction)

        # 5. ISO 27001:2022 (Seguridad de la Información)
        sec1 = rules_by_id.get("SEC_001")
        self.assertIsNotNone(sec1)
        self.assertIn("27001:2022", sec1.official_source)
        self.assertIn("ISO", sec1.issuing_body)

    def test_risk_findings_propagate_provenance_metadata(self):
        """Verifica que al evaluar un texto contractual, los hallazgos incluyan toda la metadata de procedencia."""
        sample_contract = (
            "Contrato comercial simple sin mención de tratamiento de datos personales, "
            "sin cláusula de prevención de lavado de activos y con facultad de entregar dádivas y comisiones ocultas."
        )
        assessment = risk_engine.assess_risk(sample_contract)
        self.assertGreater(len(assessment.findings), 0)

        for finding in assessment.findings:
            self.assertTrue(finding.issuing_body)
            self.assertTrue(finding.jurisdiction)
            self.assertTrue(finding.official_source)
            self.assertEqual(finding.normative_status, "VIGENTE")
            self.assertEqual(finding.last_reviewed, "2026-10-15")
            self.assertTrue(finding.applicability_criteria)

    def test_api_regulatory_catalog_endpoints(self):
        """Verifica que los endpoints REST expongan la matriz completa y unitaria de gobernanza."""
        resp = client.get("/v1/regulatory/catalog")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 14)

        first_rule = data[0]
        self.assertIn("issuing_body", first_rule)
        self.assertIn("jurisdiction", first_rule)
        self.assertIn("official_source", first_rule)
        self.assertIn("last_reviewed", first_rule)
        self.assertIn("applicability_criteria", first_rule)

        # Prueba unitaria de detalle por ID
        rule_resp = client.get(f"/v1/regulatory/catalog/{first_rule['rule_id']}")
        self.assertEqual(rule_resp.status_code, 200)
        self.assertEqual(rule_resp.json()["rule_id"], first_rule["rule_id"])

        # Prueba 404 para regla inexistente
        not_found = client.get("/v1/regulatory/catalog/REGLA_INVENTADA_999")
        self.assertEqual(not_found.status_code, 404)


if __name__ == "__main__":
    unittest.main()
