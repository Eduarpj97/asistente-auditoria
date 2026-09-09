# MODELADO DE PROCESOS DE NEGOCIO (BPMN 2.0)

**Proyecto**: Asistente de Auditoría y Cumplimiento Regulatorio para Contratos  
**Autor**: Eduardo (@Eduarpj97)  
**Versión**: 1.0  

---

## 1. Contexto del Negocio y Metodología
Para fundamentar el impacto y retorno de inversión (ROI) del proyecto en la memoria de grado, se modela el proceso de auditoría contractual en dos estados:
1. **Proceso AS-IS (Estado Actual)**: Proceso manual tradicional llevado a cabo por asesores legales o personal administrativo en pymes.
2. **Proceso TO-BE (Estado Propuesto)**: Proceso optimizado y acelerado mediante el Asistente con Inteligencia Artificial.

---

## 2. Diagrama de Proceso AS-IS (Manual / Tradicional)

\\\mermaid
flowchart TD
    Inicio([?? Inicio: Contrato recibido]) --> T1[Recepción y radicación del PDF o documento impreso]
    T1 --> T2[Asignación manual a abogado o analista legal]
    T2 --> T3[Lectura secuencial manual del contrato completo (20-50 págs)]
    T3 --> T4[Búsqueda e identificación manual de cláusulas críticas]
    T4 --> T5[Cotejo manual contra estándares de la empresa o legislación]
    T5 --> G1{¿Dudas o términos ambiguos?}
    G1 -- Sí --> T6[Reuniones de consulta o re-lectura cruzada]
    T6 --> T7[Redacción manual del dictamen en procesador de texto]
    G1 -- No --> T7
    T7 --> T8[Revisión y firma manual del dictamen]
    T8 --> Fin([?? Fin: Informe entregado con demora])

    classDef danger fill:#fee2e2,stroke:#ef4444,stroke-width:2px;
    class T3,T4,T5,T6 danger;
\\\

> **Puntos Críticos del Proceso AS-IS**:
> - ? **Tiempo promedio**: De 24 a 72 horas por contrato.
> - ?? **Riesgo de omisión**: Fatiga visual del revisor ante documentos de alta extensión.
> - ?? **Costo elevado**: Dependencia absoluta de horas/hombre de especialistas legales.

---

## 3. Diagrama de Proceso TO-BE (Asistido por Plataforma e IA)

\\\mermaid
sequenceDiagram
    autonumber
    actor Auditor as ?? Auditor / Usuario
    participant Web as ?? Frontend (Dashboard)
    participant API as ?? Backend (FastAPI)
    participant IA as ?? Motor IA (RAG / Ollama)

    Auditor->>Web: Carga contrato en formato PDF
    Web->>API: Envía documento vía REST (multipart/form-data)
    Note over API: Valida formato, tamaño y extrae texto plano
    API->>IA: Envía fragmentos de texto + matriz de reglas normativas
    Note over IA: Análisis semántico, detección de riesgos y scoring
    IA-->>API: Retorna JSON estructurado (Cláusulas, Riesgo, Citas textuales)
    API-->>Web: Envía diagnóstico para renderizar
    Web-->>Auditor: Muestra semáforo (??/??/??) y resumen interactivo
    
    alt Auditor valida hallazgos
        Auditor->>Web: Aprueba o ajusta observaciones (Human-in-the-loop)
        Web->>API: Solicita generación de reporte final
        API-->>Web: Entrega PDF/Executive Summary
        Web-->>Auditor: Descarga informe listo para gerencia
    end
\\\

### Flujo Detallado de Carriles (Lanes BPMN TO-BE)

\\\mermaid
flowchart TD
    subgraph Lane_Usuario [" Carril: Auditor Legal "]
        Start([?? Inicio: Contrato listo]) --> B1[Arrastra PDF a la plataforma web]
        B6[Revisa tablero visual y semáforo de riesgo]
        B7{¿Requiere ajuste manual?}
        B8[Modifica nivel o agrega nota jurídica]
        B9[Descarga informe ejecutivo final]
        EndNode([?? Fin: Auditoría completada])
    end

    subgraph Lane_Sistema [" Carril: Plataforma Web & Backend "]
        B1 --> S1[Recibe PDF y extrae contenido textual]
        S1 --> S2[Segmenta texto en cláusulas y secciones]
        S3[Calcula índice consolidado de severidad]
        S3 --> B6
        B7 -- Sí --> B8
        B8 --> S4[Actualiza dictamen con cambios de auditor]
        B7 -- No --> S5[Consolida dictamen estándar]
        S4 --> B9
        S5 --> B9
        B9 --> EndNode
    end

    subgraph Lane_IA [" Carril: Motor de Inteligencia Artificial "]
        S2 --> IA1[Búsqueda RAG de cláusulas críticas en BD normativa]
        IA1 --> IA2[Evaluación de SLA, penalidades, rescisión y privacidad]
        IA2 --> IA3[Genera respuestas en JSON con citas de página y riesgo]
        IA3 --> S3
    end

    classDef ia fill:#e0e7ff,stroke:#6366f1,stroke-width:2px;
    class IA1,IA2,IA3 ia;
\\\

---

## 4. Matriz Comparativa de Eficiencia (Métrica para Sustentación)

| Métrica de Rendimiento | Proceso AS-IS (Manual) | Proceso TO-BE (Plataforma IA) | Beneficio / Mejora |
|---|---|---|---|
| **Tiempo de revisión inicial** | 180 a 360 minutos | Menos de 2 minutos | **Reducción > 95%** |
| **Detección de cláusulas ocultas** | Dependiente de fatiga humana (~70-85%) | Detección determinista con IA (> 95%) | **Mayor cobertura y rigor** |
| **Costo por contrato auditado** | Alto (horas profesionales) | Costo computacional mínimo (Ollama gratis) | **Ahorro económico drástico** |
| **Estandarización del informe** | Formatos dispares según el redactor | Reporte unificado con semáforo estándar | **Consistencia institucional** |
| **Seguridad y Confidencialidad** | Manejo de copias impresas o correos | Inferencia local privada en servidor interno | **Cumplimiento estricto de privacidad** |
