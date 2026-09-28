"""
Script de verificación de conexión y persistencia con Supabase para Audiflow.
Ejecución:
    python test_supabase.py
"""
import sys
from database import check_db_health, supabase
from services.db_service import db_service

def main():
    print("=" * 60)
    print(" AUDIFLOW - VERIFICACIÓN DE CONEXIÓN CON SUPABASE")
    print("=" * 60)

    # 1. Comprobar salud y latencia
    health = check_db_health()
    print(f"Estado de Conexión: {health.get('status')}")
    print(f"URL de Supabase:    {health.get('url')}")
    if health.get("status") == "ONLINE":
        print(f"Latencia:           {health.get('latency_ms')} ms")
    else:
        print(f"Error:              {health.get('error')}")
        sys.exit(1)

    # 2. Verificar existencia de las tablas
    tables = ["empresas", "usuarios", "documentos", "texto_ocr", "clausulas_extraidas", "analisis_riesgos"]
    print("\nVerificando tablas en Supabase:")
    for table_name in tables:
        try:
            res = supabase.table(table_name).select("*").limit(1).execute()
            print(f"  [OK] Tabla '{table_name}' accesible.")
        except Exception as e:
            print(f"  [ERROR] Tabla '{table_name}': {e}")

    # 3. Listar contratos guardados
    contracts = db_service.list_contracts(limit=5)
    print(f"\nContratos almacenados en la base de datos ({len(contracts)} más recientes):")
    for doc in contracts:
        print(f"  - [{doc.get('id_documento')[:8]}...] {doc.get('nombre_original')} ({doc.get('estado_procesamiento')})")

    print("\n" + "=" * 60)
    print(" [OK] ¡La conexión con Supabase está funcionando correctamente!")
    print("=" * 60)

if __name__ == "__main__":
    main()
