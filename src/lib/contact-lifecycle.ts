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
