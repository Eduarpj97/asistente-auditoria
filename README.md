# Audiflow — Asistente de Auditoría y Cumplimiento Regulatorio para Contratos

[![Estado](https://img.shields.io/badge/Estado-MVP%20Funcional%20Listo-success)](#)
[![Docker](https://img.shields.io/badge/Docker-Hub%20Registrado-blue?logo=docker)](https://hub.docker.com/r/eduarpj/asistente-auditoria)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Ollama](https://img.shields.io/badge/IA%20Engine-Llama%203.1%208B%20(Oracle%20Cloud)-orange)](#)
[![Licencia](https://img.shields.io/badge/Uso-Académico%20%2F%20Grado-green)](#)

---

## 📌 1. Descripción del Proyecto
**Audiflow** es una plataforma web integral asistida por Inteligencia Artificial y reglas determinísticas diseñada para automatizar la auditoría de contratos financieros, licencias de software (SaaS) y acuerdos de nivel de servicio (SLA).

### ⚠️ Problema
La revisión manual de contratos legales y de software en pequeñas y medianas empresas (pymes) o entidades financieras toma horas, es propensa al error humano por fatiga y exige asesoría jurídica especializada de alto costo.

### 💡 Solución
El usuario carga contratos en formato PDF a la plataforma web. Audiflow:
1. Extrae y preprocesa el texto completo del documento (OCR / PyPDF).
2. Evalúa **14 reglas normativas determinísticas** (RGPD / Habeas Data, Lavado de Activos SARLAFT, Anticorrupción FCPA/ISO 37001, Seguridad ISO 27001).
3. Ejecuta **análisis semántico profundo con Llama 3.1 8B** en servidor privado on-premise (Oracle Cloud VPS), garantizando **confidencialidad de datos (costo cero en tokens)**.
4. Muestra un panel visual con **Semáforo de Riesgo (🔴 Rojo / 🟡 Amarillo / 🟢 Verde)**, resumen ejecutivo en lenguaje simple y recomendaciones de negociación.

---

## 🖥️ 2. Arquitectura de la Solución

\\\
+------------------------------------------------------------------------+
|                     Audiflow Web Dashboard                             |
|  - Carga Drag & Drop de PDFs                                           |
|  - Semáforo Dinámico de Riesgos (Rojo, Amarillo, Verde)                |
|  - Resumen Ejecutivo para Pymes & Desglose por Categorías              |
|  - Tabla de Cláusulas Críticas & Evidencia Textual                     |
+-----------------------------------+------------------------------------+
                                    | REST API (HTTP)
+-----------------------------------v------------------------------------+
|                      FastAPI Backend Service (api/)                    |
|  - POST /v1/audit-contract-ai (Pipeline Híbrido: Reglas + Llama 3.1)   |
|  - POST /v1/process-pdf       (Extracción de Texto y Chunking)         |
|  - POST /v1/evaluate-risk     (Scoring de Reglas Normativas)           |
|  - GET  /v1/health            (Monitor de Conectividad con VPS)        |
+-----------------+----------------------------------+-------------------+
                  |                                  |
+-----------------v----------------+ +---------------v-------------------+
|   Motor de Scoring Determinístico| |   Servidor Oracle Cloud (VPS)     |
|   14 Reglas Normativas (Pydantic)| |   Ollama + Llama 3.1 8B (ARM64)   |
|   - RGPD / Habeas Data           | |   - 4 OCPUs, 24 GB RAM            |
|   - SARLAFT / SAGRILAFT          | |   - Inferencia 100% Confidencial  |
|   - Anticorrupción & Ciberseg.   | |   - Soberanía de Datos ( costo) |
+----------------------------------+ +-----------------------------------+
\\\

---

## 🚀 3. Inicio Rápido

### Requisitos Previos
- Python 3.10+ instalado.
- Conexión a internet (para enlazar con el servidor Ollama en Oracle Cloud).

### Paso 1: Instalar dependencias
\\\powershell
cd api
pip install -r requirements.txt
\\\

### Paso 2: Iniciar el servidor Audiflow
\\\powershell
python main.py
\\\

### Paso 3: Abrir en el navegador
- 🌐 **Dashboard Visual**: Abre [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- 📖 **Documentación Swagger API**: Abre [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

*(Puedes arrastrar el archivo de prueba incluido en data/samples/contrato_auditoria_muestra.pdf para ver la auditoría en tiempo real).*

---

## 📋 4. Roadmap de Desarrollo del Proyecto de Grado
- [x] **Paso 1**: Pruebas de Docker, Docker Compose y publicación en Docker Hub (\eduarpj/asistente-auditoria:v0.1\).
- [x] **Paso 2**: Configuración de Git, repositorio en GitHub y tablero de tareas (GitHub Projects).
- [x] **Paso 3**: Compartir repositorio con el docente evaluador.
- [x] **Paso 4**: Redacción del documento de propuesta técnica y memoria de grado (\docs/DOCUMENTO_PROYECTO.md\).
- [x] **Paso 8**: Modelado y especificación de Diagramas de Casos de Uso UML (\docs/DIAGRAMAS_CASOS_DE_USO.md\).
- [x] **Paso 9**: Modelado y especificación de Diagramas de Proceso BPMN (\docs/DIAGRAMAS_PROCESO_BPMN.md\).
- [x] **Paso 5**: Investigación y prototipo experimental de RAG + LangChain (\docs/05_MOTOR_IA_RAG_LANGCHAIN.md\).
- [x] **Paso 6**: Experimentación con Prompting estructurado y arnés de evaluación (\docs/06_MOTOR_IA_PROMPT_HARNESS.md\).
- [x] **Paso 7**: Despliegue de Ollama con Llama 3.1 8B en servidor Oracle Cloud VPS (Ampere A1, 24GB RAM).
- [x] **Paso 10**: Construcción de la API Backend en FastAPI con scoring de 14 reglas normativas (\pi/main.py\).
- [x] **Paso 11**: Construcción del Dashboard Frontend interactivo (\pi/static/index.html\).
- [ ] **Paso 12**: Pruebas finales integradas con contratos reales y preparación de sustentación.

---

## 👨‍💻 Autores
- **Eduardo Pedroza, Daysmir Hugueth, Antonio Guerrero**
- Proyecto de Grado para Titulación Profesional en Ingeniería de Software.