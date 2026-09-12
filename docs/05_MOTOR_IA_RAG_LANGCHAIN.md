# Paso 5: Arquitectura RAG y LangChain (Opción 1 de Motor de IA)

**Proyecto**: Audiflow — Asistente de Auditoría y Cumplimiento Regulatorio para Contratos  
**Autor**: Eduardo (@Eduarpj97)  
**Entregable Académico**: Investigación y Diseño del Motor de IA basado en RAG  

---

## 1. ¿Qué es RAG y por qué es fundamental en auditoría contractual?

**RAG** son las siglas de **Retrieval-Augmented Generation** (Generación Aumentada por Recuperación). Es un patrón de arquitectura de Inteligencia Artificial que combina dos componentes:
1. **Recuperador (Retriever)**: Un motor de búsqueda semántica que localiza fragmentos específicos de información en una base de datos vectorial.
2. **Generador (Generator)**: Un Modelo de Lenguaje Grande (LLM) que sintetiza y redacta la respuesta condicionada a la evidencia encontrada.

`mermaid
flowchart LR
    PDF["📄 Contrato PDF"] --> Splitter["✂️ Chunking & Text Splitting"]
    Splitter --> Embed["🧮 Generador de Embeddings"]
    Embed --> VDB[("🗄️ Vector Store (ChromaDB / FAISS)")]
    
    Pregunta["❓ Consulta: '¿Qué SLA y penalidades aplican?'"] --> EmbedQ["🧮 Embedding de la Consulta"]
    EmbedQ --> Search["🔍 Búsqueda por Similitud (Coseno)"]
    VDB --> Search
    Search --> Chunks["📑 Fragmentos Relevantes (Top-K)"]
    
    Chunks --> Prompt["📝 Prompt de Auditoría + Evidencia"]
    Pregunta --> Prompt
    Prompt --> LLM["🤖 LLM (Ollama / Cloud)"]
    LLM --> Respuesta["📊 Dictamen de Riesgo con Cita Textual"]
`

---

## 2. El Problema de usar LLMs puros (sin RAG) en contratos legales

| Desafío en Auditoría Legal | LLM Tradicional (Sin RAG) | Solución con RAG (Audiflow) |
|---|---|---|
| **Alucinaciones** | El modelo inventa porcentajes de SLA o penalidades si no recuerda bien el texto. | El LLM está **forzado por prompt** a responder únicamente citando el texto recuperado. |
| **Límite de contexto** | En contratos de 50 o 100 páginas, el costo de tokens se dispara o el LLM sufre de *'Lost in the Middle'*. | Solo se envían al LLM los 3 o 4 fragmentos de cláusulas relevantes al riesgo consultado. |
| **Trazabilidad (UC12)** | Es una 'caja negra'; el usuario no sabe en qué página está la regla. | Cada fragmento recuperado incluye metadatos exactos (página, sección, cláusula). |
| **Actualización de Normativas** | Para actualizar leyes (ej. ISO 27001 o GDPR) habría que reentrenar el modelo ($). | Basta con agregar la nueva normativa al vector store sin tocar el modelo base. |

---

## 3. Componentes de LangChain utilizados en Audiflow

**LangChain** es el framework estándar de la industria para orquestar aplicaciones con LLMs. En Audiflow se estructura en 5 capas:

1. **Document Loaders**: Módulos para extraer texto de PDFs (PyPDFLoader o pdfplumber).
2. **Text Splitters (RecursiveCharacterTextSplitter)**: Divide el texto en fragmentos (*chunks*) de 500 a 1000 caracteres con un solapamiento (*overlap*) de 100 caracteres para no cortar cláusulas a la mitad.
3. **Embeddings Engine**: Algoritmo que transforma texto en vectores de números flotantes que representan su significado conceptual (ej. ll-MiniLM-L6-v2 o 
omic-embed-text).
4. **Vector Store**: Base de datos optimizada para indexar y consultar vectores de alta dimensión (ej. **ChromaDB** o **FAISS**).
5. **Chains (LCEL - LangChain Expression Language)**: Flujo declarativo que conecta la consulta, la recuperación de chunks y la inferencia del modelo.

---

## 4. Pipeline de Inferencia de Auditoría en Audiflow

\\\mermaid
sequenceDiagram
    autonumber
    actor Usuario as 👤 Usuario / Auditor
    participant Backend as ⚙️ Backend (FastAPI)
    participant VDB as 🗄️ ChromaDB (Vector Store)
    participant LLM as 🤖 LLM (Ollama / Llama 3.1)

    Usuario->>Backend: Carga contrato y solicita auditoría de SLAs y penalidades
    Backend->>VDB: Consulta de similitud vectorial (Embedding de 'SLA disponibilidad penalidades')
    VDB-->>Backend: Retorna Chunks de Cláusula Segunda y Cláusula Tercera (Score: 0.92)
    Backend->>LLM: Inyecta Prompt: 'Eres auditor. Con base en este texto, extrae uptime y multas: [Chunks]'
    LLM-->>Backend: Genera JSON con análisis, severidad y citas exactas
    Backend-->>Usuario: Muestra en el dashboard con semáforo y enlace a la cláusula original
\\\

---

## 5. Conclusiones y Viabilidad Académica para la Memoria de Grado

1. **Rigor Científico**: La combinación de búsqueda vectorial con LLMs elimina la arbitrariedad en la auditoría documental, satisfaciendo el requerimiento de confiabilidad del sistema.
2. **Escalabilidad**: Audiflow puede auditar un contrato de 10 páginas o uno de 200 páginas con el mismo consumo eficiente de memoria y tiempo de cómputo.
3. **Human-in-the-loop**: Al suministrar la cita exacta del contrato, el auditor humano valida en segundos la conclusión de la máquina, cumpliendo con el estándar de supervisión ética en IA.