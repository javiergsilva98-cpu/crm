export const LIFECYCLE_STAGES = ["suscriptor", "lead", "mql", "sql", "oportunidad", "cliente"] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  suscriptor: "Suscriptor",
  lead: "Lead",
  mql: "MQL (lead cualificado por marketing)",
  sql: "SQL (lead cualificado por ventas)",
  oportunidad: "Oportunidad",
  cliente: "Cliente",
};

export const LEAD_STATUSES = ["nuevo", "abierto", "en_progreso", "descartado"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  abierto: "Abierto",
  en_progreso: "En progreso",
  descartado: "Descartado",
};

export const LEGAL_BASES = [
  "consentimiento",
  "ejecucion_contrato",
  "obligacion_legal",
  "interes_vital",
  "interes_publico",
  "interes_legitimo",
] as const;
export type LegalBasis = (typeof LEGAL_BASES)[number];

export const LEGAL_BASIS_LABELS: Record<LegalBasis, string> = {
  consentimiento: "Consentimiento",
  ejecucion_contrato: "Ejecución de un contrato",
  obligacion_legal: "Obligación legal",
  interes_vital: "Interés vital",
  interes_publico: "Interés público",
  interes_legitimo: "Interés legítimo",
};
