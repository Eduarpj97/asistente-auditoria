import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from services.ocr_service import extract_text_hybrid
from services.chunk_service import create_chunks
from services.risk_scoring_service import risk_engine
from services.llm_audit_service import llm_service
from schemas import (
    ProcessingResponse,
    RiskAssessmentResponse,
    EvaluateRiskRequest,
    RiskRuleInfo
)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

app = FastAPI(
    title="Audiflow - Regulatory Risk Scoring & AI Contract Audit API",
    description="Plataforma de auditoría inteligente de contratos. Combina motor de scoring normativo determinístico e inferencia semántica con Llama 3.1 en Oracle Cloud.",
    version="1.2.0"
)

# Permitir CORS para cualquier cliente frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", summary="Dashboard Web de Audiflow")
async def serve_dashboard():
    """Servir el panel visual interactivo de Audiflow."""
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return RedirectResponse(url="/docs")

@app.get("/v1/health", summary="Estado del sistema y conectividad con la VPS de Ollama")
async def health_check():
    """
    Retorna el estado de salud de la API y la conectividad en tiempo real
    con el servicio de inferencia Llama 3.1 en la VPS de Oracle Cloud.
    """
    ollama_status = llm_service.check_health()
    return {
        "api_status": "ONLINE",
        "service": "Audiflow API",
        "version": "1.2.0",
        "ollama_engine": ollama_status
    }

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

@app.post("/v1/audit-contract-ai", summary="Auditoría híbrida avanzada (Reglas Normativas + IA Llama 3.1)")
async def audit_contract_ai(
    file: UploadFile = File(...),
    use_llm: bool = Form(True, description="Incluir análisis semántico profundo con Llama 3.1")
):
    """
    Endpoint insignia de Audiflow:
    1. Extrae el texto del contrato en PDF.
    2. Ejecuta el motor de scoring de 14 reglas normativas (RGPD, AML, Anticorrupción, ISO 27001).
    3. Invoca a Llama 3.1 en la VPS de Oracle Cloud para extraer cláusulas críticas y recomendaciones.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Formato no soportado. Debe ser un PDF.")

    pdf_bytes = await file.read()
    raw_text = extract_text_hybrid(pdf_bytes)

    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="No se pudo extraer contenido del archivo.")

    # 1. Reglas normativas determinísticas
    chunks = create_chunks(raw_text, chunk_size=500, chunk_overlap=50)
    rule_assessment = risk_engine.assess_risk(chunks)

    # 2. Inferencia semántica con Llama 3.1 en VPS
    llm_assessment = None
    if use_llm:
        llm_assessment = llm_service.analyze_contract_semantics(raw_text)

    return {
        "filename": file.filename,
        "total_characters": len(raw_text),
        "total_chunks": len(chunks),
        "rule_scoring": rule_assessment,
        "ai_llm_analysis": llm_assessment
    }

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
    Retorna el catálogo activo de reglas normativas evaluadas por el motor.
    """
    return risk_engine.get_rules_info()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)