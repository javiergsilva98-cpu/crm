export const STAGES = ["nuevo", "calificado", "propuesta", "negociacion", "ganado", "perdido"] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  nuevo: "Nuevo",
  calificado: "Calificado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};
