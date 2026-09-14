from langchain_text_splitters import RecursiveCharacterTextSplitter

def create_chunks(
    text: str, 
    chunk_size: int = 500, 
    chunk_overlap: int = 50
) -> list[str]:
    # Divide respetando párrafos/oraciones y contando tokens de OpenAI (cl100k_base)
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        encoding_name="cl100k_base",
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.split_text(text)