# Audiflow - Frontend Web Interactivo

Plataforma frontend en **React 19, TypeScript, Tailwind CSS y Lucide Icons** diseñada para la auditoría inteligente de contratos de software y acuerdos financieros.

## 🔗 Integración con la Arquitectura Audiflow

Este frontend se comunica directamente con el backend de FastAPI (`http://127.0.0.1:8000`):

1. **Inferencia Semántica Legal**: Conexión con Meta **Llama 3.1 (8B)** desplegado en servidor privado Oracle Cloud Infrastructure (OCI Ampere A1).
2. **Motor Determinístico**: Evaluación de 14 controles normativos preconfigurados (RGPD / Ley 1581, SARLAFT / SAGRILAFT, Anticorrupción FCPA / ISO 37001, Ciberseguridad ISO 27001).
3. **Persistencia en la Nube**: Almacenamiento de auditorías, métricas y fragmentos OCR en **Supabase**.
4. **Exportación de Dictámenes**: Generación de informes formales descargables en **PDF** y **Word (.docx)**.

## 🚀 Ejecución Local

**Requisito previo:** Node.js (v18+)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000` o `http://localhost:5173`.
Asegúrate de tener corriendo el backend de FastAPI en el puerto 8000 (`python main.py` en `api/`).
