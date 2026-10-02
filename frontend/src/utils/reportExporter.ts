import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import { ContractAudit } from '../types/audit';

export async function exportToWord(audit: ContractAudit): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            text: 'AUDIFLOW • SOFTWARE DE AUDITORÍA Y CONTROL',
            style: 'HeaderTitle',
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
                text: 'INFORME TÉCNICO DE AUDITORÍA CONTRACTUAL Y EVALUACIÓN DE RIESGOS',
                bold: true,
                color: '1E3E62',
                size: 26,
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
              new TextRun({ text: `• Índice Global de Riesgo Contractual: `, bold: true }),
              new TextRun({
                text: `${audit.overallRiskScore} / 100 (${audit.overallRiskScore > 60 ? 'RIESGO ALTO / CRÍTICO' : audit.overallRiskScore > 35 ? 'RIESGO MEDIO' : 'RIESGO CONTROLADO'})`,
                bold: true,
                color: audit.overallRiskScore > 60 ? 'C53030' : audit.overallRiskScore > 35 ? 'D69E2E' : '2F855A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Grado de Cumplimiento Legal y Buenas Prácticas: `, bold: true }),
              new TextRun({
                text: `${audit.complianceScore}%`,
                bold: true,
                color: audit.complianceScore >= 80 ? '2F855A' : 'C53030',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Executive Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '3. Resumen Ejecutivo del Auditor', bold: true, color: '0F2744' })],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: audit.summary, italics: true })],
            spacing: { after: 300 },
          }),

          // Key Deadlines
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '4. Alertas de Vencimiento y Fechas Límite Críticas', bold: true, color: '0F2744' })],
            spacing: { before: 200, after: 100 },
          }),
          ...audit.keyDeadlines.map(
            (dl) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({ text: `[${dl.date}] `, bold: true, color: dl.urgency === 'urgent' ? 'C53030' : '1A365D' }),
                  new TextRun({ text: `${dl.title}: `, bold: true }),
                  new TextRun({ text: dl.description }),
                ],
              })
          ),

          // Identified Risks
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '5. Matriz de Contingencias y Riesgos Detectados', bold: true, color: '0F2744' })],
            spacing: { before: 300, after: 100 },
          }),
          ...audit.risksIdentified.map(
            (risk, idx) =>
              new Paragraph({
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: `${idx + 1}. ${risk.title} `, bold: true }),
                  new TextRun({ text: `[Severidad: ${risk.severity.toUpperCase()}]\n`, bold: true, color: 'C53030' }),
                  new TextRun({ text: `   Descripción: ${risk.description}\n` }),
                  new TextRun({ text: `   Medida de Mitigación: ${risk.mitigation}`, italics: true, color: '2B6CB0' }),
                ],
              })
          ),

          // Audited Clauses
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '6. Análisis Detallado Cláusula por Cláusula', bold: true, color: '0F2744' })],
            spacing: { before: 300, after: 100 },
          }),
          ...audit.clauses.flatMap((clause, idx) => [
            new Paragraph({
              spacing: { before: 150, after: 50 },
              children: [
                new TextRun({ text: `${idx + 1}. ${clause.title} `, bold: true, size: 22, color: '0F2744' }),
                new TextRun({
                  text: `(${clause.compliant ? 'CONFORME' : 'REQUIERE ATENCIÓN'} - RIESGO ${clause.riskLevel.toUpperCase()})`,
                  bold: true,
                  color: clause.compliant ? '2F855A' : 'C53030',
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Texto original: ', bold: true, italics: true }),
                new TextRun({ text: `"${clause.originalSnippet}"`, italics: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Hallazgo jurídico: ', bold: true }),
                new TextRun({ text: clause.finding }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Recomendación de enmienda: ', bold: true, color: '1A365D' }),
                new TextRun({ text: clause.recommendation }),
              ],
              spacing: { after: 150 },
            }),
          ]),

          // Missing essential clauses
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '7. Cláusulas Esenciales Ausentes Recomendadas', bold: true, color: '0F2744' })],
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
            spacing: { before: 400, after: 100 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '_______________________________________\nAUDIFLOW SISTEMA DE CONTROL INTERNO\nFirma y Sello de Certificación Digital',
                bold: true,
                color: '64748B',
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
  const margin = 18;
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
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('AUDIFLOW • SOFTWARE DE AUDITORÍA Y CONTROL CONTRACTUAL', margin, 8);
    y = Math.max(y, 20);
  }

  drawHeader();

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 39, 68);
  doc.text('INFORME DE AUDITORÍA LEGAL', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(82, 110, 140);
  doc.text(`Documento: ${audit.contractTitle}`, margin, y);
  y += 6;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de Documento:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(audit.documentType, margin + 42, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Auditoría:', margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(audit.auditDate, margin + 42, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Vigencia:', margin + 4, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${audit.effectiveDate} al ${audit.expirationDate}`, margin + 42, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Riesgo Global:', margin + 105, y + 6);
  doc.setTextColor(audit.overallRiskScore > 60 ? 197 : 47, audit.overallRiskScore > 60 ? 48 : 133, 48);
  doc.setFont('helvetica', 'bold');
  doc.text(`${audit.overallRiskScore}/100`, margin + 135, y + 6);

  doc.setTextColor(51, 65, 85);
  doc.text('Cumplimiento:', margin + 105, y + 12);
  doc.setTextColor(audit.complianceScore >= 80 ? 47 : 197, 133, 90);
  doc.text(`${audit.complianceScore}%`, margin + 135, y + 12);

  doc.setTextColor(51, 65, 85);
  doc.text('Valor Total:', margin + 105, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(audit.totalValue || 'No especificado', margin + 135, y + 18);

  y += 34;

  // Executive Summary
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 39, 68);
  doc.text('RESUMEN EJECUTIVO Y CONCLUSIONES', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(audit.summary, pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4 + 4;

  // Key Deadlines
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 39, 68);
  doc.text('ALERTAS DE VENCIMIENTO Y PLAZOS CRÍTICOS', margin, y);
  y += 6;

  audit.keyDeadlines.forEach((dl) => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(dl.urgency === 'urgent' ? 197 : 26, dl.urgency === 'urgent' ? 48 : 54, dl.urgency === 'urgent' ? 48 : 93);
    doc.text(`• [${dl.date}] ${dl.title}`, margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`  ${dl.description}`, margin + 3, y);
    y += 4;
  });
  y += 4;

  // Identified Risks
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 39, 68);
  doc.text('CONTINGENCIAS Y RIESGOS PRINCIPALES', margin, y);
  y += 6;

  audit.risksIdentified.forEach((risk, i) => {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(197, 48, 48);
    doc.text(`${i + 1}. ${risk.title} [Severidad: ${risk.severity.toUpperCase()}]`, margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const descLines = doc.splitTextToSize(`Detalle: ${risk.description}`, pageWidth - margin * 2 - 4);
    doc.text(descLines, margin + 4, y);
    y += descLines.length * 3.8;
    const mitLines = doc.splitTextToSize(`Mitigación: ${risk.mitigation}`, pageWidth - margin * 2 - 4);
    doc.setTextColor(30, 62, 98);
    doc.text(mitLines, margin + 4, y);
    y += mitLines.length * 3.8 + 2;
  });
  y += 4;

  // Clauses Breakdown
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 39, 68);
  doc.text('AUDITORÍA CLÁUSULA POR CLÁUSULA', margin, y);
  y += 6;

  audit.clauses.forEach((clause) => {
    checkPageBreak(24);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 39, 68);
    doc.text(clause.title, margin + 3, y + 4.2);

    doc.setTextColor(clause.compliant ? 47 : 197, clause.compliant ? 133 : 48, clause.compliant ? 90 : 48);
    doc.text(
      `[${clause.compliant ? 'CONFORME' : 'RIESGO ' + clause.riskLevel.toUpperCase()}]`,
      pageWidth - margin - 35,
      y + 4.2
    );
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const snippetLines = doc.splitTextToSize(`"${clause.originalSnippet}"`, pageWidth - margin * 2 - 6);
    doc.text(snippetLines, margin + 3, y);
    y += snippetLines.length * 3.5 + 2;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Hallazgo:', margin + 3, y);
    doc.setFont('helvetica', 'normal');
    const findingLines = doc.splitTextToSize(clause.finding, pageWidth - margin * 2 - 22);
    doc.text(findingLines, margin + 22, y);
    y += findingLines.length * 3.5 + 1.5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 39, 68);
    doc.text('Recomendación:', margin + 3, y);
    doc.setFont('helvetica', 'normal');
    const recLines = doc.splitTextToSize(clause.recommendation, pageWidth - margin * 2 - 32);
    doc.text(recLines, margin + 32, y);
    y += recLines.length * 3.5 + 4;
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
