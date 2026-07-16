export type DetailTableName = "companies" | "contacts" | "opportunities";

export type DetailField = { key: string; label: string };

export const DETAIL_FIELD_CATALOG: Record<DetailTableName, DetailField[]> = {
  companies: [
    { key: "nombre_dominio_empresa", label: "Nombre de dominio de la empresa" },
    { key: "industry", label: "Industria" },
    { key: "tax_id", label: "NIF / CIF" },
    { key: "fiscal_address", label: "Dirección fiscal" },
    { key: "fecha_creacion", label: "Fecha de creación" },
  ],
  contacts: [
    { key: "correo_electronico", label: "Correo electrónico" },
    { key: "numero_telefono", label: "Número de teléfono" },
    { key: "phone_country", label: "País (teléfono)" },
    { key: "company", label: "Empresa" },
    { key: "fuente_trafico_original", label: "Fuente de tráfico original" },
    { key: "desglose_fuente_original_1", label: "Desglose de la fuente original 1" },
    { key: "source_url", label: "URL de origen" },
    { key: "tax_id", label: "NIF" },
    { key: "fiscal_address", label: "Dirección fiscal" },
    { key: "ultimo_contacto", label: "Último contacto" },
  ],
  opportunities: [
    { key: "company", label: "Empresa" },
    { key: "contact", label: "Contacto" },
    { key: "amount", label: "Importe" },
    { key: "notes", label: "Notas" },
    { key: "created_at", label: "Creada" },
  ],
};

export const DEFAULT_DETAIL_FIELDS: Record<DetailTableName, string[]> = {
  companies: ["nombre_dominio_empresa", "industry", "tax_id", "fiscal_address"],
  contacts: ["correo_electronico", "numero_telefono", "company", "fuente_trafico_original"],
  opportunities: ["company", "amount", "notes"],
};

export function resolveDetailFields(tableName: DetailTableName, saved: string[] | null | undefined): DetailField[] {
  const catalog = DETAIL_FIELD_CATALOG[tableName];
  const keys = saved && saved.length > 0 ? saved : DEFAULT_DETAIL_FIELDS[tableName];
  return keys.map((key) => catalog.find((f) => f.key === key)).filter((f): f is DetailField => Boolean(f));
}
