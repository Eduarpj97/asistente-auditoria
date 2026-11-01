import { describe, it, expect } from 'vitest';
import { extractDeadlinesFromAudits } from '../utils/deadlineUtils';
import { ContractAudit } from '../types/audit';

describe('extractDeadlinesFromAudits', () => {
  const baseAudit: ContractAudit = {
    id: 'aud-test-1',
    contractTitle: 'Contrato Marco de Servicios Tecnológicos',
    contractTypology: 'Prestación de Servicios',
    documentType: 'Contrato de Bajo Riesgo',
    fileName: 'contrato_servicios.pdf',
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
  };

  it('debe extraer el hito de vencimiento formal y el preaviso de 30 días para un contrato a 1 año', () => {
    const deadlines = extractDeadlinesFromAudits([baseAudit]);

    expect(deadlines.length).toBeGreaterThanOrEqual(2);

    const expDeadline = deadlines.find((d) => d.id === 'exp-aud-test-1');
    expect(expDeadline).toBeDefined();
    expect(expDeadline?.title).toContain('Vencimiento de Vigencia');
    expect(expDeadline?.date).toBe('2027-10-31');
    expect(expDeadline?.urgency).toBe('normal'); // >30 días

    const preDeadline = deadlines.find((d) => d.id === 'preaviso-aud-test-1');
    expect(preDeadline).toBeDefined();
    expect(preDeadline?.title).toContain('Preaviso de Renovación (30 Días)');
    expect(preDeadline?.urgency).toBe('normal');
  });

  it('debe clasificar como crítica una fecha que vence en menos de 7 días', () => {
    const soonDate = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const soonAudit: ContractAudit = {
      ...baseAudit,
      id: 'aud-soon-1',
      expirationDate: soonDate,
    };

    const deadlines = extractDeadlinesFromAudits([soonAudit]);
    const expDeadline = deadlines.find((d) => d.id === 'exp-aud-soon-1');
    expect(expDeadline?.urgency).toBe('urgent');
  });

  it('debe clasificar como advertencia una fecha que vence entre 7 y 30 días', () => {
    const warnDate = new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const warnAudit: ContractAudit = {
      ...baseAudit,
      id: 'aud-warn-1',
      expirationDate: warnDate,
    };

    const deadlines = extractDeadlinesFromAudits([warnAudit]);
    const expDeadline = deadlines.find((d) => d.id === 'exp-aud-warn-1');
    expect(expDeadline?.urgency).toBe('warning');
  });
});
