"""
Audiflow - Laboratorio Experimental 03: Cliente y Verificacion del Servicio Ollama
Objetivo: Probar la conectividad con el servicio local de Ollama (puerto 11434)
y enviar un prompt de auditoria de prueba a un modelo open-weights.
"""

import sys
import os
import json
import urllib.request
import urllib.error

# Asegurar codificacion UTF-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

OLLAMA_HOST = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

def verificar_servicio_ollama() -> bool:
    """Comprueba si el servidor de Ollama esta activo y respondiendo."""
    url = f"{OLLAMA_HOST}/api/tags"
    try:
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                modelos = [m['name'] for m in data.get('models', [])]
                print(f"[OK] Servicio Ollama detectado en {OLLAMA_HOST}")
                print(f"     Modelos instalados actualmente: {modelos if modelos else 'Ninguno aun'}")
                return True
    except urllib.error.URLError:
        print(f"[AVISO] No se detecto Ollama corriendo activamente en {OLLAMA_HOST}")
        return False
    except Exception as e:
        print(f"[AVISO] Error al conectar con Ollama: {e}")
        return False

def simular_o_ejecutar_inferencia(modelo: str = "llama3.1:8b"):
    """
    Ejecuta una consulta real si Ollama esta activo, o muestra la estructura
    de comunicacion y payload REST estandar que usa Audiflow.
    """
    prompt = (
        "Eres el auditor de contratos de Audiflow. "
        "Analiza esta clausula: 'La indemnizacion maxima del proveedor sera de 1 mes de cuota.' "
        "Clasifica el riesgo en: ALTA, MEDIA o BAJA, y explica en 1 linea por que."
    )
    
    payload = {
        "model": modelo,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    print("\n" + "=" * 75)
    print(f"Payload de solicitud REST enviado a Ollama (/api/generate):")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("=" * 75)

    url = f"{OLLAMA_HOST}/api/generate"
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                res_data = json.loads(resp.read().decode('utf-8'))
                print("\n[RESPUESTA REAL RECIBIDA DE OLLAMA]:")
                print(res_data.get("response", ""))
                return
    except Exception:
        print("\n[MODO SIMULADO / GUIA PARA ACTIVACION]:")
        print("Para levantar Ollama con Docker para tu proyecto, solo requieres ejecutar:")
        print("  docker run -d -v ollama_storage:/root/.ollama -p 11434:11434 --name audiflow_ollama ollama/ollama")
        print("Y descargar el modelo de pesos abiertos con:")
        print("  docker exec -it audiflow_ollama ollama pull llama3.1:8b")
        print("\nEstructura de respuesta que genera Ollama para Audiflow:")
        simulado = {
            "riesgo": "ALTA",
            "motivo": "Limitar la indemnizacion a solo un mes traslada desproporcionadamente los costos de incidentes graves al cliente."
        }
        print(json.dumps(simulado, indent=2, ensure_ascii=False))

def main():
    print("=" * 75)
    print("   AUDIFLOW - VERIFICACION Y CLIENTE DE IA LOCAL CON OLLAMA")
    print("=" * 75)
    
    activo = verificar_servicio_ollama()
    simular_o_ejecutar_inferencia()
    
    print("\n" + "=" * 75)
    print("[OK] Demostracion de arquitectura con Ollama lista para el proyecto.")

if __name__ == "__main__":
    main()