# services/ocr_service.py
import logging
import shutil
from io import BytesIO
from typing import Dict, Any, List

logger = logging.getLogger("audiflow.ocr")

class ScannedDocumentOCRError(ValueError):
    """Excepción emitida cuando un PDF es escaneado y el motor OCR no puede procesarlo."""
    pass

def check_ocr_capabilities() -> Dict[str, Any]:
    """
    Inspecciona y reporta el estado operativo del motor OCR en el entorno:
    - Librerías Python instaladas (pypdf, pdf2image, pytesseract, Pillow).
    - Binarios del sistema en el PATH (tesseract, pdftoppm/poppler).
    - Soporte de idiomas entrenados (incluyendo español 'spa').
    """
    # 1. Verificación de paquetes Python
    has_pypdf = False
    try:
        import pypdf
        has_pypdf = True
    except ImportError:
        pass

    has_pdf2image = False
    try:
        import pdf2image
        has_pdf2image = True
    except ImportError:
        pass

    has_pytesseract = False
    try:
        import pytesseract
        has_pytesseract = True
    except ImportError:
        pass

    has_pillow = False
    try:
        import PIL
        has_pillow = True
    except ImportError:
        pass

    # 2. Verificación de binarios de sistema
    tesseract_binary = shutil.which("tesseract")
    has_tesseract = tesseract_binary is not None

    poppler_binary = shutil.which("pdftoppm")
    has_poppler = poppler_binary is not None

    # 3. Idiomas de Tesseract disponibles
    available_langs: List[str] = []
    has_spanish = False
    if has_pytesseract and has_tesseract:
        try:
            import pytesseract
            available_langs = pytesseract.get_languages(config="")
            has_spanish = "spa" in available_langs
        except Exception as e:
            logger.debug(f"No se pudieron consultar idiomas de Tesseract: {e}")

    ocr_ready = (
        has_pypdf and 
        has_pdf2image and 
        has_pytesseract and 
        has_pillow and 
        has_tesseract and 
        has_poppler
    )

    return {
        "ocr_ready": ocr_ready,
        "python_packages": {
            "pypdf": has_pypdf,
            "pdf2image": has_pdf2image,
            "pytesseract": has_pytesseract,
            "pillow": has_pillow,
        },
        "system_binaries": {
            "tesseract": has_tesseract,
            "tesseract_path": tesseract_binary,
            "poppler_pdftoppm": has_poppler,
            "poppler_path": poppler_binary,
        },
        "languages": {
            "available": available_langs,
            "has_spanish": has_spanish,
        }
    }

def extract_text_hybrid(pdf_bytes: bytes, lang: str = "spa") -> str:
    """
    Extrae texto de un archivo PDF mediante estrategia híbrida:
    1. Intenta extracción directa vectorial de texto con pypdf (rápido y liviano).
    2. Para páginas sin texto vectorial (imágenes/escaneos), invoca OCR usando pdf2image y pytesseract.
    3. Si el documento carece totalmente de texto y no hay soporte OCR disponible,
       emite ScannedDocumentOCRError en lugar de propagar bytes binarios corruptos.
    """
    try:
        from pypdf import PdfReader
    except ImportError:
        raise RuntimeError("La librería 'pypdf' no está instalada. Ejecute: pip install pypdf")

    is_pdf_format = pdf_bytes.startswith(b"%PDF")
    extracted_pages: List[str] = []
    scanned_pages_indices: List[int] = []
    ocr_attempted_pages: List[int] = []
    ocr_successful_pages: List[int] = []

    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        total_pages = len(reader.pages)

        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            
            # Si la página no contiene texto vectorial, intentar OCR sobre esa página específica
            if not page_text.strip():
                scanned_pages_indices.append(idx + 1)
                try:
                    from pdf2image import convert_from_bytes
                    import pytesseract

                    ocr_attempted_pages.append(idx + 1)
                    images = convert_from_bytes(
                        pdf_bytes,
                        first_page=idx + 1,
                        last_page=idx + 1,
                        dpi=200
                    )
                    if images:
                        ocr_text = pytesseract.image_to_string(images[0], lang=lang)
                        if ocr_text.strip():
                            page_text = ocr_text
                            ocr_successful_pages.append(idx + 1)
                            logger.info(f"[OCR] Texto extraído con éxito de la página escaneada {idx + 1}")
                except Exception as ocr_err:
                    logger.warning(
                        f"[OCR] Página {idx + 1} no tiene capa vectorial y OCR no pudo ejecutarse: {ocr_err}"
                    )

            extracted_pages.append(page_text)

        result_text = "\n\n".join(extracted_pages).strip()
        if result_text:
            return result_text

        # Si tras evaluar todas las páginas no hay texto extraído:
        if is_pdf_format and total_pages > 0 and len(scanned_pages_indices) == total_pages:
            raise ScannedDocumentOCRError(
                f"El archivo PDF cargado ({total_pages} página(s)) está compuesto exclusivamente por imágenes escaneadas "
                "sin capa de texto digital seleccionable. No se pudo ejecutar OCR sobre las imágenes porque las dependencias "
                "del motor (Tesseract OCR y Poppler) no están instaladas en el servidor. Active el motor OCR o cargue un documento digitalizado."
            )

    except ScannedDocumentOCRError:
        raise
    except Exception as read_err:
        logger.warning(f"[PDF Reader] Error en procesamiento estructurado de páginas: {read_err}")

    # Fallback seguro: solo decodificar si NO es un PDF binario (ej. texto plano o markdown subido como bytes)
    if not is_pdf_format:
        try:
            return pdf_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return pdf_bytes.decode("latin-1", errors="ignore")

    raise ValueError("No se pudo extraer contenido textual del archivo PDF. Verifique que el documento no esté dañado ni protegido.")
