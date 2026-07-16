export type DetailTableName = "companies" | "contacts" | "opportunities";

export type DetailField = { key: string; label: string };

export const DETAIL_FIELD_CATALOG: Record<DetailTableName, DetailField[]> = {
  companies: [
    { key: "nombre_dominio_empresa", label: "Nombre de dominio de la empresa" },
    { key: "industry", label: "Industria" },
    { key: "numero_telefono", label: "Número de teléfono" },
    { key: "etapa_ciclo_vida", label: "Etapa del ciclo de vida" },
    { key: "ultimo_contacto", label: "Último contacto" },
    { key: "tax_id", label: "NIF / CIF" },
    { key: "fiscal_address", label: "Dirección fiscal" },
    { key: "fecha_creacion", label: "Fecha de creación" },
    { key: "fecha_ultima_modificacion", label: "Fecha de última modificación" },
  ],
  contacts: [
    { key: "correo_electronico", label: "Correo electrónico" },
    { key: "numero_telefono", label: "Número de teléfono" },
    { key: "numero_telefono_movil", label: "Número de teléfono móvil" },
    { key: "phone_country", label: "País (teléfono)" },
    { key: "company", label: "Empresa" },
    { key: "nombre_empresa", label: "Nombre de la empresa (texto libre)" },
    { key: "fuente_trafico_original", label: "Fuente de tráfico original" },
    { key: "ultima_fuente_trafico", label: "Última fuente de tráfico" },
    { key: "desglose_fuente_original_1", label: "Desglose de la fuente original 1" },
    { key: "desglose_fuente_original_2", label: "Desglose de la fuente original 2" },
    { key: "source_url", label: "URL de origen" },
    { key: "id_clic_google_ads_gclid", label: "ID de clic de Google Ads (GCLID)" },
    { key: "id_clic_facebook_fbclid", label: "ID de clic de Facebook (FBCLID)" },
    { key: "etapa_ciclo_vida", label: "Etapa del ciclo de vida" },
    { key: "estado_lead", label: "Estado del lead" },
    { key: "cancelacion_suscripcion_todos_correos", label: "Cancelación de suscripción a todos los correos" },
    { key: "tax_id", label: "NIF" },
    { key: "fiscal_address", label: "Dirección fiscal" },
    { key: "ultimo_contacto", label: "Último contacto" },
    { key: "fecha_ultima_modificacion", label: "Fecha de última modificación" },
  ],
  opportunities: [
    { key: "company", label: "Empresa" },
    { key: "contact", label: "Contacto" },
    { key: "amount", label: "Importe" },
    { key: "notes", label: "Notas" },
    { key: "created_at", label: "Creada" },
    { key: "fecha_cierre", label: "Fecha de cierre" },
    { key: "ultimo_contacto", label: "Último contacto" },
    { key: "fuente_trafico_original", label: "Fuente de tráfico original" },
    { key: "desglose_fuente_original_1", label: "Desglose de la fuente original 1" },
    { key: "desglose_fuente_original_2", label: "Desglose de la fuente original 2" },
    { key: "esta_cerrado_ganado", label: "Está cerrado ganado" },
    { key: "esta_cerrado_perdido", label: "Está cerrado perdido" },
    { key: "fecha_ultima_modificacion", label: "Fecha de última modificación" },
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
