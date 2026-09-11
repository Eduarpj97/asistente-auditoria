# Asistente de Auditoría y Cumplimiento Regulatorio para Contratos Financieros o de Software

[![Docker Image](https://img.shields.io/badge/docker%20hub-eduarpj%2Fasistente--auditoria-blue?logo=docker)](https://hub.docker.com/r/eduarpj/asistente-auditoria)
[![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo%20(MVP)-orange)](#)
[![Licencia](https://img.shields.io/badge/Uso-Acad%C3%A9mico%20%2F%20Grado-green)](#)

## ?? 1. Descripción del Proyecto
Este proyecto consiste en una plataforma web asistida por Inteligencia Artificial diseñada para optimizar y automatizar el proceso de auditoría y análisis de cumplimiento regulatorio en contratos financieros, licencias de software (SaaS) y acuerdos de nivel de servicio (SLA).

### ?? Problema
La revisión manual de contratos legales y de software en pequeñas y medianas empresas (pymes) o entidades financieras toma horas, es propensa al error humano por fatiga y requiere asesoría legal especializada de alto costo.

### ?? Solución
El usuario carga contratos en formato PDF a una plataforma web. El sistema:
1. Extrae y segmenta las cláusulas críticas.
2. Detecta riesgos normativos (penalidades abusivas, SLAs ambiguos, rescisiones desfavorables, brechas de privacidad).
3. Presenta un informe visual ejecutivo con semáforo de riesgos (Rojo, Amarillo, Verde) y explicaciones en lenguaje claro.

---

## ??? 2. Arquitectura y Tecnologías
- **Infraestructura**: Docker, Docker Compose, Docker Hub (eduarpj/asistente-auditoria).
- **Backend**: Python / FastAPI.
- **Motor de IA**: 
  - *Opción 1*: RAG (Retrieval-Augmented Generation) con LangChain y base vectorial (ChromaDB / FAISS).
  - *Opción 2*: Extracción estructurada con Prompt Harness y esquemas Pydantic.
  - *Privacidad / Local*: Inferencia local de modelos de pesos abiertos con **Ollama** (Llama 3.1 / Qwen 2.5) para garantizar confidencialidad de datos contractuales.
- **Frontend**: Panel de control interactivo con carga de archivos y métricas de riesgo.

---

## ?? 3. Inicio Rápido con Docker

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

## ?? 4. Roadmap de Desarrollo
- [x] **Paso 1**: Pruebas de Docker, Docker Compose y publicación en Docker Hub (\eduarpj\).
- [ ] **Paso 2**: Configuración de Git, repositorio en GitHub y tablero de tareas (GitHub Projects).
- [ ] **Paso 3**: Compartir repositorio con el docente evaluador.
- [ ] **Paso 4**: Redacción y entrega del documento de memoria técnica / propuesta de grado.
- [ ] **Paso 5**: Implementación y análisis de RAG + LangChain.
- [ ] **Paso 6**: Experimentación con Prompting estructurado y arnés de evaluación.
- [ ] **Paso 7**: Integración de Ollama (modelos open-weights locales).
- [ ] **Paso 8**: Modelado de Diagramas de Casos de Uso (UML).
- [ ] **Paso 9**: Modelado de Diagramas de Proceso BPMN (AS-IS y TO-BE).
- [ ] **Paso 10**: Construcción e integración del MVP funcional.

---

## ????? Autor
- **Eduardo Pedroza, Daysmir Hugueth, Antonio Guerrero** (@eduarpj)
- Proyecto de Grado para Titulación Profesional.
