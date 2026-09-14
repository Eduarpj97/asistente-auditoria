import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import RedirectResponse
from services.ocr_service import extract_text_hybrid
from services.chunk_service import create_chunks
from services.risk_scoring_service import risk_engine
from schemas import (
    ProcessingResponse,
    RiskAssessmentResponse,
    EvaluateRiskRequest,
    RiskRuleInfo
)

app = FastAPI(
    title="Audiflow - Regulatory Risk Scoring & PDF Processing API",
    description="API de procesamiento de documentos legales y auditoría con motor de scoring de riesgos normativos (Semáforo Rojo/Amarillo/Verde).",
    version="1.1.0"
)

@app.get("/", include_in_schema=False)
async def redirect_to_docs():
    return RedirectResponse(url="/docs")

@app.post("/v1/process-pdf", response_model=ProcessingResponse, summary="Procesar PDF y evaluar riesgos normativos")
async def process_pdf(
    file: UploadFile = File(...),
    chunk_size: int = Form(500),
    chunk_overlap: int = Form(50),
    calculate_risk: bool = Form(True, description="Ejecutar motor de scoring de riesgos normativos sobre el contenido")
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Formato no soportado. Debe ser un PDF.")

    pdf_bytes = await file.read()
    raw_text = extract_text_hybrid(pdf_bytes)
    
    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="No se pudo extraer contenido del archivo.")

    chunks = create_chunks(raw_text, chunk_size, chunk_overlap)

    risk_assessment = None
    if calculate_risk:
        risk_assessment = risk_engine.assess_risk(chunks)

    return ProcessingResponse(
        filename=file.filename,
        total_characters=len(raw_text),
        total_chunks=len(chunks),
        chunks=chunks,
        risk_assessment=risk_assessment
    )

@app.post("/v1/evaluate-risk", response_model=RiskAssessmentResponse, summary="Evaluar riesgos normativos directamente sobre texto o chunks")
async def evaluate_risk(request: EvaluateRiskRequest):
    """
    Evalúa el perfil de riesgo normativo y genera el semáforo (ROJO, AMARILLO, VERDE)
    recibiendo texto libre o fragmentos pre-procesados.
    """
    if not request.text and not request.chunks:
        raise HTTPException(
            status_code=400,
            detail="Debe proporcionar al menos 'text' o 'chunks' para realizar la evaluación de riesgos."
        )

    content = request.chunks if request.chunks is not None else (request.text or "")
    assessment = risk_engine.assess_risk(content, filter_categories=request.categories)
    return assessment

@app.get("/v1/risk-rules", response_model=list[RiskRuleInfo], summary="Consultar catálogo de reglas normativas y ponderaciones")
async def get_risk_rules():
    """
    Retorna el catálogo activo de reglas normativas evaluadas por el motor,
    incluyendo severidad, ponderación e instrucciones de mitigación.
    """
    return risk_engine.get_rules_info()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)