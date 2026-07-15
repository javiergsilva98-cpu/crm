export type DetailTableName = "companies" | "contacts" | "opportunities";

export type DetailField = { key: string; label: string };

export const DETAIL_FIELD_CATALOG: Record<DetailTableName, DetailField[]> = {
  companies: [
    { key: "website", label: "Sitio web" },
    { key: "industry", label: "Industria" },
    { key: "tax_id", label: "NIF / CIF" },
    { key: "fiscal_address", label: "Dirección fiscal" },
    { key: "created_at", label: "Creada" },
  ],
  contacts: [
    { key: "email", label: "Email" },
    { key: "phone", label: "Teléfono" },
    { key: "company", label: "Empresa" },
    { key: "source", label: "Canal" },
    { key: "source_detail", label: "Detalle del canal" },
    { key: "source_url", label: "URL de origen" },
    { key: "tax_id", label: "NIF" },
    { key: "fiscal_address", label: "Dirección fiscal" },
    { key: "last_activity_at", label: "Última actividad" },
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
  companies: ["website", "industry", "tax_id", "fiscal_address"],
  contacts: ["email", "phone", "company", "source"],
  opportunities: ["company", "amount", "notes"],
};

export function resolveDetailFields(tableName: DetailTableName, saved: string[] | null | undefined): DetailField[] {
  const catalog = DETAIL_FIELD_CATALOG[tableName];
  const keys = saved && saved.length > 0 ? saved : DEFAULT_DETAIL_FIELDS[tableName];
  return keys.map((key) => catalog.find((f) => f.key === key)).filter((f): f is DetailField => Boolean(f));
}
