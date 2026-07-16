export const DEAL_TYPES = ["nuevo_negocio", "negocio_existente"] as const;
export type DealType = (typeof DEAL_TYPES)[number];
export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  nuevo_negocio: "Nuevo negocio",
  negocio_existente: "Negocio existente",
};

export const DEAL_PRIORITIES = ["baja", "media", "alta"] as const;
export type DealPriority = (typeof DEAL_PRIORITIES)[number];
export const DEAL_PRIORITY_LABELS: Record<DealPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const FORECAST_CATEGORIES = ["pipeline", "mejor_caso", "comprometido", "omitido", "cerrado"] as const;
export type ForecastCategory = (typeof FORECAST_CATEGORIES)[number];
export const FORECAST_CATEGORY_LABELS: Record<ForecastCategory, string> = {
  pipeline: "Pipeline",
  mejor_caso: "Mejor caso",
  comprometido: "Comprometido",
  omitido: "Omitido",
  cerrado: "Cerrado",
};
