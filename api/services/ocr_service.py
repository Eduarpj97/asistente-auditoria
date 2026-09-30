# services/ocr_service.py
from io import BytesIO

def extract_text_hybrid(pdf_bytes: bytes, lang: str = "spa") -> str:
    """
    Extrae texto de un archivo PDF.
    Usa pypdf por defecto para texto vectorial, y si una página viene vacía o escaneada,
    intenta aplicar OCR con pdf2image y pytesseract si están disponibles.
    """
    try:
        from pypdf import PdfReader
    except ImportError:
        raise RuntimeError("La librería 'pypdf' no está instalada. Ejecute: pip install pypdf")

    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        extracted_pages = []

        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            
            # Si la página no tiene texto extraíble, intentar aplicar OCR a esa página
            if not text.strip():
                try:
                    from pdf2image import convert_from_bytes
                    import pytesseract
                    images = convert_from_bytes(
                        pdf_bytes, 
                        first_page=idx + 1, 
                        last_page=idx + 1
                    )
                    if images:
                        text = pytesseract.image_to_string(images[0], lang=lang)
                except Exception:
                    # Si no está instalado poppler o tesseract, continuar con el texto disponible
                    pass

            extracted_pages.append(text)

        result_text = "\n\n".join(extracted_pages)
        if result_text.strip():
            return result_text
    except Exception:
        pass

    # Fallback seguro: Si no es un PDF binario o es texto plano
    try:
        return pdf_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return pdf_bytes.decode("latin-1", errors="ignore")