import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RegulatoryProvenanceModal } from '../components/RegulatoryProvenanceModal';
import { AuditResultView } from '../components/AuditResultView';
import { AuditedClause, ContractAudit } from '../types/audit';

describe('RegulatoryProvenanceModal Component', () => {
  const sampleClause: AuditedClause = {
    id: 'clause-test-1',
    title: '[Regulación] PRIV_001: Omisión de Protección de Datos',
    category: 'otros',
    riskLevel: 'critical',
    finding: 'Falta de cláusula de tratamiento de datos personales conforme al RGPD y Ley 1581.',
    recommendation: 'Incorporar cláusula de protección de datos personales con autorización expresa.',
    compliant: false,
    originalSnippet: 'El documento no contiene ninguna disposición sobre datos.',
    legalReference: 'Ley Estatutaria 1581 de 2012 / RGPD Arts. 6, 7 y 28',
    issuingBody: 'Congreso de la República de Colombia / Superintendencia de Industria y Comercio (SIC)',
    jurisdiction: 'Colombia (Régimen General de Habeas Data)',
    officialSource: 'Ley Estatutaria 1581 de 2012, Arts. 9, 12, 17 y 18; Decreto 1377 de 2013',
    lastReviewed: '2026-10-15',
    normativeStatus: 'VIGENTE',
    applicabilityCriteria: 'Aplica a todo contrato ejecutado en territorio colombiano con tratamiento de datos personales.',
    officialUrl: 'https://www.sic.gov.co/proteccion-de-datos-personales',
  };

  it('debe renderizar todos los metadatos de procedencia, jurisdicción y aplicabilidad', () => {
    const handleClose = vi.fn();
    render(<RegulatoryProvenanceModal item={sampleClause} onClose={handleClose} />);

    // Título y estatus
    expect(screen.getByText('Ficha Técnica de Validez Regulatoria')).toBeInTheDocument();
    expect(screen.getByText('VIGENTE')).toBeInTheDocument();

    // Organismo Emisor
    expect(screen.getByText(/Congreso de la República de Colombia/i)).toBeInTheDocument();

    // Jurisdicción
    expect(screen.getByText(/Colombia \(Régimen General de Habeas Data\)/i)).toBeInTheDocument();

    // Fuente oficial
    expect(screen.getByText(/Ley Estatutaria 1581 de 2012, Arts\. 9, 12, 17 y 18/i)).toBeInTheDocument();

    // Criterio de aplicabilidad
    expect(screen.getByText(/Aplica a todo contrato ejecutado en territorio colombiano/i)).toBeInTheDocument();

    // Enlace oficial
    const link = screen.getByRole('link', { name: /Consultar Publicación Oficial/i });
    expect(link).toHaveAttribute('href', 'https://www.sic.gov.co/proteccion-de-datos-personales');
  });

  it('debe invocar onClose al hacer clic en el botón de cerrar', () => {
    const handleClose = vi.fn();
    render(<RegulatoryProvenanceModal item={sampleClause} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /Cerrar Ficha/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('debe abrir el modal desde AuditResultView al presionar el botón de Ficha Técnica', () => {
    const mockAudit: ContractAudit = {
      id: 'audit-test-provenance',
      contractTitle: 'Contrato de Servicios Cloud',
      documentType: 'Contrato Tecnológico',
      contractTypology: 'Contrato de Prestación de Servicios',
      typologyExplanation: 'Servicios de nube',
      fileName: 'contrato.pdf',
      fileSize: '1.2 MB',
      auditDate: '2026-10-31',
      effectiveDate: '2026-10-31',
      expirationDate: '2027-10-31',
      renewalTerms: 'Renovación automática',
      totalValue: '10000000',
      governingLaw: 'Leyes Colombianas',
      overallRiskScore: 45,
      complianceScore: 70,
      status: 'auditado',
      auditedBy: 'auditor@audiflow.com',
      summary: 'Resumen de prueba',
      parties: [],
      clauses: [sampleClause],
      risksIdentified: [],
      keyDeadlines: [],
      missingEssentialClauses: [],
    };

    render(
      <AuditResultView
        audit={mockAudit}
        onBack={vi.fn()}
        onExportPDF={vi.fn()}
        onExportWord={vi.fn()}
      />
    );

    // Buscar el botón de Ficha Técnica en la tarjeta de la cláusula
    const fichaBtn = screen.getByTitle(/Consultar Ficha Técnica de Validez, Jurisdicción y Vigencia 2026/i);
    expect(fichaBtn).toBeInTheDocument();

    // Al hacer clic, debe abrir el modal
    fireEvent.click(fichaBtn);
    expect(screen.getByText('Ficha Técnica de Validez Regulatoria')).toBeInTheDocument();
    expect(screen.getByText(/Régimen General de Habeas Data/i)).toBeInTheDocument();
  });
});
