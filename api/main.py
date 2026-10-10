import os
import json
import asyncio
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Cargar variables de entorno
load_dotenv()

from database import (
    check_db_health,
    db_register_user,
    db_authenticate_user,
    db_update_user_profile,
    db_change_user_password,
    db_save_audit_sync,
    db_get_user_audits,
    db_delete_audit_sync
)
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
    AuthResponse,
    UpdateProfileRequest,
    ChangePasswordRequest
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
    res = await asyncio.to_thread(
        db_register_user,
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
    res = await asyncio.to_thread(db_authenticate_user, email=req.email, password=req.password)
    if not res.get("success"):
        raise HTTPException(status_code=401, detail=res.get("error", "Credenciales incorrectas."))
    return res

@app.post("/v1/auth/profile", response_model=AuthResponse, summary="Actualizar perfil de usuario en base de datos centralizada")
async def profile_update_endpoint(req: UpdateProfileRequest):
    """
    Actualiza el perfil de un usuario (nombre, cargo, avatar) en SQLite y Supabase.
    Garantiza que los cambios se reflejen de inmediato al abrir la sesión en otro dispositivo.
    """
    res = await asyncio.to_thread(
        db_update_user_profile,
        email=req.email,
        name=req.name,
        role=req.role,
        company=req.company,
        avatar_url=req.avatarUrl
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Error actualizando perfil."))
    return res

@app.post("/v1/auth/change-password", summary="Cambiar contraseña en base de datos centralizada")
async def change_password_endpoint(req: ChangePasswordRequest):
    """Cambia la contraseña de acceso en la base central para persistencia multidispositivo."""
    res = await asyncio.to_thread(
        db_change_user_password,
        email=req.email,
        current_password=req.current_password,
        new_password=req.new_password
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Error cambiando contraseña."))
    return res

# ─── Sincronización cross-device de auditorías ───────────────────────────────

@app.post("/v1/audits/sync", summary="Guardar auditoría para sincronización cross-device")
async def sync_audit(payload: dict):
    """
    Guarda el JSON completo de una auditoría vinculada al email del usuario.
    Permite recuperar el historial de auditorías desde cualquier dispositivo.
    """
    user_email = payload.get("user_email", "").strip().lower()
    audit_id = payload.get("audit_id", "")
    audit_data = payload.get("audit_data")
    if not user_email or not audit_id or not audit_data:
        raise HTTPException(status_code=400, detail="Faltan campos requeridos: user_email, audit_id, audit_data.")
    
    audit_json_str = json.dumps(audit_data, ensure_ascii=False)
    result = await asyncio.to_thread(db_save_audit_sync, user_email, audit_id, audit_json_str)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Error al guardar auditoría."))
    return {"success": True, "audit_id": audit_id}

@app.get("/v1/audits/user", summary="Obtener auditorías sincronizadas de un usuario")
async def get_user_audits(email: str):
    """
    Recupera todas las auditorías almacenadas para un usuario por su email.
    Se invoca al iniciar sesión para cargar el historial en cualquier dispositivo.
    """
    audits = await asyncio.to_thread(db_get_user_audits, email)
    return {"success": True, "audits": audits, "total": len(audits)}

@app.delete("/v1/audits/sync/{audit_id}", summary="Eliminar auditoría sincronizada")
async def delete_synced_audit(audit_id: str, email: str):
    """Elimina una auditoría sincronizada de un usuario."""
    result = await asyncio.to_thread(db_delete_audit_sync, email, audit_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Error al eliminar auditoría."))
    return {"success": True}

def _process_pdf_sync(pdf_bytes: bytes, filename: str, chunk_size: int, chunk_overlap: int, calculate_risk: bool) -> ProcessingResponse:
    raw_text = extract_text_hybrid(pdf_bytes)
    if not raw_text.strip():
        raise ValueError("No se pudo extraer contenido del archivo.")

    chunks = create_chunks(raw_text, chunk_size, chunk_overlap)
    risk_assessment = None
    if calculate_risk:
        risk_assessment = risk_engine.assess_risk(chunks)

    return ProcessingResponse(
        filename=filename,
        total_characters=len(raw_text),
        total_chunks=len(chunks),
        chunks=chunks,
        risk_assessment=risk_assessment
    )

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
    try:
        return await asyncio.to_thread(
            _process_pdf_sync, pdf_bytes, file.filename, chunk_size, chunk_overlap, calculate_risk
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")

def _process_audit_pipeline(pdf_bytes: bytes, filename: str, use_llm: bool) -> dict:
    """Ejecuta el pipeline completo de auditoría de forma síncrona en un worker thread."""
    raw_text = extract_text_hybrid(pdf_bytes)
    if not raw_text.strip():
        raise ValueError("No se pudo extraer contenido del archivo.")

    # 1. Reglas normativas determinísticas
    chunks = create_chunks(raw_text, chunk_size=500, chunk_overlap=50)
    rule_assessment = risk_engine.assess_risk(chunks)

    # 2. Inferencia semántica con Llama 3.1 en VPS
    llm_assessment = None
    if use_llm:
        llm_assessment = llm_service.analyze_contract_semantics(raw_text)

    # 3. Guardar automáticamente en SQLite / Supabase
    db_result = db_service.save_audit(
        filename=filename,
        file_bytes=pdf_bytes,
        raw_text=raw_text,
        chunks=chunks,
        rule_assessment=rule_assessment,
        llm_assessment=llm_assessment
    )

    return {
        "filename": filename,
        "total_characters": len(raw_text),
        "total_chunks": len(chunks),
        "rule_scoring": rule_assessment,
        "ai_llm_analysis": llm_assessment,
        "database_persistence": db_result
    }

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
    Se ejecuta de forma no bloqueante en un pool de hilos para no degradar el acceso de otros usuarios.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Formato no soportado. Debe ser un PDF.")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=422, detail="No se pudo leer el archivo cargado.")

    try:
        # Offload al threadpool para no congelar el bucle de eventos de FastAPI
        result = await asyncio.to_thread(_process_audit_pipeline, pdf_bytes, file.filename, use_llm)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la auditoría: {str(e)}")

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

@app.post("/v1/db/sync-supabase", summary="Ejecutar sincronización dual de SQLite a Supabase")
async def trigger_supabase_sync():
    """
    Sincroniza todos los registros de usuarios, auditorías y documentos
    almacenados en SQLite hacia Supabase Cloud.
    """
    from sync_supabase import sync_usuarios, sync_documentos_y_detalles, sync_auditorias_completas, ensure_default_empresa
    ensure_default_empresa()
    u_count = await asyncio.to_thread(sync_usuarios)
    doc_stats = await asyncio.to_thread(sync_documentos_y_detalles)
    sync_count = await asyncio.to_thread(sync_auditorias_completas)
    return {
        "status": "COMPLETED",
        "usuarios_sincronizados": u_count,
        "documentos_sincronizados": doc_stats["documentos"],
        "ocr_sincronizados": doc_stats["ocr"],
        "clausulas_sincronizadas": doc_stats["clausulas"],
        "riesgos_sincronizados": doc_stats["riesgos"],
        "auditorias_completas_sincronizadas": sync_count
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)