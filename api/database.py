import os
import time
import sqlite3
import uuid
import hashlib
from typing import Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno desde .env
env_path = os.path.join(os.path.dirname(__file__), ".env")
if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

# Inicializar cliente de Supabase para respaldo dual
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[ERROR] No se pudo inicializar el cliente de Supabase: {e}")
else:
    print("[INFO] SUPABASE_URL o SUPABASE_KEY no configuradas con valores válidos. Modo SQLite Local activo.")

DEFAULT_EMPRESA_ID = "emp-default-global"

# Base de datos local SQLite (fallback automático y persistente)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
SQLITE_DB_PATH = os.path.join(DATA_DIR, "audiflow_local.db")

def get_sqlite_conn() -> sqlite3.Connection:
    """Retorna una conexión a SQLite con modo WAL y timeout de 30s para concurrencia multi-usuario sin bloqueos."""
    conn = sqlite3.connect(SQLITE_DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_sqlite_db():
    """Inicializa las tablas locales en SQLite compatibles con el esquema de Audiflow."""
    try:
        conn = get_sqlite_conn()
        c = conn.cursor()
        c.execute("""
        CREATE TABLE IF NOT EXISTS documentos (
            id_documento TEXT PRIMARY KEY,
            id_empresa TEXT,
            id_usuario_carga TEXT,
            nombre_original TEXT NOT NULL,
            hash_sha256 TEXT NOT NULL,
            ruta_almacenamiento_seguro TEXT NOT NULL,
            tamano_bytes INTEGER NOT NULL,
            tipo_mime TEXT DEFAULT 'application/pdf',
            tipo_contrato TEXT DEFAULT 'Licencia_Software',
            estado_procesamiento TEXT DEFAULT 'Auditado',
            mensaje_error TEXT,
            fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        c.execute("""
        CREATE TABLE IF NOT EXISTS texto_ocr (
            id_ocr TEXT PRIMARY KEY,
            id_documento TEXT NOT NULL,
            num_pagina INTEGER NOT NULL,
            contenido_texto TEXT NOT NULL,
            confianza_ocr REAL DEFAULT 99.0,
            procesado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_documento) REFERENCES documentos(id_documento)
        )
        """)
        c.execute("""
        CREATE TABLE IF NOT EXISTS clausulas_extraidas (
            id_clausula TEXT PRIMARY KEY,
            id_documento TEXT NOT NULL,
            num_pagina INTEGER,
            tipo_clausula TEXT NOT NULL,
            texto_clausula TEXT NOT NULL,
            posicion_inicio_caracter INTEGER,
            posicion_fin_caracter INTEGER,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_documento) REFERENCES documentos(id_documento)
        )
        """)
        c.execute("""
        CREATE TABLE IF NOT EXISTS analisis_riesgos (
            id_riesgo TEXT PRIMARY KEY,
            id_documento TEXT NOT NULL,
            id_clausula TEXT,
            nivel_riesgo TEXT NOT NULL,
            categoria_cumplimiento TEXT NOT NULL,
            titulo_hallazgo TEXT NOT NULL,
            descripcion_riesgo TEXT NOT NULL,
            recomendacion_mitigacion TEXT NOT NULL,
            es_incumplimiento INTEGER DEFAULT 0,
            auditado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_documento) REFERENCES documentos(id_documento)
        )
        """)
        c.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            empresa TEXT DEFAULT 'Firma de Auditoría',
            rol TEXT DEFAULT 'Auditor Legal Senior',
            activo INTEGER DEFAULT 1,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        c.execute("""
        CREATE TABLE IF NOT EXISTS auditorias_sync (
            id_audit TEXT NOT NULL,
            user_email TEXT NOT NULL,
            audit_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id_audit, user_email)
        )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Error inicializando SQLite local: {e}")

init_sqlite_db()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def db_register_user(name: str, email: str, password: str, company: str = "Firma de Auditoría", role: str = "Auditor Legal Senior") -> Dict[str, Any]:
    norm_email = email.strip().lower()
    pwd_hash = hash_password(password)
    user_id = str(uuid.uuid4())
    
    try:
        conn = get_sqlite_conn()
        c = conn.cursor()
        c.execute("SELECT id_usuario FROM usuarios WHERE LOWER(email) = ?", (norm_email,))
        existing = c.fetchone()
        if existing:
            conn.close()
            return {"success": False, "error": "Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión."}
        
        c.execute("""
        INSERT INTO usuarios (id_usuario, nombre, email, password_hash, empresa, rol, activo)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        """, (user_id, name.strip(), norm_email, pwd_hash, company.strip() or "Firma de Auditoría", role))
        conn.commit()
        conn.close()
        
        # Dual-write a Supabase (Respaldo en la nube sin bloquear si hay error de red)
        if supabase:
            try:
                supabase.table("empresas").upsert({
                    "id_empresa": DEFAULT_EMPRESA_ID,
                    "nombre_empresa": company.strip() or "Firma de Auditoría",
                    "nit_identificacion": "NIT-900123456-1"
                }).execute()
                supabase.table("usuarios").upsert({
                    "id_usuario": user_id,
                    "id_empresa": DEFAULT_EMPRESA_ID,
                    "nombre": name.strip(),
                    "email": norm_email,
                    "password_hash": pwd_hash,
                    "rol": role,
                    "activo": True
                }, on_conflict="email").execute()
            except Exception as se:
                print(f"[Supabase Dual-Write Notice] Usuario respaldado en SQLite (Supabase en espera: {se})")
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "name": name.strip(),
                "email": norm_email,
                "company": company.strip() or "Firma de Auditoría",
                "role": role
            }
        }
    except Exception as e:
        return {"success": False, "error": f"Error al registrar usuario: {str(e)}"}

def db_authenticate_user(email: str, password: str) -> Dict[str, Any]:
    norm_email = email.strip().lower()
    pwd_hash = hash_password(password)
    
    try:
        conn = get_sqlite_conn()
        c = conn.cursor()
        c.execute("SELECT id_usuario, nombre, email, password_hash, empresa, rol, activo FROM usuarios WHERE LOWER(email) = ?", (norm_email,))
        row = c.fetchone()
        conn.close()
        
        if not row:
            return {"success": False, "error": "No se encontró ninguna cuenta registrada con este correo electrónico. Por favor regístrate."}
        
        user_id, nombre, u_email, stored_hash, empresa, rol, activo = row
        if stored_hash != pwd_hash:
            return {"success": False, "error": "Contraseña incorrecta. Por favor verifica tus credenciales."}
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "name": nombre,
                "email": u_email,
                "company": empresa,
                "role": rol
            }
        }
    except Exception as e:
        return {"success": False, "error": f"Error al autenticar: {str(e)}"}

def seed_default_admin():
    """Garantiza que la cuenta de Eduardo Pedroza esté siempre registrada y lista para ingresar desde cualquier dispositivo."""
    try:
        db_register_user(
            name="Eduardo Pedroza",
            email="eduardo.pedroza@audiflow.com",
            password="Auditor2026!",
            company="Corporativo Legal Global S.A.",
            role="Auditor Legal Senior"
        )
    except Exception:
        pass

seed_default_admin()

def db_save_audit_sync(user_email: str, audit_id: str, audit_json: str) -> Dict[str, Any]:
    """Guarda el JSON completo de una auditoría en SQLite y lo sincroniza con Supabase para respaldo dual."""
    norm_email = user_email.strip().lower()
    try:
        conn = get_sqlite_conn()
        c = conn.cursor()
        c.execute("""
        INSERT OR REPLACE INTO auditorias_sync (id_audit, user_email, audit_json)
        VALUES (?, ?, ?)
        """, (audit_id, norm_email, audit_json))
        conn.commit()
        conn.close()

        # Dual-write a Supabase
        if supabase:
            try:
                supabase.table("auditorias_sync").upsert({
                    "id_audit": audit_id,
                    "user_email": norm_email,
                    "audit_json": audit_json
                }, on_conflict="id_audit,user_email").execute()
            except Exception as se:
                print(f"[Supabase Dual-Write Notice] Auditoría guardada en SQLite (Supabase en espera: {se})")

        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def db_get_user_audits(user_email: str) -> list:
    """Recupera todas las auditorías sincronizadas de un usuario por email (primero intenta SQLite, fallback a Supabase)."""
    import json
    norm_email = user_email.strip().lower()
    try:
        conn = get_sqlite_conn()
        c = conn.cursor()
        rows = c.execute(
            "SELECT audit_json FROM auditorias_sync WHERE user_email = ? ORDER BY created_at DESC",
            (norm_email,)
        ).fetchall()
        conn.close()
        
        if rows:
            result = []
            for row in rows:
                try:
                    result.append(json.loads(row[0]))
                except Exception:
                    pass
            return result
    except Exception as e:
        print(f"[ERROR] Error recuperando auditorías en SQLite: {e}")

    # Fallback a Supabase si SQLite no tiene o está vacío
    if supabase:
        try:
            resp = supabase.table("auditorias_sync").select("audit_json").eq("user_email", norm_email).order("created_at", desc=True).execute()
            if resp.data:
                import json
                return [json.loads(r["audit_json"]) for r in resp.data if "audit_json" in r]
        except Exception:
            pass

    return []

def db_delete_audit_sync(user_email: str, audit_id: str) -> Dict[str, Any]:
    """Elimina una auditoría sincronizada de un usuario en SQLite y Supabase."""
    norm_email = user_email.strip().lower()
    try:
        conn = get_sqlite_conn()
        c = conn.cursor()
        c.execute("DELETE FROM auditorias_sync WHERE id_audit = ? AND user_email = ?", (audit_id, norm_email))
        conn.commit()
        conn.close()

        if supabase:
            try:
                supabase.table("auditorias_sync").delete().eq("id_audit", audit_id).eq("user_email", norm_email).execute()
            except Exception:
                pass

        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def check_db_health() -> Dict[str, Any]:
    """
    Verifica la conectividad en tiempo real con Supabase en la nube
    y garantiza operatividad inmediata con SQLite Local como fallback transparente.
    """
    if supabase:
        start_time = time.time()
        try:
            resp = supabase.table("documentos").select("id_documento").limit(1).execute()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "status": "ONLINE",
                "motor": "Supabase Cloud + SQLite Local (Respaldo Dual)",
                "url": SUPABASE_URL,
                "latency_ms": latency_ms,
                "tables_ready": True
            }
        except Exception as e:
            return {
                "status": "ONLINE_LOCAL",
                "motor": "SQLite Local (Fallback Resiliente)",
                "url_supabase": SUPABASE_URL,
                "error_supabase": str(e),
                "mensaje": "Base de datos local activa y funcional. En espera de permisos o API Key de Supabase."
            }
    
    return {
        "status": "ONLINE_LOCAL",
        "motor": "SQLite Local",
        "archivo": SQLITE_DB_PATH,
        "mensaje": "Almacenamiento persistente local garantizado en SQLite."
    }
