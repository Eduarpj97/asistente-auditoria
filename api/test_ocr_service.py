import unittest
from io import BytesIO
from pypdf import PdfWriter
from services.ocr_service import check_ocr_capabilities, extract_text_hybrid, ScannedDocumentOCRError

class TestOCRService(unittest.TestCase):
    def test_check_ocr_capabilities_structure(self):
        """Valida que la introspección de capacidades OCR retorne la estructura esperada."""
        caps = check_ocr_capabilities()
        self.assertIsInstance(caps, dict)
        self.assertIn("ocr_ready", caps)
        self.assertIn("python_packages", caps)
        self.assertIn("system_binaries", caps)
        self.assertIn("languages", caps)

        # pypdf debe estar disponible como motor vectorial primario
        self.assertTrue(caps["python_packages"]["pypdf"])
        self.assertIn("tesseract", caps["system_binaries"])
        self.assertIn("poppler_pdftoppm", caps["system_binaries"])

    def test_extract_text_plain_text_fallback(self):
        """Valida que textos planos o payloads no binarios se procesen sin fallar."""
        sample_text = "CONTRATO DE PRESTACION DE SERVICIOS TECNOLOGICOS\nClausula 1: Objeto."
        pdf_bytes = sample_text.encode("utf-8")

        extracted = extract_text_hybrid(pdf_bytes)
        self.assertIn("CONTRATO DE PRESTACION DE SERVICIOS", extracted)
        self.assertIn("Clausula 1: Objeto", extracted)

    def test_scanned_pdf_without_text_raises_scanned_error(self):
        """
        Valida que un PDF estructurado sin capa vectorial de texto (escaneado)
        genere ScannedDocumentOCRError si el motor OCR no está configurado,
        en lugar de devolver basura binaria o silenciar el error.
        """
        writer = PdfWriter()
        writer.add_blank_page(width=612, height=792)
        buf = BytesIO()
        writer.write(buf)
        scanned_bytes = buf.getvalue()

        caps = check_ocr_capabilities()
        if not caps["ocr_ready"]:
            with self.assertRaises(ScannedDocumentOCRError) as ctx:
                extract_text_hybrid(scanned_bytes)
            self.assertIn("imágenes escaneadas sin capa de texto", str(ctx.exception))
        else:
            try:
                res = extract_text_hybrid(scanned_bytes)
                self.assertIsInstance(res, str)
            except (ScannedDocumentOCRError, ValueError):
                pass

if __name__ == "__main__":
    unittest.main()
