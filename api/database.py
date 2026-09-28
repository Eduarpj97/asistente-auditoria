import os
import time
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

supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[ERROR] No se pudo inicializar el cliente de Supabase: {e}")
else:
    print("[WARNING] SUPABASE_URL o SUPABASE_KEY no están configuradas.")

def check_db_health() -> Dict[str, Any]:
    """
    Verifica la conectividad en tiempo real con la base de datos de Supabase.
    """
    if not supabase:
        return {
            "status": "OFFLINE",
            "url": SUPABASE_URL or "No configurado",
            "error": "Cliente Supabase no inicializado. Verifique variables en .env"
        }
    
    start_time = time.time()
    try:
        # Prueba de lectura simple sobre la tabla de documentos
        resp = supabase.table("documentos").select("id_documento").limit(1).execute()
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "ONLINE",
            "url": SUPABASE_URL,
            "latency_ms": latency_ms,
            "tables_ready": True
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "url": SUPABASE_URL,
            "error": str(e)
        }
