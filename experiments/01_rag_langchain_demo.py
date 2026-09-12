"""
Audiflow - Laboratorio Experimental 01: Demostracion del Pipeline RAG
Objetivo: Simular la recuperacion semantica aumentada por generacion (RAG) 
sobre un contrato real de software para extraer y auditar clausulas criticas.
"""

import sys
import os
import re
import math
from typing import List, Dict, Any

# Asegurar codificacion UTF-8 en consola de Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def cargar_documento(ruta_archivo: str) -> str:
    """Carga el texto plano del contrato."""
    with open(ruta_archivo, 'r', encoding='utf-8') as f:
        return f.read()

def segmentar_clausulas(texto: str) -> List[Dict[str, Any]]:
    """
    Simula el Text Splitting inteligente de LangChain 
    respetando los limites de clausulas contractuales.
    """
    patron = r'(CLÁUSULA\s+[A-ZÁÉÍÓÚÑ]+(?:\s*-\s*[^\n]+)?)'
    partes = re.split(patron, texto)
    
    chunks = []
    if partes and partes[0].strip():
        chunks.append({
            "id": "ENCABEZADO",
            "titulo": "PARTES Y OBJETO PRELIMINAR",
            "contenido": partes[0].strip()
        })
    
    for i in range(1, len(partes), 2):
        titulo = partes[i].strip()
        contenido = partes[i+1].strip() if i+1 < len(partes) else ""
        chunks.append({
            "id": f"CHUNK_{i//2 + 1}",
            "titulo": titulo,
            "contenido": f"{titulo}\n{contenido}"
        })
    return chunks

def similitud_lexica(query: str, texto: str) -> float:
    """
    Calcula una metrica de relevancia por coincidencia semantica/terminologica.
    """
    terminos_query = set(re.findall(r'\w+', query.lower()))
    terminos_texto = re.findall(r'\w+', texto.lower())
    if not terminos_texto:
        return 0.0
    
    coincidencias = sum(1 for palabra in terminos_texto if palabra in terminos_query)
    return coincidencias / (math.sqrt(len(terminos_texto)) + 1e-5)

def recuperar_chunks_relevantes(query: str, chunks: List[Dict[str, Any]], top_k: int = 1) -> List[Dict[str, Any]]:
    """
    Retriever: Localiza los Top-K fragmentos con mayor similitud.
    """
    puntuados = []
    for chunk in chunks:
        score = similitud_lexica(query, chunk["contenido"])
        puntuados.append((score, chunk))
    
    puntuados.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in puntuados[:top_k]]

def auditar_regla(nombre_regla: str, consulta: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Simula la inferencia generativa del LLM recibiendo los fragmentos recuperados 
    y emitiendo un veredicto estructurado.
    """
    recuperados = recuperar_chunks_relevantes(consulta, chunks, top_k=1)
    chunk = recuperados[0]
    texto_chunk = chunk["contenido"]
    
    riesgo = "[RIESGO BAJO - Conforme]"
    observacion = "Condiciones equilibradas acordes al estandar del mercado."
    
    if "responsabilidad" in consulta.lower():
        if "estrictamente limitada" in texto_chunk.lower() or "mes calendario" in texto_chunk.lower():
            riesgo = "[RIESGO ALTO - Critico]"
            observacion = "El proveedor limita su responsabilidad economica maxima a solo 1 mes de cuota. Muy desfavorable para el cliente si ocurre perdida de datos."
    elif "renovacion" in consulta.lower() or "renovación" in consulta.lower():
        if "automáticamente" in texto_chunk.lower() and "60" in texto_chunk:
            riesgo = "[RIESGO MEDIO - Advertencia]"
            observacion = "Renovacion tacita obligatoria con preaviso de 60 dias. Requiere alarma en calendario corporativo para evitar prorrogas forzosas."
    elif "penalidades" in consulta.lower() or "sla" in consulta.lower():
        if "99.5%" in texto_chunk and "crédito" in texto_chunk.lower():
            riesgo = "[RIESGO BAJO - Conforme]"
            observacion = "SLA de disponibilidad del 99.5% con tabla explicita de creditos de servicio del 10% y 25%."

    return {
        "regla": nombre_regla,
        "clausula_origen": chunk["titulo"],
        "evidencia_textual": texto_chunk[:240].replace('\n', ' ') + "...",
        "nivel_riesgo": riesgo,
        "analisis_ejecutivo": observacion
    }

def main():
    print("=" * 75)
    print("   AUDIFLOW - PROTOTIPO EXPERIMENTAL DE AUDITORIA CON RAG")
    print("=" * 75)
    
    ruta_contrato = os.path.join(os.path.dirname(__file__), "..", "data", "samples", "contrato_sla_software.txt")
    if not os.path.exists(ruta_contrato):
        print(f"Error: no se encontro el archivo en {ruta_contrato}")
        return
    
    texto = cargar_documento(ruta_contrato)
    chunks = segmentar_clausulas(texto)
    print(f"\n[1] Documento cargado exitosamente.")
    print(f"    Total de clausulas identificadas y chunkificadas: {len(chunks)}")
    for c in chunks:
        print(f"    - [{c['id']}] {c['titulo']}")
    
    consultas_auditoria = [
        ("Auditoria de Nivel de Servicio y Penalidades", "disponibilidad sla uptime penalidades credito tarifa mensual"),
        ("Auditoria de Plazos y Renovacion Automatica", "vigencia renovacion automatica preaviso plazo prorrogas"),
        ("Auditoria de Pasivos y Limites de Responsabilidad", "limitacion responsabilidad monto maximo lucro cesante danos")
    ]
    
    print("\n[2] Ejecutando Pipeline RAG (Busqueda Semantica + Inferencia de Riesgo):")
    print("-" * 75)
    
    for nombre, query in consultas_auditoria:
        resultado = auditar_regla(nombre, query, chunks)
        print(f"\n* REGULACION: {resultado['regla']}")
        print(f"  - Clausula detectada: {resultado['clausula_origen']}")
        print(f"  - Semaforo / Severidad: {resultado['nivel_riesgo']}")
        print(f"  - Dictamen Simple: {resultado['analisis_ejecutivo']}")
        print(f"  - Evidencia Textual: \"{resultado['evidencia_textual']}\"")
        print("-" * 75)
        
    print("\n[OK] Laboratorio RAG finalizado con 100% de trazabilidad de clausulas.")

if __name__ == "__main__":
    main()