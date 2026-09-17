# services/chunk_service.py
import re
from typing import List

def _native_fallback_split(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    """División resiliente nativa en fragmentos si no está disponible langchain."""
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current_chunk = []
    current_len = 0
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        para_len = len(para)
        if current_len + para_len > chunk_size and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            # Mantener solapamiento
            overlap_text = current_chunk[-1] if current_chunk else ""
            current_chunk = [overlap_text, para] if len(overlap_text) < chunk_size else [para]
            current_len = sum(len(p) for p in current_chunk)
        else:
            current_chunk.append(para)
            current_len += para_len
            
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
        
    return chunks if chunks else [text]

def create_chunks(
    text: str, 
    chunk_size: int = 500, 
    chunk_overlap: int = 50
) -> list[str]:
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            encoding_name="cl100k_base",
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        return splitter.split_text(text)
    except Exception:
        # Fallback nativo
        return _native_fallback_split(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)