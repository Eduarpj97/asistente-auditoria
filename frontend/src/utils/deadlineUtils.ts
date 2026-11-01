import { ContractAudit, KeyDeadline } from '../types/audit';

/**
 * Extrae y sintetiza de forma automatizada los plazos contractuales críticos:
 * 1. Hito de Vencimiento y Expiración Contractual
 * 2. Hito de Preaviso de 30 Días para Renovación / Prórroga Anual
 * 3. Hitos específicos incluidos en keyDeadlines
 */
export function extractDeadlinesFromAudits(audits: ContractAudit[]): KeyDeadline[] {
  const result: KeyDeadline[] = [];
  const now = Date.now();

  audits.forEach((audit) => {
    if (!audit) return;

    // 1. Expiración y Vencimiento del contrato
    const expDateStr = audit.expirationDate || '2027-10-31';
    const expTime = new Date(expDateStr).getTime();
    const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

    let expUrgency: 'urgent' | 'warning' | 'normal' = 'normal';
    let expDesc = `Vigencia formal hasta el ${expDateStr}.`;

    if (diffDays < 7) {
      expUrgency = 'urgent';
      expDesc =
        diffDays <= 0
          ? `El contrato venció formalmente hace ${Math.abs(diffDays)} días o expira hoy.`
          : `Vence en ${diffDays} días. Plazo crítico para renovación o liquidación.`;
    } else if (diffDays <= 30) {
      expUrgency = 'warning';
      expDesc = `Vence en ${diffDays} días. Iniciar proceso de negociación o prórroga con la contraparte.`;
    } else {
      expUrgency = 'normal';
      expDesc = `Vigencia activa garantizada: quedan ${diffDays} días de ejecución (${expDateStr}).`;
    }

    result.push({
      id: `exp-${audit.id}`,
      date: expDateStr,
      title: `Vencimiento de Vigencia: ${audit.contractTitle}`,
      daysRemaining: diffDays > 0 ? diffDays : 0,
      urgency: expUrgency,
      description: expDesc,
      contractId: audit.id,
      contractTitle: audit.contractTitle,
      dismissed: false,
    });

    // 2. Ventana de Preaviso de 30 Días (formalmente exigida en cláusulas de renovación o terminación)
    const preavisoTime = expTime - 30 * 24 * 60 * 60 * 1000;
    const preavisoDateStr = new Date(preavisoTime).toISOString().split('T')[0];
    const diffPreaviso = Math.ceil((preavisoTime - now) / (1000 * 60 * 60 * 24));

    let preUrgency: 'urgent' | 'warning' | 'normal' = 'normal';
    let preDesc = `Fecha límite para remitir notificación de no renovación formal (${preavisoDateStr}).`;

    if (diffPreaviso < 7) {
      preUrgency = 'urgent';
      preDesc =
        diffPreaviso <= 0
          ? `La ventana de preaviso de 30 días concluyó el ${preavisoDateStr}. Si no hubo aviso previo, opera prórroga automática.`
          : `Quedan ${diffPreaviso} días para remitir carta de preaviso formal antes de renovación automática.`;
    } else if (diffPreaviso <= 30) {
      preUrgency = 'warning';
      preDesc = `Faltan ${diffPreaviso} días para el plazo límite de preaviso (${preavisoDateStr}).`;
    } else {
      preUrgency = 'normal';
      preDesc = `Plazo de preaviso programado para el ${preavisoDateStr} (${diffPreaviso} días restantes).`;
    }

    result.push({
      id: `preaviso-${audit.id}`,
      date: preavisoDateStr,
      title: `Preaviso de Renovación (30 Días): ${audit.contractTitle}`,
      daysRemaining: diffPreaviso > 0 ? diffPreaviso : 0,
      urgency: preUrgency,
      description: preDesc,
      contractId: audit.id,
      contractTitle: audit.contractTitle,
      dismissed: false,
    });

    // 3. Hitos adicionales específicos si existen
    if (Array.isArray(audit.keyDeadlines)) {
      audit.keyDeadlines.forEach((dl, dlIdx) => {
        result.push({
          ...dl,
          id: dl.id || `custom-dl-${audit.id}-${dlIdx}`,
          contractId: audit.id,
          contractTitle: audit.contractTitle,
          dismissed: dl.dismissed || false,
        });
      });
    }
  });

  return result;
}
