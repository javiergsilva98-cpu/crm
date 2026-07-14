export const EXPENSE_CATEGORIES = [
  "suministros",
  "material",
  "software",
  "transporte",
  "dietas",
  "alquiler",
  "otros",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  suministros: "Suministros",
  material: "Material",
  software: "Software",
  transporte: "Transporte",
  dietas: "Dietas",
  alquiler: "Alquiler",
  otros: "Otros",
};
