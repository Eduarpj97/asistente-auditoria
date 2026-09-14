import os
import requests

BASE_URL = "http://127.0.0.1:8000"

TRAFFIC_LIGHT_ICONS = {
    "ROJO": "🔴 [ROJO - RIESGO ALTO / CRÍTICO]",
    "AMARILLO": "🟡 [AMARILLO - RIESGO MEDIO / OBSERVACIÓN]",
    "VERDE": "🟢 [VERDE - BAJO RIESGO / CONFORME]"
}

def print_risk_assessment(assessment: dict):
    traffic_light = assessment.get("traffic_light", "VERDE")
    icon_label = TRAFFIC_LIGHT_ICONS.get(traffic_light, traffic_light)
    score = assessment.get("global_score", 0.0)
    label = assessment.get("risk_level_label", "")
    summary = assessment.get("executive_summary", "")
    findings_summary = assessment.get("findings_summary", {})
    categories = assessment.get("category_breakdown", [])
    findings = assessment.get("findings", [])

    print("=" * 70)
    print(f" RESULTADO DEL SEMÁFORO NORMATIVO: {icon_label}")
    print(f" Puntuación de Riesgo: {score}/100.0 | {label}")
    print("=" * 70)
    print(f" Resumen Ejecutivo:\n {summary}\n")

    print(f" Hallazgos Totales: {len(findings)} | "
          f"Críticos (ALTO): {findings_summary.get('ALTO', 0)} | "
          f"Medios (MEDIO): {findings_summary.get('MEDIO', 0)} | "
          f"Bajos (BAJO): {findings_summary.get('BAJO', 0)}")
    print("-" * 70)

    print(" Desglose por Categorías Regulatorias:")
    for cat in categories:
        cat_icon = "🔴" if cat["level"] == "ROJO" else ("🟡" if cat["level"] == "AMARILLO" else "🟢")
        print(f"   {cat_icon} {cat['category_name']}: Score {cat['score']}/100 ({cat['findings_count']} hallazgos)")

    if findings:
        print("\n Principales Hallazgos y Acciones de Mitigación:")
        for idx, f in enumerate(findings, 1):
            sev_icon = "🔴" if f["severity"] == "ALTO" else ("🟡" if f["severity"] == "MEDIO" else "🟢")
            print(f"   {idx}. {sev_icon} [{f['rule_id']}] {f['title']} (Severidad: {f['severity']})")
            print(f"      - Marco Legal: {f['normative_reference']}")
            print(f"      - Descripción: {f['description']}")
            if f.get("matched_snippet"):
                print(f"      - Texto Detectado: \"{f['matched_snippet']}\"")
            print(f"      - Acción Recomendada: {f['remediation']}\n")
    print("=" * 70)

def test_pdf_processing(file_path: str):
    url = f"{BASE_URL}/v1/process-pdf"
    print(f"\nProbando archivo PDF: {file_path}")
    
    if not os.path.exists(file_path):
        print(f" AVISO: El archivo '{file_path}' no existe. Puedes colocar un PDF en la carpeta actual para probarlo.\n")
        return

    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f, "application/pdf")}
        data = {"chunk_size": 300, "chunk_overlap": 30, "calculate_risk": "true"}
        
        try:
            response = requests.post(url, files=files, data=data)
            if response.status_code == 200:
                result = response.json()
                print(" SUCCESS (PDF Procesado)!")
                print(f"  - Nombre del archivo: {result['filename']}")
                print(f"  - Caracteres totales: {result['total_characters']}")
                print(f"  - Chunks totales: {result['total_chunks']}")
                if result.get("chunks"):
                    print(f"  - Muestra Chunk 1:\n{result['chunks'][0][:150]}...\n")

                if result.get("risk_assessment"):
                    print_risk_assessment(result["risk_assessment"])
            else:
                print(f" FAILED (Status {response.status_code}): {response.text}\n")
        except requests.exceptions.ConnectionError:
            print(" ERROR: No se pudo conectar al servidor. Asegúrate de tener 'python main.py' ejecutándose en otra terminal.\n")

def demo_risk_evaluation():
    url = f"{BASE_URL}/v1/evaluate-risk"
    print("\n" + "#" * 70)
    print(" DEMO: EVALUACIÓN DE RIESGOS NORMATIVOS (DIRECTA)")
    print("#" * 70)

    # 1. Ejemplo Contrato de Alto Riesgo (Semáforo ROJO)
    high_risk_contract = """
    CONTRATO PRIVADO DE SUMINISTRO
    Se acuerdan pagos en efectivo sin factura ni soporte contable a cuentas anónimas.
    El contratante gozará de exoneración por dolo o culpa grave ante cualquier daño.
    La empresa podrá transferir libremente a terceros sin restricción la información personal.
    """
    print("\n>>> Evaluando Contrato con Contingencias Graves:")
    try:
        resp = requests.post(url, json={"text": high_risk_contract})
        if resp.status_code == 200:
            print_risk_assessment(resp.json())
        else:
            print(f"Error {resp.status_code}: {resp.text}")
    except requests.exceptions.ConnectionError:
        print("Servidor no iniciado. Ejecuta 'python main.py' para probar la API interactiva.")

if __name__ == "__main__":
    demo_risk_evaluation()
    test_pdf_processing("mi_documento.pdf")