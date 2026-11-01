import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Navbar } from '../components/Navbar';
import { ContractAudit, User } from '../types/audit';

describe('Navbar Centralized Notifications Bell', () => {
  const mockUser: User = {
    name: 'Eduardo Auditor',
    email: 'auditor@unicaribe.edu.co',
    role: 'Auditor Senior',
    company: 'Unicaribe',
  };

  const mockAudits: ContractAudit[] = [
    {
      id: 'audit-contract-1',
      contractTitle: 'Contrato Marco Extenso de Prestación de Servicios Tecnológicos',
      contractType: 'Prestación de Servicios',
      overallRiskScore: 20,
      compliancePercentage: 80,
      complianceStatus: 'compliant',
      startDate: '2026-10-31',
      expirationDate: '2027-10-31',
      parties: ['Entidad Contratante', 'Empresa Prestadora'],
      governingLaw: 'Jurisdicción Nacional Ordinaria',
      risksIdentified: [
        {
          id: 'risk-1',
          title: 'Cláusula de Penalidad Desproporcionada',
          severity: 'critical',
          description: 'Multa del 30% por mora de 1 día.',
        },
      ],
      executiveSummary: 'Resumen ejecutivo del contrato...',
      auditDate: '2026-10-31',
    },
  ];

  it('debe mostrar el badge en la campana cuando existen contratos auditados', () => {
    render(
      <Navbar
        currentTab="dashboard"
        onTabChange={vi.fn()}
        user={mockUser}
        onLogout={vi.fn()}
        deadlines={[]}
        audits={mockAudits}
      />
    );

    // Debe existir el botón de la campana
    const bellBtn = screen.getByLabelText(/Campana de notificaciones y alertas/i);
    expect(bellBtn).toBeInTheDocument();
  });

  it('al abrir la campana debe listar vigencias, preaviso formal y dictamen de auditoría', () => {
    const handleSelectAudit = vi.fn();

    render(
      <Navbar
        currentTab="dashboard"
        onTabChange={vi.fn()}
        user={mockUser}
        onLogout={vi.fn()}
        deadlines={[]}
        audits={mockAudits}
        onSelectAuditById={handleSelectAudit}
      />
    );

    // Abrir la campana
    const bellBtn = screen.getByLabelText(/Campana de notificaciones y alertas/i);
    fireEvent.click(bellBtn);

    // Verificar header y pestañas de filtro
    expect(screen.getByText(/Notificaciones & Vencimientos/i)).toBeInTheDocument();
    expect(screen.getByText(/Vigencias & Plazos/i)).toBeInTheDocument();
    expect(screen.getByText(/Auditorías & Riesgos/i)).toBeInTheDocument();

    // Debe mostrar la alerta de Vigencia & Plazo Contractual
    expect(screen.getByText(/Vigencia & Plazo Contractual/i)).toBeInTheDocument();
    // Debe mostrar el preaviso de 30 días
    expect(screen.getByText(/Hito de Preaviso de Renovación/i)).toBeInTheDocument();
    // Debe mostrar el dictamen de auditoría
    expect(screen.getByText(/Dictamen de Auditoría Legal/i)).toBeInTheDocument();

    // Al hacer clic en un aviso, debe invocar onSelectAuditById con el id del contrato
    const auditAviso = screen.getByText(/Dictamen de Auditoría Legal/i);
    fireEvent.click(auditAviso);
    expect(handleSelectAudit).toHaveBeenCalledWith('audit-contract-1');
  });
});
