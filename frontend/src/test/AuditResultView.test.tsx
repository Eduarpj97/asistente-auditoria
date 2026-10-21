import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AuditResultView } from '../components/AuditResultView';
import { ContractAudit } from '../types/audit';

const mockAudit: ContractAudit = {
  id: 'aud-test-1',
  contractTitle: 'Contrato de Arrendamiento Comercial Norte',
  documentType: 'Contrato de Alto Riesgo / Observado',
  contractTypology: 'Contrato de Arrendamiento',
  typologyExplanation: 'Acuerdo donde el arrendador cede el uso temporal de un inmueble a cambio de un canon mensual.',
  fileName: 'arrendamiento_2026.pdf',
  fileSize: '1.2 MB',
  auditDate: '2026-10-21',
  effectiveDate: '2026-11-01',
  expirationDate: '2027-11-01',
  renewalTerms: 'Aviso con 30 días de antelación',
  totalValue: '$36.000.000 COP',
  governingLaw: 'Jurisdicción Ordinaria Civil',
  overallRiskScore: 78,
  complianceScore: 65,
  status: 'en_revision',
  auditedBy: 'auditor@audiflow.com',
  summary: 'Contrato que regula el uso de local comercial para oficina administrativa.',
  parties: [
    { name: 'Inmobiliaria Central', role: 'Arrendador' },
    { name: 'Empresa Cliente SAS', role: 'Arrendatario' },
  ],
  clauses: [
    {
      id: 'c-1',
      title: 'Cláusula de Penalidad por Retraso',
      exactLocation: 'Cláusula Décima',
      originalSnippet: 'El arrendatario pagará una multa del 50% por cada día de mora.',
      category: 'penalizaciones',
      riskLevel: 'critical',
      finding: 'Penalidad excesiva desproporcionada.',
      legalReference: 'Código Civil Art. 1601',
      recommendation: 'Topar la penalidad a un interés moratorio legal.',
      compliant: false,
    },
  ],
  risksIdentified: [
    {
      title: 'Vulnerabilidad Normativa: PRIV_001',
      severity: 'critical',
      exactLocation: '[Omisión] Sección ausente en documento: Acápite de PROTECCION_DATOS',
      description: 'El documento no contiene estipulaciones sobre tratamiento ni autorización de datos personales.',
      legalReference: 'Ley 1581 de 2012 / RGPD',
      mitigation: 'Incorporar cláusula de Hábeas Data.',
    },
  ],
  keyDeadlines: [],
  missingEssentialClauses: ['Cláusula de Protección de Datos Personales (Habeas Data)'],
};

describe('Componente AuditResultView', () => {
  const onBackMock = vi.fn();
  const onExportPDFMock = vi.fn();
  const onExportWordMock = vi.fn();

  it('debe renderizar el título, la tipología contractual y su explicación en lenguaje simple', () => {
    render(
      <AuditResultView
        audit={mockAudit}
        onBack={onBackMock}
        onExportPDF={onExportPDFMock}
        onExportWord={onExportWordMock}
      />
    );

    // Título y tipología
    expect(screen.getByText('Contrato de Arrendamiento Comercial Norte')).toBeInTheDocument();
    expect(screen.getAllByText('Contrato de Arrendamiento').length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/Acuerdo donde el arrendador cede el uso temporal de un inmueble/)
    ).toBeInTheDocument();
  });

  it('debe mostrar la puntuación de riesgo global y el semáforo crítico cuando el score supera 60', () => {
    render(
      <AuditResultView
        audit={mockAudit}
        onBack={onBackMock}
        onExportPDF={onExportPDFMock}
        onExportWord={onExportWordMock}
      />
    );

    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('Riesgo Crítico')).toBeInTheDocument();
  });

  it('debe permitir cambiar de pestaña a la Matriz de Riesgos y visualizar la vulnerabilidad PRIV_001', () => {
    render(
      <AuditResultView
        audit={mockAudit}
        onBack={onBackMock}
        onExportPDF={onExportPDFMock}
        onExportWord={onExportWordMock}
      />
    );

    // Clic en pestaña Matriz de Riesgos
    const tabRiesgos = screen.getByText(/Matriz de Riesgos/i);
    fireEvent.click(tabRiesgos);

    expect(screen.getByText(/Vulnerabilidad Normativa: PRIV_001/i)).toBeInTheDocument();
    expect(screen.getByText(/Ley 1581 de 2012/i)).toBeInTheDocument();
  });

  it('debe invocar los handlers de exportación a PDF y Word al hacer clic en sus botones', () => {
    render(
      <AuditResultView
        audit={mockAudit}
        onBack={onBackMock}
        onExportPDF={onExportPDFMock}
        onExportWord={onExportWordMock}
      />
    );

    const btnPDF = screen.getByText(/Exportar PDF/i);
    fireEvent.click(btnPDF);
    expect(onExportPDFMock).toHaveBeenCalledWith(mockAudit);

    const btnWord = screen.getByText(/Exportar Word/i);
    fireEvent.click(btnWord);
    expect(onExportWordMock).toHaveBeenCalledWith(mockAudit);
  });
});
