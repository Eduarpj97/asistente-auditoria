import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with generous limits for PDF base64 payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI SDK with standard telemetry header (opcional)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy_key_audiflow',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JSON Schema for structured contract audit
const auditSchema = {
  type: Type.OBJECT,
  properties: {
    contractTitle: { type: Type.STRING, description: 'Título o denominación formal del contrato' },
    documentType: { type: Type.STRING, description: 'Tipo legal de contrato (e.g., Servicios, Arrendamiento, NDA, Laboral)' },
    parties: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Nombre o razón social de la parte' },
          role: { type: Type.STRING, description: 'Rol (e.g., Prestador, Cliente, Arrendador, Contratista)' },
          idNumber: { type: Type.STRING, description: 'Identificación fiscal o tributaria si existe' }
        },
        required: ['name', 'role']
      }
    },
    effectiveDate: { type: Type.STRING, description: 'Fecha de entrada en vigor o firma (YYYY-MM-DD o formato legible)' },
    expirationDate: { type: Type.STRING, description: 'Fecha de vencimiento, fin o terminación (YYYY-MM-DD o formato legible)' },
    renewalTerms: { type: Type.STRING, description: 'Condiciones de prórroga o renovación tácita/automática' },
    totalValue: { type: Type.STRING, description: 'Monto, contraprestación económica o moneda' },
    governingLaw: { type: Type.STRING, description: 'Jurisdicción y ley aplicable' },
    overallRiskScore: { type: Type.NUMBER, description: 'Puntuación de riesgo general de 0 a 100 (0 bajo, 100 muy peligroso)' },
    complianceScore: { type: Type.NUMBER, description: 'Nivel de cumplimiento normativo estimado de 0 a 100%' },
    summary: { type: Type.STRING, description: 'Resumen ejecutivo claro y comprensible de las obligaciones y alcance' },
    clauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Identificador único de la cláusula' },
          title: { type: Type.STRING, description: 'Nombre de la cláusula' },
          originalSnippet: { type: Type.STRING, description: 'Fragmento o síntesis del texto analizado' },
          category: { type: Type.STRING, description: 'Categoría: confidencialidad, penalizaciones, propiedad_intelectual, terminacion, responsabilidad, pagos, otros' },
          riskLevel: { type: Type.STRING, description: 'Nivel de riesgo: low, medium, high, critical' },
          finding: { type: Type.STRING, description: 'Hallazgo jurídico o contingencia detectada' },
          recommendation: { type: Type.STRING, description: 'Recomendación clara de enmienda o mitigación' },
          compliant: { type: Type.BOOLEAN, description: 'Indica si cumple con buenas prácticas contractuales' }
        },
        required: ['id', 'title', 'category', 'riskLevel', 'finding', 'recommendation', 'compliant']
      }
    },
    risksIdentified: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Nombre del riesgo' },
          severity: { type: Type.STRING, description: 'critical, high, medium, low' },
          description: { type: Type.STRING, description: 'Detalle del peligro legal, financiero u operativo' },
          mitigation: { type: Type.STRING, description: 'Acción preventiva recomendada' }
        },
        required: ['title', 'severity', 'description', 'mitigation']
      }
    },
    keyDeadlines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Fecha límite aproximada o exacta YYYY-MM-DD' },
          title: { type: Type.STRING, description: 'Hito o plazo (e.g., Preaviso no renovación, Primer pago, Entrega)' },
          daysRemaining: { type: Type.NUMBER, description: 'Días estimados restantes desde la fecha actual' },
          urgency: { type: Type.STRING, description: 'urgent, warning, normal' },
          description: { type: Type.STRING, description: 'Consecuencia de no atender el plazo' }
        },
        required: ['date', 'title', 'urgency', 'description']
      }
    },
    missingEssentialClauses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Cláusulas esenciales ausentes que deberían incluirse para proteger a la organización'
    }
  },
  required: [
    'contractTitle',
    'documentType',
    'parties',
    'overallRiskScore',
    'complianceScore',
    'summary',
    'clauses',
    'risksIdentified',
    'keyDeadlines',
    'missingEssentialClauses'
  ]
};

// API route to audit a contract (via PDF base64 or text)
app.post('/api/audit-contract', async (req, res) => {
  try {
    const { pdfBase64, textContent, fileName } = req.body;

    if (!pdfBase64 && !textContent) {
      return res.status(400).json({ error: 'Se requiere el contenido del archivo PDF o el texto del contrato.' });
    }

    const systemPrompt = `Eres un auditor legal experto y senior de la plataforma "Audiflow - Software de Auditoría".
Tu objetivo es realizar una auditoría rigurosa, minuciosa y profesional sobre el contrato o cláusulas provistas.
Debes:
1. Identificar partes, tipo de contrato, montos, vigencias y fechas clave.
2. Analizar exhaustivamente cada cláusula crítica: penalidades, exclusividades, limitaciones de responsabilidad, cesión de propiedad intelectual, resolución unilateral, confidencialidad, garantías e indemnizaciones.
3. Evaluar el riesgo con objetividad: señalar cláusulas desproporcionadas, asimétricas, ambiguas o que violen normativas habituales.
4. Detectar omisiones graves (cláusulas que NO están pero deberían estar).
5. Extraer hitos y fechas de vencimiento con fecha proyectada para configurar alertas automáticas.
6. Presentar hallazgos y recomendaciones en español formal, claro y directamente accionable para el equipo de legales y control interno.`;

    const userPrompt = `Realiza la auditoría legal completa del siguiente documento: "${fileName || 'Contrato'}".`;

    const parts: any[] = [];

    if (pdfBase64) {
      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
    }

    if (textContent) {
      parts.push({
        text: `Contenido del contrato a auditar:\n\n${textContent}`,
      });
    }

    parts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: auditSchema,
        temperature: 0.2,
      },
    });

    const rawText = response.text?.trim() || '{}';
    const auditData = JSON.parse(rawText);

    return res.json({
      success: true,
      data: auditData,
    });
  } catch (error: any) {
    console.error('Error in contract audit:', error);
    return res.status(500).json({
      error: 'Error al procesar la auditoría del contrato',
      details: error?.message || 'Error desconocido del motor de auditoría',
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Audiflow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
