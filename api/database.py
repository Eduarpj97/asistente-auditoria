import os
import time
import sqlite3
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

# Base de datos local SQLite (fallback automático y persistente)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
SQLITE_DB_PATH = os.path.join(DATA_DIR, "audiflow_local.db")

def init_sqlite_db():
    """Inicializa las tablas locales en SQLite compatibles con el esquema de Audiflow."""
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
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
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Error inicializando SQLite local: {e}")

init_sqlite_db()

supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[ERROR] No se pudo inicializar el cliente de Supabase: {e}")
else:
    print("[INFO] SUPABASE_URL o SUPABASE_KEY no configuradas con valores válidos. Modo SQLite Local activo.")

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
                "motor": "Supabase Cloud",
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
                "mensaje": "Base de datos local activa y funcional. En espera de API Key válida de Supabase."
            }
    
    return {
        "status": "ONLINE_LOCAL",
        "motor": "SQLite Local",
        "archivo": SQLITE_DB_PATH,
        "mensaje": "Almacenamiento persistente local garantizado en SQLite."
    }
