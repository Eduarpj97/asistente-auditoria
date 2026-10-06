import os
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Cargar variables de entorno
load_dotenv()

from database import check_db_health, db_register_user, db_authenticate_user
from services.ocr_service import extract_text_hybrid
from services.chunk_service import create_chunks
from services.risk_scoring_service import risk_engine
from services.llm_audit_service import llm_service
from services.db_service import db_service
from schemas import (
    ProcessingResponse,
    RiskAssessmentResponse,
    EvaluateRiskRequest,
    RiskRuleInfo,
    RegisterRequest,
    LoginRequest,
    AuthResponse
)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

app = FastAPI(
    title="Audiflow - Regulatory Risk Scoring & AI Contract Audit API",
    description="Plataforma de auditoría inteligente de contratos. Combina motor de scoring normativo determinístico, inferencia semántica con Llama 3.1 en Oracle Cloud y persistencia en Supabase.",
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

@app.get("/v1/health", summary="Estado del sistema, conectividad con Ollama y Supabase")
async def health_check():
    """
    Retorna el estado de salud de la API y la conectividad en tiempo real
    con el servicio de inferencia Llama 3.1 en Oracle Cloud y la base de datos Supabase.
    """
    ollama_status = llm_service.check_health()
    db_status = check_db_health()
    return {
        "api_status": "ONLINE",
        "service": "Audiflow API",
        "version": "1.2.0",
        "ollama_engine": ollama_status,
        "supabase_database": db_status
    }

@app.post("/v1/auth/register", response_model=AuthResponse, summary="Registrar usuario en base de datos centralizada")
async def register_endpoint(req: RegisterRequest):
    """
    Registra una cuenta de usuario en la base de datos central.
    Garantiza que la cuenta pueda ser utilizada desde cualquier dispositivo (PC, móvil, tablet).
    """
    res = db_register_user(
        name=req.name,
        email=req.email,
        password=req.password,
        company=req.company or "Firma de Auditoría",
        role=req.role or "Auditor Legal Senior"
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Error al registrar la cuenta."))
    return res

@app.post("/v1/auth/login", response_model=AuthResponse, summary="Autenticar usuario en base de datos centralizada")
async def login_endpoint(req: LoginRequest):
    """
    Autentica credenciales contra la base de datos central.
    Permite el inicio de sesión multidispositivo sin importar el navegador o terminal.
    """
    res = db_authenticate_user(email=req.email, password=req.password)
    if not res.get("success"):
        raise HTTPException(status_code=401, detail=res.get("error", "Credenciales incorrectas."))
    return res

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

@app.post("/v1/audit-contract-ai", summary="Auditoría híbrida avanzada (Reglas Normativas + IA Llama 3.1 + Supabase)")
async def audit_contract_ai(
    file: UploadFile = File(...),
    use_llm: bool = Form(True, description="Incluir análisis semántico profundo con Llama 3.1")
):
    """
    Endpoint insignia de Audiflow:
    1. Extrae el texto del contrato en PDF.
    2. Ejecuta el motor de scoring de 14 reglas normativas (RGPD, AML, Anticorrupción, ISO 27001).
    3. Invoca a Llama 3.1 en la VPS de Oracle Cloud para extraer cláusulas críticas y recomendaciones.
    4. Persiste el documento, fragmentos OCR, cláusulas y riesgos en Supabase.
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

    # 3. Guardar automáticamente en Supabase
    db_result = db_service.save_audit(
        filename=file.filename,
        file_bytes=pdf_bytes,
        raw_text=raw_text,
        chunks=chunks,
        rule_assessment=rule_assessment,
        llm_assessment=llm_assessment
    )

    return {
        "filename": file.filename,
        "total_characters": len(raw_text),
        "total_chunks": len(chunks),
        "rule_scoring": rule_assessment,
        "ai_llm_analysis": llm_assessment,
        "database_persistence": db_result
    }

@app.get("/v1/contracts", summary="Listar contratos auditados guardados en Supabase")
async def list_contracts(limit: int = 20):
    """Obtiene la lista de los últimos contratos auditados y almacenados en Supabase."""
    return db_service.list_contracts(limit=limit)

@app.get("/v1/contracts/{document_id}", summary="Consultar detalle de contrato, riesgos y cláusulas")
async def get_contract_details(document_id: str):
    """Obtiene la trazabilidad completa de un contrato auditado por su identificador UUID."""
    details = db_service.get_contract_details(document_id)
    if not details or not details.get("documento"):
        raise HTTPException(status_code=404, detail="Contrato no encontrado en la base de datos.")
    return details

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

@app.get("/v1/normativas-vigentes", summary="Consultar compendio oficial de normativas y estatutos vigentes (2026)")
async def get_normativas_vigentes():
    """
    Retorna el compendio oficial de directrices normativas aplicadas en la auditoría inteligente.
    """
    normativa_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "normativas", "normativa_auditoria_vigente_2026.md")
    if not os.path.exists(normativa_path):
        normativa_path = os.path.join(STATIC_DIR, "normativas", "normativa_auditoria_vigente_2026.md")
    
    contenido = ""
    if os.path.exists(normativa_path):
        with open(normativa_path, "r", encoding="utf-8") as f:
            contenido = f.read()

    return {
        "titulo": "Estatutos y Lineamientos Normativos de Auditoría Contractual",
        "vigencia": "Actualizado a 2026",
        "url_documento_publico": "https://audiflow-audit.abbynex.site/normativas/normativa_auditoria_vigente_2026.md",
        "formato": "Markdown (.md)",
        "ejes_regulatorios": [
            "Prevención de Lavado de Activos y FT (GAFI / SARLAFT / UBO al 5%)",
            "Protección de Datos, Privacidad y Regulación de IA (RGPD / Habeas Data / AI Act)",
            "Anticorrupción, Ética y Antisoborno (FCPA / ISO 37001)",
            "Seguridad de la Información y Ciberseguridad (ISO 27001:2022 / NIS2)",
            "Equilibrio Contractual, Responsabilidad y SLAs"
        ],
        "contenido_markdown": contenido
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)