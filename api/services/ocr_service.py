from io import BytesIO
from pypdf import PdfReader
from pdf2image import convert_from_bytes
import pytesseract

def extract_text_hybrid(pdf_bytes: bytes, lang: str = "spa") -> str:
    reader = PdfReader(BytesIO(pdf_bytes))
    extracted_pages = []

    for idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        
        # Si la página no tiene texto extraíble, aplicar OCR a esa página específica
        if not text.strip():
            images = convert_from_bytes(
                pdf_bytes, 
                first_page=idx + 1, 
                last_page=idx + 1
            )
            if images:
                text = pytesseract.image_to_string(images[0], lang=lang)

        extracted_pages.append(text)

    return "\n\n".join(extracted_pages)