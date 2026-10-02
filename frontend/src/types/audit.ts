export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ClauseCategory =
  | 'confidencialidad'
  | 'penalizaciones'
  | 'propiedad_intelectual'
  | 'terminacion'
  | 'responsabilidad'
  | 'pagos'
  | 'garantias'
  | 'jurisdiccion'
  | 'otros';

export interface Party {
  name: string;
  role: string;
  idNumber?: string;
}

export interface AuditedClause {
  id: string;
  title: string;
  originalSnippet: string;
  category: ClauseCategory;
  riskLevel: RiskSeverity;
  finding: string;
  recommendation: string;
  compliant: boolean;
}

export interface RiskItem {
  title: string;
  severity: RiskSeverity;
  description: string;
  mitigation: string;
}

export interface KeyDeadline {
  id?: string;
  date: string;
  title: string;
  daysRemaining?: number;
  urgency: 'urgent' | 'warning' | 'normal';
  description: string;
  contractTitle?: string;
  contractId?: string;
  dismissed?: boolean;
}

export interface ContractAudit {
  id: string;
  contractTitle: string;
  documentType: string;
  fileName: string;
  fileSize?: string;
  auditDate: string; // ISO or YYYY-MM-DD
  parties: Party[];
  effectiveDate: string;
  expirationDate: string;
  renewalTerms?: string;
  totalValue?: string;
  governingLaw?: string;
  overallRiskScore: number; // 0 - 100
  complianceScore: number; // 0 - 100
  summary: string;
  clauses: AuditedClause[];
  risksIdentified: RiskItem[];
  keyDeadlines: KeyDeadline[];
  missingEssentialClauses: string[];
  status: 'auditado' | 'en_revision' | 'aprobado' | 'rechazado';
  auditedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  avatarUrl?: string;
}

export type DateFilterRange = 'today' | 'last7days' | 'thisMonth' | 'lastQuarter' | 'thisYear' | 'all';
