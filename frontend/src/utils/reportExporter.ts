import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import { ContractAudit } from '../types/audit';

function translateSeverity(severity: string): string {
  const map: Record<string, string> = {
    critical: 'CRÍTICO',
    high: 'ALTO',
    medium: 'MEDIO',
    low: 'BAJO',
  };
  return map[severity.toLowerCase()] || severity.toUpperCase();
}

export async function exportToWord(audit: ContractAudit): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'AUDIFLOW • SOFTWARE DE AUDITORÍA Y CONTROL',
                bold: true,
                color: '0F2744',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'INFORME TÉCNICO DE AUDITORÍA CONTRACTUAL Y EVALUACIÓN FORENSE',
                bold: true,
                color: '1E3E62',
                size: 24,
              }),
            ],
          }),

          // Metadata Info Block
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '1. Ficha Técnica del Documento', bold: true, color: '0F2744' })],
            spacing: { before: 200, after: 100 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createTableRow('Contrato / Título:', audit.contractTitle, true),
              createTableRow('Tipo de Documento:', audit.documentType),
              createTableRow('Fecha de Auditoría:', audit.auditDate),
              createTableRow('Auditor Asignado:', audit.auditedBy || 'Auditor Senior Audiflow'),
              createTableRow('Estado Dictamen:', audit.status.toUpperCase()),
              createTableRow('Vigencia:', `${audit.effectiveDate} hasta ${audit.expirationDate}`),
              createTableRow('Valor Económico:', audit.totalValue || 'No especificado'),
              createTableRow('Jurisdicción / Ley:', audit.governingLaw || 'Según estipulaciones contractuales'),
              createTableRow('Partes Involucradas:', audit.parties.map(p => `${p.name} (${p.role})`).join(' | ')),
            ],
          }),

          // Risk & Compliance Scorecard
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '2. Puntuación de Riesgo y Cumplimiento Normativo', bold: true, color: '0F2744' })],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Índice Global de Riesgo Contractual: ', bold: true }),
              new TextRun({
                text: `${audit.overallRiskScore} / 100 (${audit.overallRiskScore > 60 ? 'RIESGO ALTO / CRÍTICO' : audit.overallRiskScore > 35 ? 'RIESGO MODERADO' : 'RIESGO CONTROLADO'})`,
                bold: true,
                color: audit.overallRiskScore > 60 ? 'C53030' : audit.overallRiskScore > 35 ? 'D69E2E' : '2F855A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Grado de Cumplimiento Legal y Buenas Prácticas: ', bold: true }),
              new TextRun({
                text: `${audit.complianceScore}%`,
                bold: true,
                color: audit.complianceScore >= 80 ? '2F855A' : 'C53030',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Resumen del Documento
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '3. Resumen del Documento', bold: true, color: '0F2744' })],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: audit.summary, italics: false })],
            spacing: { after: 300 },
          }),

          // Identified Risks (Matriz con Citas del Original y Recomendaciones Legales)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '4. Matriz de Contingencias, Riesgos y Recomendaciones Legales', bold: true, color: '0F2744' })],
            spacing: { before: 300, after: 100 },
          }),
          ...audit.risksIdentified.flatMap((risk, idx) => {
            const riskParagraphs: Paragraph[] = [
              new Paragraph({
                spacing: { before: 140, after: 40 },
                children: [
                  new TextRun({ text: `${idx + 1}. ${risk.title} `, bold: true, size: 22, color: '0F2744' }),
                  new TextRun({
                    text: `[Severidad: ${translateSeverity(risk.severity)}]`,
                    bold: true,
                    color: risk.severity === 'critical' ? 'C53030' : risk.severity === 'high' ? 'C53030' : 'D69E2E',
                  }),
                ],
              }),
            ];

            if (risk.exactLocation) {
              riskParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: '🔍 Ubicación para Revisión con Lupa: ', bold: true, color: 'B7791F' }),
                    new TextRun({ text: risk.exactLocation, bold: true }),
                  ],
                })
              );
            }

            if (risk.quoteSnippet) {
              riskParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: '📄 Texto del Documento Original donde está el Riesgo: ', bold: true }),
                    new TextRun({ text: `"${risk.quoteSnippet}"`, italics: true, color: '4A5568' }),
                  ],
                })
              );
            }

            riskParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '• Detalle del Riesgo: ', bold: true }),
                  new TextRun({ text: risk.description }),
                ],
              })
            );

            if (risk.legalReference) {
              riskParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: '• Marco Normativo Aplicable: ', bold: true, color: '1A365D' }),
                    new TextRun({ text: risk.legalReference, color: '2B6CB0' }),
                  ],
                })
              );
            }

            riskParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '🛡️ Recomendación Legal & Preventiva: ', bold: true, color: '2F855A' }),
                  new TextRun({ text: risk.mitigation, italics: true }),
                ],
                spacing: { after: risk.suggestedDrafting ? 60 : 150 },
              })
            );

            if (risk.suggestedDrafting) {
              riskParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: '📝 Redacción Sugerida para Adenda: ', bold: true, color: '2B6CB0' }),
                    new TextRun({ text: `"${risk.suggestedDrafting}"`, italics: true }),
                  ],
                  spacing: { after: 150 },
                })
              );
            }

            return riskParagraphs;
          }),

          // Audited Clauses
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '5. Auditoría Cláusula por Cláusula (Trazabilidad Forense)', bold: true, color: '0F2744' })],
            spacing: { before: 300, after: 100 },
          }),
          ...audit.clauses.flatMap((clause, idx) => {
            const clauseParagraphs: Paragraph[] = [
              new Paragraph({
                spacing: { before: 160, after: 50 },
                children: [
                  new TextRun({ text: `${idx + 1}. ${clause.title} `, bold: true, size: 22, color: '0F2744' }),
                  new TextRun({
                    text: `(${clause.compliant ? 'CONFORME' : 'REQUIERE ATENCIÓN'} - RIESGO ${translateSeverity(clause.riskLevel)})`,
                    bold: true,
                    color: clause.compliant ? '2F855A' : 'C53030',
                  }),
                ],
              }),
            ];

            if (clause.exactLocation) {
              clauseParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: '🔍 Ubicación con Lupa: ', bold: true, color: 'B7791F' }),
                    new TextRun({ text: clause.exactLocation, bold: true }),
                  ],
                })
              );
            }

            clauseParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '📄 Cita Textual Literal: ', bold: true }),
                  new TextRun({ text: `"${clause.originalSnippet}"`, italics: true, color: '4A5568' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '⚖️ Hallazgo Jurídico: ', bold: true }),
                  new TextRun({ text: clause.finding }),
                ],
              })
            );

            if (clause.legalReference) {
              clauseParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: '⚖️ Estatuto / Regulación: ', bold: true, color: '1A365D' }),
                    new TextRun({ text: clause.legalReference, color: '2B6CB0' }),
                  ],
                })
              );
            }

            clauseParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '🛡️ Recomendación de Enmienda: ', bold: true, color: '1A365D' }),
                  new TextRun({ text: clause.recommendation }),
                ],
              })
            );

            if (clause.suggestedDrafting) {
              clauseParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: '📝 Redacción Sugerida para Adenda: ', bold: true, color: '2F855A' }),
                    new TextRun({ text: `"${clause.suggestedDrafting}"`, italics: true }),
                  ],
                })
              );
            }

            clauseParagraphs[clauseParagraphs.length - 1] = new Paragraph({
              ...clauseParagraphs[clauseParagraphs.length - 1],
              spacing: { after: 150 },
            });

            return clauseParagraphs;
          }),

          // Missing essential clauses
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '6. Cláusulas Esenciales Ausentes Recomendadas', bold: true, color: '0F2744' })],
            spacing: { before: 300, after: 100 },
          }),
          ...audit.missingEssentialClauses.map(
            (missing) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun({ text: missing })],
              })
          ),

          // Sign-off
          new Paragraph({
            spacing: { before: 400, after: 50 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '_______________________________________',
                bold: true,
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'AUDIFLOW SISTEMA DE CONTROL INTERNO Y AUDITORÍA LEGAL\nCertificación Digital de Inspección Contractual Forense',
                bold: true,
                color: '0F2744',
                size: 18,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const sanitizedName = audit.contractTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  downloadBlob(blob, `Audiflow_Informe_${sanitizedName}.docx`);
}

function createTableRow(label: string, value: string, isFirst = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: '334155' })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        },
        children: [new Paragraph({ children: [new TextRun({ text: value || 'N/A' })] })],
      }),
    ],
  });
}

export function exportToPDF(audit: ContractAudit): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  function checkPageBreak(spaceNeeded: number) {
    if (y + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
  }

  function drawHeader() {
    doc.setFillColor(15, 39, 68); // Deep Navy
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('AUDIFLOW • SOFTWARE DE AUDITORÍA Y CONTROL CONTRACTUAL', margin, 8);
    y = Math.max(y, 20);
  }

  drawHeader();

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 39, 68);
  doc.text('INFORME DE AUDITORÍA LEGAL Y EVALUACIÓN FORENSE', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(82, 110, 140);
  doc.text(`Documento auditado: ${audit.contractTitle}`, margin, y);
  y += 6;

  // Metadata Box (Ficha Técnica con 2 columnas proporcionales y ajuste de texto)
  const col1X = margin + 4;
  const col1ValX = margin + 36;
  const col2X = margin + (pageWidth - margin * 2) * 0.52;
  const col2ValX = col2X + 26;
  const col2ValMaxW = pageWidth - margin - col2ValX - 4;

  const docTypeLines = doc.splitTextToSize(audit.documentType, col2X - col1ValX - 4);
  const totalValLines = doc.splitTextToSize(audit.totalValue || 'No especificado', col2ValMaxW);
  const metaBoxHeight = Math.max(28, 18 + Math.max(docTypeLines.length, totalValLines.length) * 4);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, metaBoxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  // Fila 1
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo Documento:', col1X, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(docTypeLines[0] || audit.documentType, col1ValX, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Riesgo Global:', col2X, y + 6);
  doc.setTextColor(audit.overallRiskScore > 60 ? 197 : 47, audit.overallRiskScore > 60 ? 48 : 133, 48);
  doc.text(`${audit.overallRiskScore}/100`, col2ValX, y + 6);

  // Fila 2
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Auditoría:', col1X, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(audit.auditDate, col1ValX, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Cumplimiento:', col2X, y + 12);
  doc.setTextColor(audit.complianceScore >= 80 ? 47 : 197, 133, 90);
  doc.text(`${audit.complianceScore}%`, col2ValX, y + 12);

  // Fila 3
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Vigencia:', col1X, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${audit.effectiveDate} al ${audit.expirationDate}`, col1ValX, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Valor Total:', col2X, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(totalValLines, col2ValX, y + 18);

  y += metaBoxHeight + 6;

  // Resumen del Documento
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 39, 68);
  doc.text('RESUMEN DEL DOCUMENTO', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(audit.summary, pageWidth - margin * 2);
  checkPageBreak(summaryLines.length * 4 + 6);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4 + 6;

  // Identified Risks (Formateo Dinámico Sin Cortes ni Solapamientos)
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 39, 68);
  doc.text('MATRIZ DE RIESGOS Y RECOMENDACIONES LEGALES', margin, y);
  y += 6;

  audit.risksIdentified.forEach((risk, i) => {
    const sevLabel = translateSeverity(risk.severity);
    const badgeText = `[SEVERIDAD: ${sevLabel}]`;
    const titleLines = doc.splitTextToSize(`${i + 1}. ${risk.title}`, pageWidth - margin * 2 - 50);
    const descLines = doc.splitTextToSize(`Diagnóstico del Riesgo: ${risk.description}`, pageWidth - margin * 2 - 6);
    const mitLines = doc.splitTextToSize(`Recomendación Legal & Preventiva: ${risk.mitigation}`, pageWidth - margin * 2 - 6);
    const locLines = risk.exactLocation ? doc.splitTextToSize(`Revisar con Lupa en Documento: ${risk.exactLocation}`, pageWidth - margin * 2 - 6) : [];
    const quoteLines = risk.quoteSnippet ? doc.splitTextToSize(`Texto Original: "${risk.quoteSnippet}"`, pageWidth - margin * 2 - 8) : [];
    const legalLines = risk.legalReference ? doc.splitTextToSize(`Marco Normativo: ${risk.legalReference}`, pageWidth - margin * 2 - 6) : [];
    const draftLines = risk.suggestedDrafting ? doc.splitTextToSize(`Redacción Sugerida: "${risk.suggestedDrafting}"`, pageWidth - margin * 2 - 6) : [];

    const headerHeight = Math.max(titleLines.length * 4.2, 6);
    const totalHeight = headerHeight + descLines.length * 3.8 + mitLines.length * 3.8 + locLines.length * 3.8 + quoteLines.length * 3.5 + legalLines.length * 3.5 + draftLines.length * 3.5 + 14;
    checkPageBreak(totalHeight);

    // Título a la izquierda ajustado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(197, 48, 48);
    doc.text(titleLines, margin, y);

    // Badge de severidad alineado a la derecha sin tocar el título
    doc.text(badgeText, pageWidth - margin, y, { align: 'right' });
    y += headerHeight + 1.5;

    if (locLines.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(183, 121, 31);
      doc.text(locLines, margin + 4, y);
      y += locLines.length * 3.8;
    }

    if (quoteLines.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      doc.text(quoteLines, margin + 6, y);
      y += quoteLines.length * 3.5 + 1;
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(descLines, margin + 4, y);
    y += descLines.length * 3.8;

    if (legalLines.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 54, 93);
      doc.text(legalLines, margin + 4, y);
      y += legalLines.length * 3.5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(47, 133, 90);
    doc.text(mitLines, margin + 4, y);
    y += mitLines.length * 3.8 + 2;

    if (draftLines.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(43, 108, 176);
      doc.text(draftLines, margin + 4, y);
      y += draftLines.length * 3.5 + 2;
    }

    y += 3;
  });
  y += 4;

  // Clauses Breakdown (Revisión Forense sin acoplamiento ni textos en inglés)
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 39, 68);
  doc.text('AUDITORÍA CLÁUSULA POR CLÁUSULA (REVISIÓN FORENSE)', margin, y);
  y += 6;

  audit.clauses.forEach((clause, i) => {
    const statusText = clause.compliant ? '[CONFORME]' : `[RIESGO ${translateSeverity(clause.riskLevel)}]`;
    // Ancho útil disponible para el título: dejamos 45mm a la derecha para que el badge nunca choque
    const badgeWidth = 45;
    const maxTitleWidth = pageWidth - margin * 2 - badgeWidth - 6;
    const titleLines = doc.splitTextToSize(`${i + 1}. ${clause.title}`, maxTitleWidth);

    const locLines = clause.exactLocation ? doc.splitTextToSize(`Ubicación con Lupa: ${clause.exactLocation}`, pageWidth - margin * 2 - 6) : [];
    const snippetLines = doc.splitTextToSize(`"${clause.originalSnippet}"`, pageWidth - margin * 2 - 8);
    const findingLines = doc.splitTextToSize(`Hallazgo: ${clause.finding}`, pageWidth - margin * 2 - 6);
    const recLines = doc.splitTextToSize(`Recomendación: ${clause.recommendation}`, pageWidth - margin * 2 - 6);
    const draftLines = clause.suggestedDrafting ? doc.splitTextToSize(`Enmienda Propuesta: "${clause.suggestedDrafting}"`, pageWidth - margin * 2 - 6) : [];

    const headerHeight = Math.max(titleLines.length * 4.2 + 3, 8);
    const totalHeight = headerHeight + locLines.length * 3.8 + snippetLines.length * 3.5 + findingLines.length * 3.5 + recLines.length * 3.5 + draftLines.length * 3.5 + 16;
    checkPageBreak(totalHeight);

    // Fondo gris dinámico cubriendo todo el encabezado
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, headerHeight, 1.5, 1.5, 'F');

    // Título envuelto estrictamente dentro de maxTitleWidth
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 39, 68);
    doc.text(titleLines, margin + 3, y + 4.5);

    // Estado / Severidad colocado en la zona derecha reservada (sin colisión posible)
    doc.setTextColor(clause.compliant ? 47 : 197, clause.compliant ? 133 : 48, clause.compliant ? 90 : 48);
    doc.text(statusText, pageWidth - margin - 3, y + 4.5, { align: 'right' });
    y += headerHeight + 2;

    if (locLines.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(183, 121, 31);
      doc.text(locLines, margin + 3, y);
      y += locLines.length * 3.8;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(snippetLines, margin + 5, y);
    y += snippetLines.length * 3.5 + 2;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(findingLines, margin + 3, y);
    y += findingLines.length * 3.5 + 1.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 39, 68);
    doc.text(recLines, margin + 3, y);
    y += recLines.length * 3.5 + 2;

    if (draftLines.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(47, 133, 90);
      doc.text(draftLines, margin + 3, y);
      y += draftLines.length * 3.5 + 2;
    }

    y += 2;
  });

  const sanitizedName = audit.contractTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  doc.save(`Audiflow_Informe_${sanitizedName}.pdf`);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
