# ESPECIFICACIÓN Y DIAGRAMAS DE CASOS DE USO (UML)

**Proyecto**: Asistente de Auditoría y Cumplimiento Regulatorio para Contratos  
**Autor**: Eduardo (@Eduarpj97)  
**Versión**: 1.0  

---

## 1. Identificación de Actores

1. **Auditor Legal / Oficial de Cumplimiento (Compliance Officer)**:
   - Rol principal del sistema. Responsable de cargar los contratos, supervisar el análisis, validar las discrepancias marcadas por la IA y autorizar el dictamen final.
2. **Administrador del Sistema**:
   - Encargado de la configuración de normativas base (marcos ISO 27001, GDPR, plantillas SLA estándar) y la gestión de modelos y proveedores de IA (Ollama / APIs).
3. **Motor de Inteligencia Artificial (Sistema Externo / Subsistema)**:
   - Subsistema automatizado que realiza el procesamiento de lenguaje natural (NLP), extracción de cláusulas, búsqueda semántica (RAG) y cálculo del nivel de severidad del riesgo.

---

## 2. Diagrama General de Casos de Uso (UML)

\\\mermaid
flowchart LR
    %% Actores
    Auditor["?? Auditor / Oficial de Cumplimiento"]
    Admin["?? Administrador de TI"]
    MotorIA["?? Motor de IA (LangChain / Ollama)"]

    subgraph Plataforma [" Plataforma Web de Auditoría Contractual "]
        CU01(["CU-01: Cargar Contrato PDF"])
        CU02(["CU-02: Preprocesar y Extraer Texto"])
        CU03(["CU-03: Ejecutar Auditoría de Cláusulas"])
        CU04(["CU-04: Evaluar Riesgos y Semáforo"])
        CU05(["CU-05: Visualizar Dashboard de Resultados"])
        CU06(["CU-06: Ajustar / Validar Dictamen (Human-in-the-Loop)"])
        CU07(["CU-07: Exportar Informe de Auditoría (PDF/JSON)"])
        CU08(["CU-08: Gestionar Reglas de Cumplimiento y SLAs"])
        CU09(["CU-09: Seleccionar Motor de Inferencia (RAG/Ollama)"])
    end

    %% Relaciones Auditor
    Auditor --> CU01
    Auditor --> CU05
    Auditor --> CU06
    Auditor --> CU07

    %% Relaciones Admin
    Admin --> CU08
    Admin --> CU09

    %% Relaciones Include / Extend
    CU01 -.->|<<include>>| CU02
    CU02 -.->|<<include>>| CU03
    CU03 -.->|<<include>>| CU04
    CU04 -.->|<<include>>| CU05
    CU06 -.->|<<extend>>| CU05

    %% Interacción Motor IA
    CU03 <--> MotorIA
    CU04 <--> MotorIA
\\\

---

## 3. Especificación Detallada de Casos de Uso

### CU-01: Cargar Contrato PDF
- **Actor Principal**: Auditor Legal.
- **Precondición**: El usuario tiene acceso a la plataforma web.
- **Flujo Principal**:
  1. El auditor arrastra o selecciona un archivo en formato PDF (contrato, SLA o licencia).
  2. El sistema valida formato (.pdf), integridad y tamaño máximo permitido (20 MB).
  3. El sistema almacena temporalmente el archivo y genera un identificador único de sesión de auditoría.
- **Flujo Alternativo (A1 - Archivo no válido)**:
  - Si el archivo no es PDF o excede el tamaño, el sistema muestra una alerta de error y solicita un nuevo archivo.

### CU-03: Ejecutar Auditoría de Cláusulas Críticas
- **Actor Principal**: Auditor Legal / Motor de IA.
- **Flujo Principal**:
  1. El sistema invoca al motor de IA (vía RAG o prompting estructurado).
  2. El motor analiza las secciones clave:
     - Cláusulas de rescisión o terminación anticipada.
     - Niveles de disponibilidad de servicio (SLA uptime %).
     - Penalidades financieras y límites de indemnización.
     - Ley aplicable, jurisdicción y protección de datos.
  3. El sistema asocia a cada hallazgo la cita textual del contrato y la página de origen.

### CU-04: Evaluar Riesgos y Asignar Semáforo
- **Actor Principal**: Motor de IA.
- **Flujo Principal**:
  1. El sistema compara las cláusulas extraídas contra los umbrales de riesgo normativo.
  2. Asigna una calificación cuantitativa y cualitativa:
     - ?? **Riesgo Alto (Crítico)**: Cláusulas abusivas, multas desmedidas, SLAs indefinidos.
     - ?? **Riesgo Medio (Advertencia)**: Términos vagos, renovación automática con plazo corto de preaviso.
     - ?? **Riesgo Bajo (Conforme)**: Términos equilibrados y conformes a buenas prácticas de la industria.

### CU-06: Ajustar y Validar Dictamen (Human-in-the-Loop)
- **Actor Principal**: Auditor Legal.
- **Flujo Principal**:
  1. El auditor revisa las cláusulas marcadas en el dashboard.
  2. Si discrepa con la clasificación de la IA, puede modificar el nivel de riesgo o añadir comentarios de observación jurídica.
  3. El sistema guarda la versión validada por el humano.

### CU-07: Exportar Informe de Auditoría
- **Actor Principal**: Auditor Legal.
- **Flujo Principal**:
  1. El auditor hace clic en "Exportar Informe".
  2. El sistema compila un reporte formal estructurado (resumen ejecutivo, semáforo, tabla de cláusulas y observaciones).
  3. Descarga el documento listo para ser remitido a la gerencia o al cliente.
