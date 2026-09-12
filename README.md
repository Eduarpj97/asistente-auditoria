# Audiflow — Asistente de Auditoría y Cumplimiento Regulatorio para Contratos

[![Docker Image](https://img.shields.io/badge/docker%20hub-eduarpj%2Fasistente--auditoria-blue?logo=docker)](https://hub.docker.com/r/eduarpj/asistente-auditoria)
[![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo%20(MVP)-orange)](#)
[![Licencia](https://img.shields.io/badge/Uso-Académico%20%2F%20Grado-green)](#)

## 📌 1. Descripción del Proyecto
**Audiflow** es una plataforma web asistida por Inteligencia Artificial diseñada para optimizar y automatizar el proceso de auditoría y análisis de cumplimiento regulatorio en contratos financieros, licencias de software (SaaS) y acuerdos de nivel de servicio (SLA).

### ⚠️ Problema
La revisión manual de contratos legales y de software en pequeñas y medianas empresas (pymes) o entidades financieras toma horas, es propensa al error humano por fatiga y requiere asesoría legal especializada de alto costo.

### 💡 Solución
El usuario carga contratos en formato PDF a la plataforma web. El sistema:
1. Extrae y segmenta las cláusulas críticas.
2. Detecta riesgos normativos (penalidades abusivas, SLAs ambiguos, rescisiones desfavorables, brechas de privacidad).
3. Presenta un informe visual ejecutivo con semáforo de riesgos (Rojo, Amarillo, Verde) y explicaciones en lenguaje claro.

---

## 🛠️ 2. Arquitectura y Tecnologías
- **Infraestructura**: Docker, Docker Compose, Docker Hub (eduarpj/asistente-auditoria), GitHub Actions (CI/CD).
- **Backend**: Python / FastAPI / Pydantic.
- **Motores de IA Evaluados**: 
  - **Opción 1 (RAG + LangChain)**: Segmentación y búsqueda semántica en bases vectoriales para citas textuales con trazabilidad (docs/05_MOTOR_IA_RAG_LANGCHAIN.md).
  - **Opción 2 (Prompt Harness)**: Arnés de pruebas con extracción JSON estructurada y validación con Pydantic (docs/06_MOTOR_IA_PROMPT_HARNESS.md).
  - **Opción 3 (Ollama Local)**: Inferencia 100% on-premise con modelos de pesos abiertos (Llama 3.1 / Qwen 2.5) para garantizar confidencialidad de datos contractuales y costo cero (docs/07_MOTOR_IA_OLLAMA_LOCAL.md).
- **Frontend**: Dashboard visual interactivo con semáforo de riesgo y visualizador de cláusulas.

---

## 🚀 3. Inicio Rápido con Docker

### Opción A: Usando la imagen publicada en Docker Hub
\\\ash
docker run -d -p 8080:80 eduarpj/asistente-auditoria:v0.1
\\\

### Opción B: Usando Docker Compose localmente
\\\ash
docker compose up -d
\\\
Luego abre tu navegador en [http://localhost:8080](http://localhost:8080).

Para detener los servicios:
\\\ash
docker compose down
\\\

---

## 📋 4. Roadmap de Desarrollo
- [x] **Paso 1**: Pruebas de Docker, Docker Compose y publicación en Docker Hub (\eduarpj\).
- [x] **Paso 2**: Configuración de Git, repositorio en GitHub y tablero de tareas (GitHub Projects).
- [x] **Paso 3**: Compartir repositorio con el docente evaluador.
- [x] **Paso 4**: Redacción del documento de propuesta técnica y memoria de grado (\docs/DOCUMENTO_PROYECTO.md\).
- [x] **Paso 8**: Modelado y especificación de Diagramas de Casos de Uso UML (\docs/DIAGRAMAS_CASOS_DE_USO.md\).
- [x] **Paso 9**: Modelado y especificación de Diagramas de Proceso BPMN (\docs/DIAGRAMAS_PROCESO_BPMN.md\).
- [x] **Paso 5**: Investigación y prototipo experimental de RAG + LangChain (\docs/05_MOTOR_IA_RAG_LANGCHAIN.md\).
- [x] **Paso 6**: Experimentación con Prompting estructurado y arnés de evaluación (\docs/06_MOTOR_IA_PROMPT_HARNESS.md\).
- [x] **Paso 7**: Integración y arquitectura con Ollama para privacidad local (\docs/07_MOTOR_IA_OLLAMA_LOCAL.md\).
- [ ] **Paso 10**: Construcción de la API Backend en FastAPI (Parseo PDF + Motor de Auditoría integrado).
- [ ] **Paso 11**: Construcción del Dashboard Frontend interactivo (Semáforo de riesgo + Vista de cláusulas).
- [ ] **Paso 12**: Pruebas finales integradas con contratos reales y preparación de sustentación.

---

## 👨‍💻 Autores
- **Eduardo Pedroza, Daysmir Hugueth, Antonio Guerrero** (@eduarpj)
- Proyecto de Grado para Titulación Profesional.