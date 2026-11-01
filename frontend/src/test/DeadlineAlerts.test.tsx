import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DeadlineAlerts } from '../components/DeadlineAlerts';
import { ContractAudit } from '../types/audit';

describe('DeadlineAlerts Component', () => {
  const mockAudits: ContractAudit[] = [
    {
      id: 'aud-test-123',
      contractTitle: 'Contrato Marco Extenso de Prestación de Servicios Tecnológicos (12 Páginas) (2)',
      contractTypology: 'Prestación de Servicios',
      documentType: 'Contrato de Bajo Riesgo',
      fileName: 'contrato_12_paginas.pdf',
      auditDate: '2026-10-31',
      parties: [],
      effectiveDate: '2026-10-31',
      expirationDate: '2027-10-31',
      overallRiskScore: 20,
      complianceScore: 80,
      status: 'aprobado',
      summary: 'Resumen...',
      clauses: [],
      risksIdentified: [],
      keyDeadlines: [],
    },
  ];

  it('no debe mostrar cero en las tarjetas métricas cuando hay contratos auditados', () => {
    render(
      <DeadlineAlerts
        deadlines={[]}
        audits={mockAudits}
        onSelectAuditById={vi.fn()}
        onDismissDeadline={vi.fn()}
        onAddCustomDeadline={vi.fn()}
      />
    );

    // Debe mostrar el título principal
    expect(screen.getByText(/Alertas y Vencimientos/i)).toBeInTheDocument();

    // Las tarjetas métricas deben reflejar los plazos calculados (al menos 2 en Planificados >30 días)
    expect(screen.getByText(/Planificados \(>30 días\)/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 1 vencimiento + 1 preaviso de 30 días
  });

  it('debe listar los hitos con el botón "Ver Expediente" y disparar onSelectAuditById', () => {
    const handleSelectAudit = vi.fn();

    render(
      <DeadlineAlerts
        deadlines={[]}
        audits={mockAudits}
        onSelectAuditById={handleSelectAudit}
        onDismissDeadline={vi.fn()}
        onAddCustomDeadline={vi.fn()}
      />
    );

    // Debe mostrar la tarjeta de Vencimiento de Vigencia
    expect(screen.getByText(/Vencimiento de Vigencia:/i)).toBeInTheDocument();
    // Debe mostrar la tarjeta de Preaviso de Renovación
    expect(screen.getByText(/Preaviso de Renovación \(30 Días\):/i)).toBeInTheDocument();

    // Debe haber botones "Ver Expediente"
    const verExpedienteBtns = screen.getAllByRole('button', { name: /Ver Expediente/i });
    expect(verExpedienteBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(verExpedienteBtns[0]);
    expect(handleSelectAudit).toHaveBeenCalledWith('aud-test-123');
  });

  it('debe invocar onDismissDeadline al hacer clic en "Marcar Atendida"', () => {
    const handleDismiss = vi.fn();

    render(
      <DeadlineAlerts
        deadlines={[]}
        audits={mockAudits}
        onSelectAuditById={vi.fn()}
        onDismissDeadline={handleDismiss}
        onAddCustomDeadline={vi.fn()}
      />
    );

    const marcarAtendidaBtns = screen.getAllByRole('button', { name: /Marcar Atendida/i });
    expect(marcarAtendidaBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(marcarAtendidaBtns[0]);
    expect(handleDismiss).toHaveBeenCalledWith(expect.stringContaining('aud-test-123'));
  });
});
