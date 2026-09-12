# Paso 7: Inferencia Local con Ollama y Modelos Open-Weights (Opción 3 de IA)

**Proyecto**: Audiflow — Asistente de Auditoría y Cumplimiento Regulatorio para Contratos  
**Autor**: Eduardo (@Eduarpj97)  
**Entregable Académico**: Análisis de Soberanía de Datos, Privacidad Contractual e Integración de Ollama  

---

## 1. ¿Por qué Ollama es el motor predilecto para auditoría contractual en empresas?

En la auditoría de contratos financieros, licencias de software y acuerdos de confidencialidad (NDA), las empresas manejan **secretos comerciales, datos personales de directivos y tarifas sensibles**.

El uso de APIs en la nube comerciales (OpenAI, Anthropic, etc.) presenta dos grandes barreras:
1. **Riesgo Regulatorio y de Fuga de Información**: Enviar contratos corporativos a servidores de terceros en el extranjero puede violar normativas de privacidad (GDPR, Ley de Habeas Data local) y cláusulas de confidencialidad contractuales.
2. **Costo Recurrente por Tokens**: Auditar cientos de contratos de 30 páginas genera un gasto variable continuo e impredecible para una pyme.

> [!IMPORTANT]
> **Solución con Ollama**:
> Ollama permite ejecutar modelos de pesos abiertos (*Open-Weights*) como **Llama 3.1 (8B)**, **Qwen 2.5 (7B)** o **Mistral Nemo** en la infraestructura local (on-premise o servidor privado). **Los datos nunca salen de la red de la empresa y el costo por token es cero (.00).**

`mermaid
flowchart LR
    subgraph Entorno_Privado_Empresa [" Red Local Segura (On-Premise) "]
        PDF["📄 Contrato Confidencial"] --> FastAPI["⚙️ Backend Audiflow"]
        FastAPI --> Ollama["🦙 Servicio Ollama (Localhost:11434)"]
        Ollama --> LLM["🧠 Llama 3.1 / Qwen 2.5 (Pesos Abiertos)"]
        LLM --> Ollama
        Ollama --> FastAPI
        FastAPI --> Reporte["📊 Informe de Auditoría Seguro"]
    end
    
    Cloud[("☁️ Servidores Externos / Nube")]
    
    FastAPI -.->|❌ Ningún dato sale a la nube| Cloud
`

---

## 2. Modelos Open-Weights Recomendados para Audiflow

| Modelo | Desarrollador | Parámetros | RAM / VRAM Requerida | Especialidad en Auditoría |
|---|---|---|---|---|
| **Llama 3.1** | Meta AI | 8B | 8 GB RAM | Excelente razonamiento lógico, comprensión de cláusulas complejas y seguimiento de instrucciones. |
| **Qwen 2.5** | Alibaba Cloud | 7B | 8 GB RAM | Rendimiento sobresaliente en extracción estructurada de JSON y análisis de tablas numéricas de SLAs. |
| **Mistral Nemo** | Mistral AI | 12B | 12 GB RAM | Gran ventana de contexto nativa (hasta 128k tokens) ideal para contratos voluminosos. |

---

## 3. Despliegue de Ollama mediante Docker Compose

En Audiflow integramos Ollama como un microservicio contenerizado en docker-compose.yml:

\\\yaml
services:
  audiflow-backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    container_name: audiflow_ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_storage:/root/.ollama

volumes:
  ollama_storage:
\\\

---

## 4. Matriz Comparativa para la Memoria de Grado (Cloud vs Local)

| Criterio | Modelo Propietario en la Nube | Modelo Open-Weights con Ollama | Veredicto para Audiflow |
|---|---|---|---|
| **Privacidad de Datos** | Riesgo de filtración / Servidores en EE.UU. | 100% On-premise y Confidencial | **Gana Ollama (Cumple GDPR/NDA)** |
| **Costo Operativo** | Pago por millón de tokens ($) | Gratuito e ilimitado () | **Gana Ollama (Ahorro Pyme)** |
| **Dependencia de Internet** | Requiere conexión continua 24/7 | Funciona completamente offline | **Gana Ollama (Alta disponibilidad)** |
| **Consumo de Hardware** | Cero cómputo local | Requiere CPU moderna o GPU | **Gana Cloud (Ligero)** |
| **Facilidad de Auditoría** | Caja negra | Control total sobre pesos y versiones | **Gana Ollama (Transparencia)** |