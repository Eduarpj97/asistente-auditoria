"""
===================================================================
AUDIFLOW - SCRIPT DE SINCRONIZACIÓN SQLITE -> SUPABASE CLOUD
===================================================================
Migra y sincroniza todos los usuarios, documentos, auditorías y
riesgos almacenados localmente en SQLite (data/audiflow_local.db)
hacia el proyecto Supabase en la nube.
===================================================================
"""
import os
import sys
import uuid
import sqlite3
from typing import Dict, Any, List

# Añadir directorio actual al path
sys.path.append(os.path.dirname(__file__))

from database import (
    supabase,
    get_sqlite_conn,
    SQLITE_DB_PATH,
    SUPABASE_URL,
    SUPABASE_KEY
)

DEFAULT_EMPRESA_ID = "emp-default-global"

def ensure_default_empresa():
    """Garantiza que la empresa base exista en Supabase para las claves foráneas."""
    if not supabase:
        return False
    try:
        supabase.table("empresas").upsert({
            "id_empresa": DEFAULT_EMPRESA_ID,
            "nombre_empresa": "Firma de Auditoria Corporativa",
            "nit_identificacion": "NIT-900123456-1"
        }).execute()
        return True
    except Exception as e:
        print(f"[Aviso] No se pudo crear/verificar empresa en Supabase: {e}")
        return False

def sync_usuarios() -> int:
    """Sincroniza todos los usuarios de SQLite hacia Supabase."""
    if not supabase:
        print("[ERROR] Cliente Supabase no inicializado.")
        return 0
    
    conn = get_sqlite_conn()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM usuarios")
    rows = c.fetchall()
    conn.close()

    count = 0
    for row in rows:
        u = dict(row)
        # Adaptar rol para compatibilidad
        raw_role = str(u.get("rol", "Auditor"))
        role_mapped = raw_role[:30] if len(raw_role) > 30 else raw_role

        user_payload = {
            "id_usuario": u.get("id_usuario"),
            "id_empresa": DEFAULT_EMPRESA_ID,
            "nombre": u.get("nombre"),
            "email": u.get("email"),
            "password_hash": u.get("password_hash"),
            "rol": role_mapped,
            "activo": bool(u.get("activo", 1)),
            "creado_en": u.get("creado_en")
        }
        try:
            supabase.table("usuarios").upsert(user_payload, on_conflict="email").execute()
            count += 1
            print(f"  [OK] Usuario: {u.get('email')} ({u.get('nombre')})")
        except Exception as e:
            err_str = str(e)
            if "42501" in err_str:
                print(f"  [RLS ERROR] Usuario {u.get('email')}: Politica de seguridad RLS activa en Supabase.")
            else:
                print(f"  [ERROR] Usuario {u.get('email')}: {err_str}")
    
    return count

def sync_documentos_y_detalles() -> Dict[str, int]:
    """Sincroniza documentos, OCR, cláusulas y riesgos desde SQLite hacia Supabase."""
    stats = {"documentos": 0, "ocr": 0, "clausulas": 0, "riesgos": 0}
    if not supabase:
        return stats

    conn = get_sqlite_conn()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # 1. Documentos
    c.execute("SELECT * FROM documentos")
    docs = [dict(r) for r in c.fetchall()]

    for doc in docs:
        doc_payload = {
            "id_documento": doc.get("id_documento"),
            "id_empresa": DEFAULT_EMPRESA_ID,
            "id_usuario_carga": doc.get("id_usuario_carga"),
            "nombre_original": doc.get("nombre_original"),
            "hash_sha256": doc.get("hash_sha256"),
            "ruta_almacenamiento_seguro": doc.get("ruta_almacenamiento_seguro"),
            "tamano_bytes": doc.get("tamano_bytes"),
            "tipo_mime": doc.get("tipo_mime", "application/pdf"),
            "tipo_contrato": doc.get("tipo_contrato", "Licencia_Software"),
            "estado_procesamiento": doc.get("estado_procesamiento", "Auditado"),
            "mensaje_error": doc.get("mensaje_error"),
            "fecha_carga": doc.get("fecha_carga")
        }
        try:
            supabase.table("documentos").upsert(doc_payload, on_conflict="id_documento").execute()
            stats["documentos"] += 1
            print(f"  [OK] Documento: {doc.get('nombre_original')} [{doc.get('id_documento')[:8]}]")
        except Exception as e:
            err_str = str(e)
            if "42501" in err_str:
                print(f"  [RLS ERROR] Documento {doc.get('nombre_original')}: Politica RLS activa en Supabase.")
            else:
                print(f"  [ERROR] Documento {doc.get('nombre_original')}: {err_str}")

    # 2. Texto OCR
    c.execute("SELECT * FROM texto_ocr")
    for r in c.fetchall():
        item = dict(r)
        try:
            supabase.table("texto_ocr").upsert({
                "id_ocr": item.get("id_ocr"),
                "id_documento": item.get("id_documento"),
                "num_pagina": item.get("num_pagina"),
                "contenido_texto": item.get("contenido_texto"),
                "confianza_ocr": item.get("confianza_ocr", 99.0)
            }, on_conflict="id_ocr").execute()
            stats["ocr"] += 1
        except Exception:
            pass

    # 3. Cláusulas
    c.execute("SELECT * FROM clausulas_extraidas")
    for r in c.fetchall():
        item = dict(r)
        try:
            supabase.table("clausulas_extraidas").upsert({
                "id_clausula": item.get("id_clausula"),
                "id_documento": item.get("id_documento"),
                "num_pagina": item.get("num_pagina"),
                "tipo_clausula": item.get("tipo_clausula"),
                "texto_clausula": item.get("texto_clausula"),
                "posicion_inicio_caracter": item.get("posicion_inicio_caracter"),
                "posicion_fin_caracter": item.get("posicion_fin_caracter")
            }, on_conflict="id_clausula").execute()
            stats["clausulas"] += 1
        except Exception:
            pass

    # 4. Análisis de riesgos
    c.execute("SELECT * FROM analisis_riesgos")
    for r in c.fetchall():
        item = dict(r)
        try:
            supabase.table("analisis_riesgos").upsert({
                "id_riesgo": item.get("id_riesgo"),
                "id_documento": item.get("id_documento"),
                "id_clausula": item.get("id_clausula"),
                "nivel_riesgo": item.get("nivel_riesgo"),
                "categoria_cumplimiento": item.get("categoria_cumplimiento"),
                "titulo_hallazgo": item.get("titulo_hallazgo"),
                "descripcion_riesgo": item.get("descripcion_riesgo"),
                "recomendacion_mitigacion": item.get("recomendacion_mitigacion"),
                "es_incumplimiento": bool(item.get("es_incumplimiento"))
            }, on_conflict="id_riesgo").execute()
            stats["riesgos"] += 1
        except Exception:
            pass

    conn.close()
    return stats

def sync_auditorias_completas() -> int:
    """Sincroniza los payloads JSON completos de auditorías hacia Supabase."""
    if not supabase:
        return 0
    
    conn = get_sqlite_conn()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM auditorias_sync")
    rows = c.fetchall()
    conn.close()

    count = 0
    for r in rows:
        item = dict(r)
        try:
            supabase.table("auditorias_sync").upsert({
                "id_audit": item.get("id_audit"),
                "user_email": item.get("user_email"),
                "audit_json": item.get("audit_json"),
                "created_at": item.get("created_at")
            }, on_conflict="id_audit,user_email").execute()
            count += 1
            print(f"  [OK] Auditoria completa: {item.get('id_audit')[:12]} ({item.get('user_email')})")
        except Exception as e:
            err_str = str(e)
            if "PGRST205" in err_str or "Could not find the table" in err_str:
                print(f"  [AVISO] Tabla 'auditorias_sync' no creada aun en Supabase. Ejecuta database/supabase_dual_backup_setup.sql")
                break
            elif "42501" in err_str:
                print(f"  [RLS ERROR] Auditoria {item.get('id_audit')}: Politica RLS activa en Supabase.")
            else:
                print(f"  [ERROR] Auditoria {item.get('id_audit')}: {err_str}")
    
    return count

def run_full_sync():
    print("=" * 65)
    print(" AUDIFLOW: SINCRONIZACION DUAL SQLITE -> SUPABASE")
    print("=" * 65)
    print(f"Base de datos origen:  {SQLITE_DB_PATH}")
    print(f"Base de datos destino: {SUPABASE_URL}")
    print("-" * 65)

    if not supabase:
        print("[ERROR] No se pudo inicializar la conexion con Supabase.")
        print("Verifica SUPABASE_URL y SUPABASE_KEY en tu archivo .env.")
        sys.exit(1)

    print("\n[1/4] Verificando empresa base en Supabase...")
    ensure_default_empresa()

    print("\n[2/4] Sincronizando Usuarios...")
    u_count = sync_usuarios()
    print(f"-> Total usuarios sincronizados: {u_count}")

    print("\n[3/4] Sincronizando Documentos y Auditorias...")
    doc_stats = sync_documentos_y_detalles()
    print(f"-> Documentos: {doc_stats['documentos']}, OCR: {doc_stats['ocr']}, Clausulas: {doc_stats['clausulas']}, Riesgos: {doc_stats['riesgos']}")

    print("\n[4/4] Sincronizando Respaldo Completo de Auditorias...")
    sync_count = sync_auditorias_completas()
    print(f"-> Total auditorias sincronizadas: {sync_count}")

    print("\n" + "=" * 65)
    print(" PROCESO DE SINCRONIZACION FINALIZADO")
    print("=" * 65)

if __name__ == "__main__":
    run_full_sync()
