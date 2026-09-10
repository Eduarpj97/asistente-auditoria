# DOCUMENTO DE PROPUESTA Y MEMORIA TÉCNICA DE PROYECTO DE GRADO

**Título del Proyecto**:  
*Asistente Inteligente de Auditoría y Cumplimiento Regulatorio para Contratos Financieros y de Software*

**Autor**: Eduardo Pedroza, Daysmir Hugueth, Antonio Guerrero

**Usuario GitHub / Docker Hub**: eduarpj  
**Área Temática**: Inteligencia Artificial Aplicada, Procesamiento de Lenguaje Natural (NLP), Ingeniería de Software  
**Fecha**: Septiembre de 2026  

---

## 1. INTRODUCCIÓN Y PLANTEAMIENTO DEL PROBLEMA

### 1.1. Contexto
En el ecosistema empresarial actual, las pequeñas y medianas empresas (pymes), así como organizaciones financieras y tecnológicas, gestionan cotidianamente decenas de contratos críticos: Acuerdos de Nivel de Servicio (SLA), licencias de software como servicio (SaaS), contratos de confidencialidad (NDA) y cláusulas de responsabilidad civil.

### 1.2. Planteamiento del Problema
La revisión de estos documentos se realiza tradicionalmente de forma manual. Este procedimiento adolece de tres debilidades fundamentales:
1. **Consumo excesivo de tiempo**: Analizar un contrato extenso de 20 a 50 páginas requiere entre 3 y 8 horas de lectura detallada.
2. **Alta probabilidad de error por fatiga**: Términos ambiguos, renovaciones automáticas no deseadas o penalidades desproporcionadas pasan desapercibidas.
3. **Costo prohibitivo**: La contratación permanente o tercerizada de bufetes legales especializados resulta inaccesible para la mayoría de pymes.

---

## 2. JUSTIFICACIÓN
El uso de modelos de lenguaje avanzados (LLMs) combinados con arquitecturas de recuperación de información (RAG - Retrieval-Augmented Generation) y modelos locales de código abierto (Ollama) permite democratizar la auditoría contractual. 

Asimismo, la implementación de modelos en entornos locales (on-premise / edge) garantiza la **confidencialidad de los datos corporativos**, evitando que información contractual sensible viaje a servidores de terceros en la nube, satisfaciendo estrictas regulaciones de privacidad de datos (GDPR / legislaciones locales).

---

## 3. OBJETIVOS

### 3.1. Objetivo General
Diseñar, desarrollar e implementar una plataforma web asistida por Inteligencia Artificial capaz de auditar contratos financieros y licencias de software en formato PDF, extrayendo cláusulas críticas, detectando riesgos normativos y presentando un diagnóstico ejecutivo estructurado.

### 3.2. Objetivos Específicos
1. **Configurar un entorno de desarrollo reproducible** basado en contenedores Docker y Docker Compose para backend, frontend y motores auxiliares.
2. **Modelar los procesos de negocio y requerimientos del sistema** mediante diagramas de Casos de Uso (UML) y mapas de proceso BPMN (AS-IS y TO-BE).
3. **Evaluar y comparar técnica y experimentalmente** dos enfoques de procesamiento con IA:
   - *Opción 1*: RAG con LangChain y bases de datos vectoriales para contraste de cláusulas frente a normativas estándar.
   - *Opción 2*: Inferencia estructurada con esquemas de validación (Pydantic / Prompt Harness) para extracción directa de entidades de riesgo.
4. **Implementar inferencia local con Ollama** evaluando viabilidad, latencia y privacidad frente a modelos propietarios en la nube.
5. **Construir un Producto Mínimo Viable (MVP)** funcional con interfaz gráfica que permita la carga de archivos, análisis automatizado y generación visual de dictámenes de riesgo.

---

## 4. ALCANCE Y LIMITACIONES

### 4.1. Alcance
- Procesamiento de documentos contractuales digitales en formato PDF.
- Detección de al menos 4 categorías críticas de riesgo:
  - Cláusulas de Terminación y Renovación Automática.
  - Penalidades Financieras y Multas por Incumplimiento.
  - Niveles de Servicio (SLA: Disponibilidad, Tiempos de Respuesta, Ventanas de Mantenimiento).
  - Propiedad Intelectual y Limitación de Responsabilidad.
- Generación de un tablero visual con clasificación semáforo (Alto, Medio, Bajo).

### 4.2. Limitaciones
- El sistema actúa como una herramienta de apoyo a la decisión (asistente de auditoría) y no sustituye legalmente la fe pública de un abogado.
- No procesará en esta primera fase contratos manuscritos con caligrafía ilegible sin OCR avanzado previo.

---

## 5. REQUERIMIENTOS DEL SISTEMA

### 5.1. Requerimientos Funcionales (RF)
- **RF-01 (Carga de Documentos)**: El sistema debe permitir al usuario cargar contratos en formato PDF de hasta 20 MB.
- **RF-02 (Extracción de Texto)**: El sistema debe extraer y preprocesar el texto completo preservando la coherencia de secciones y cláusulas.
- **RF-03 (Análisis de Riesgos)**: El motor de IA debe evaluar el contrato contra reglas de negocio y marcos regulatorios predefinidos.
- **RF-04 (Categorización de Cláusulas)**: El sistema debe etiquetar y extraer las cláusulas clave con citas textuales y número de página.
- **RF-05 (Semáforo de Cumplimiento)**: El sistema debe calcular un índice global de riesgo clasificándolo en Alto (Rojo), Medio (Amarillo) o Bajo (Verde).
- **RF-06 (Exportación de Reporte)**: El sistema debe permitir descargar o imprimir un resumen ejecutivo del dictamen de auditoría.

### 5.2. Requerimientos No Funcionales (RNF)
- **RNF-01 (Portabilidad)**: Toda la solución debe ser desplegable mediante Docker Compose en cualquier sistema operativo moderno.
- **RNF-02 (Privacidad)**: El procesamiento de datos debe permitir ejecución 100% local mediante Ollama para salvaguardar secretos comerciales.
- **RNF-03 (Tiempo de Respuesta)**: El tiempo de análisis de un contrato promedio (10 a 20 páginas) no debe exceder los 60 segundos en hardware local estándar.
- **RNF-04 (Usabilidad)**: La interfaz debe ser intuitiva para profesionales no técnicos en derecho o administración.

---

## 6. CRONOGRAMA DE TRABAJO (POCAS SEMANAS)

| Semana | Hito / Entregable | Estado |
|---|---|---|
| **Semana 1** | Configuración de Docker, GitHub, tableros Kanban, documento base docente y diagramas iniciales | En curso |
| **Semana 2** | Modelado BPMN, Casos de Uso y pruebas comparativas de motores IA (RAG vs Prompting vs Ollama) | Pendiente |
| **Semana 3** | Desarrollo del Backend (FastAPI + PDF Parser + Motor de Auditoría) | Pendiente |
| **Semana 4** | Desarrollo del Frontend (Dashboard con semáforo de riesgo y visualizador de cláusulas) | Pendiente |
| **Semana 5** | Pruebas integradas con contratos reales/sintéticos, ajustes de precisión y preparación de sustentación | Pendiente |
