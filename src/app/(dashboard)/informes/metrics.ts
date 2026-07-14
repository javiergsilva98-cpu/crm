import type { SupabaseClient } from "@supabase/supabase-js";

export const METRICS = [
  { key: "opportunities_by_stage", label: "Oportunidades por etapa", kind: "count_amount" },
  { key: "opportunities_by_month", label: "Oportunidades creadas por mes", kind: "count" },
  { key: "invoices_by_month", label: "Facturación por mes", kind: "amount" },
  { key: "expenses_by_category", label: "Gastos por categoría", kind: "amount" },
  { key: "expenses_by_month", label: "Gastos por mes", kind: "amount" },
  { key: "contacts_by_source", label: "Contactos por canal", kind: "count" },
  { key: "companies_by_month", label: "Empresas nuevas por mes", kind: "count" },
] as const;

export type MetricKey = (typeof METRICS)[number]["key"];
export type MetricKind = (typeof METRICS)[number]["kind"];

export type MetricRow = { label: string; count?: number; amount?: number };

export function metricInfo(key: string) {
  return METRICS.find((m) => m.key === key) ?? null;
}

const STAGE_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  calificado: "Calificado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

const CATEGORY_LABELS: Record<string, string> = {
  suministros: "Suministros",
  material: "Material",
  software: "Software",
  transporte: "Transporte",
  dietas: "Dietas",
  alquiler: "Alquiler",
  otros: "Otros",
};

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  google: "Google",
  whatsapp: "WhatsApp",
  referido: "Referido",
  tiktok: "TikTok",
  otro: "Otro",
};

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

function monthLabel(key: string) {
  const d = new Date(`${key}-01`);
  const label = d.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function sortedMonthRows(totals: Map<string, number>, field: "count" | "amount"): MetricRow[] {
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ label: monthLabel(key), [field]: value }));
}

export async function computeMetric(
  supabase: SupabaseClient,
  metric: MetricKey,
  dateFrom: string | null,
  dateTo: string | null
): Promise<MetricRow[]> {
  if (metric === "opportunities_by_stage") {
    let query = supabase.from("opportunities").select("stage, amount, created_at");
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    const { data } = await query;
    const totals = new Map<string, { count: number; amount: number }>();
    for (const row of data ?? []) {
      const acc = totals.get(row.stage) ?? { count: 0, amount: 0 };
      acc.count += 1;
      acc.amount += Number(row.amount ?? 0);
      totals.set(row.stage, acc);
    }
    return Object.keys(STAGE_LABELS)
      .filter((stage) => totals.has(stage))
      .map((stage) => ({ label: STAGE_LABELS[stage], ...totals.get(stage)! }));
  }

  if (metric === "opportunities_by_month") {
    let query = supabase.from("opportunities").select("created_at");
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    const { data } = await query;
    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      const key = monthKey(row.created_at);
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    return sortedMonthRows(totals, "count");
  }

  if (metric === "companies_by_month") {
    let query = supabase.from("companies").select("created_at");
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    const { data } = await query;
    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      const key = monthKey(row.created_at);
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    return sortedMonthRows(totals, "count");
  }

  if (metric === "contacts_by_source") {
    let query = supabase.from("contacts").select("source, created_at");
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    const { data } = await query;
    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      const key = row.source ?? "otro";
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    return Array.from(totals.entries())
      .map(([key, count]) => ({ label: SOURCE_LABELS[key] ?? key, count }))
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }

  if (metric === "expenses_by_category") {
    let query = supabase.from("expenses").select("category, amount, expense_date");
    if (dateFrom) query = query.gte("expense_date", dateFrom);
    if (dateTo) query = query.lte("expense_date", dateTo);
    const { data } = await query;
    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      totals.set(row.category, (totals.get(row.category) ?? 0) + Number(row.amount ?? 0));
    }
    return Array.from(totals.entries())
      .map(([key, amount]) => ({ label: CATEGORY_LABELS[key] ?? key, amount }))
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }

  if (metric === "expenses_by_month") {
    let query = supabase.from("expenses").select("amount, expense_date");
    if (dateFrom) query = query.gte("expense_date", dateFrom);
    if (dateTo) query = query.lte("expense_date", dateTo);
    const { data } = await query;
    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      const key = monthKey(row.expense_date);
      totals.set(key, (totals.get(key) ?? 0) + Number(row.amount ?? 0));
    }
    return sortedMonthRows(totals, "amount");
  }

  // invoices_by_month
  const { data } = await supabase
    .from("invoice_items")
    .select("quantity, unit_price, invoices!inner(issue_date, tax_rate, status)");
  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const invoice = Array.isArray(row.invoices) ? row.invoices[0] : row.invoices;
    if (!invoice) continue;
    if (invoice.status === "draft" || invoice.status === "cancelled") continue;
    if (dateFrom && invoice.issue_date < dateFrom) continue;
    if (dateTo && invoice.issue_date > dateTo) continue;
    const key = monthKey(invoice.issue_date);
    const base = Number(row.quantity) * Number(row.unit_price);
    const total = base * (1 + Number(invoice.tax_rate) / 100);
    totals.set(key, (totals.get(key) ?? 0) + total);
  }
  return sortedMonthRows(totals, "amount");
}
