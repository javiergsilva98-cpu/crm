// Lógica de agregación pura (sin Supabase) para poder reutilizarla tanto en
// el servidor (con datos ya traídos de la base) como en el cliente, para la
// vista previa en vivo del constructor avanzado de informes.

import { STAGE_LABELS } from "@/lib/stages";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/expenses";
import { CHANNEL_LABELS } from "@/lib/channels";

export const METRICS = [
  { key: "opportunities_by_stage", label: "Oportunidades por etapa", kind: "count_amount", dimension: "category" },
  { key: "opportunities_by_month", label: "Oportunidades creadas por mes", kind: "count", dimension: "month" },
  { key: "invoices_by_month", label: "Facturación por mes", kind: "amount", dimension: "month" },
  { key: "expenses_by_category", label: "Gastos por categoría", kind: "amount", dimension: "category" },
  { key: "expenses_by_month", label: "Gastos por mes", kind: "amount", dimension: "month" },
  { key: "contacts_by_source", label: "Contactos por canal", kind: "count", dimension: "category" },
  { key: "companies_by_month", label: "Empresas nuevas por mes", kind: "count", dimension: "month" },
] as const;

export type MetricKey = (typeof METRICS)[number]["key"];
export type MetricKind = (typeof METRICS)[number]["kind"];
export type MetricDimension = (typeof METRICS)[number]["dimension"];

export type MetricRow = { label: string; count?: number; amount?: number; sortKey: string };

export function metricInfo(key: string) {
  return METRICS.find((m) => m.key === key) ?? null;
}

export type RawData = {
  companies: { created_at: string }[];
  contacts: { created_at: string; source: string | null }[];
  opportunities: { created_at: string; stage: string; amount: number }[];
  invoices: { issue_date: string; status: string; total: number }[];
  expenses: { expense_date: string; category: string; amount: number }[];
};

function inRange(date: string, dateFrom: string | null, dateTo: string | null) {
  if (dateFrom && date < dateFrom) return false;
  if (dateTo && date > dateTo) return false;
  return true;
}

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
    .map(([key, value]) => ({ label: monthLabel(key), sortKey: key, [field]: value }));
}

export function aggregateMetric(
  raw: RawData,
  metric: MetricKey,
  dateFrom: string | null,
  dateTo: string | null,
): MetricRow[] {
  if (metric === "opportunities_by_stage") {
    const totals = new Map<string, { count: number; amount: number }>();
    for (const row of raw.opportunities) {
      if (!inRange(row.created_at, dateFrom, dateTo)) continue;
      const acc = totals.get(row.stage) ?? { count: 0, amount: 0 };
      acc.count += 1;
      acc.amount += Number(row.amount ?? 0);
      totals.set(row.stage, acc);
    }
    return Object.keys(STAGE_LABELS)
      .filter((stage) => totals.has(stage))
      .map((stage) => ({ label: STAGE_LABELS[stage as keyof typeof STAGE_LABELS], sortKey: stage, ...totals.get(stage)! }));
  }

  if (metric === "opportunities_by_month") {
    const totals = new Map<string, number>();
    for (const row of raw.opportunities) {
      if (!inRange(row.created_at, dateFrom, dateTo)) continue;
      const key = monthKey(row.created_at);
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    return sortedMonthRows(totals, "count");
  }

  if (metric === "companies_by_month") {
    const totals = new Map<string, number>();
    for (const row of raw.companies) {
      if (!inRange(row.created_at, dateFrom, dateTo)) continue;
      const key = monthKey(row.created_at);
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    return sortedMonthRows(totals, "count");
  }

  if (metric === "contacts_by_source") {
    const totals = new Map<string, number>();
    for (const row of raw.contacts) {
      if (!inRange(row.created_at, dateFrom, dateTo)) continue;
      const key = row.source ?? "otro";
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    return Array.from(totals.entries())
      .map(([key, count]) => ({ label: CHANNEL_LABELS[key as keyof typeof CHANNEL_LABELS] ?? key, sortKey: key, count }))
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }

  if (metric === "expenses_by_category") {
    const totals = new Map<string, number>();
    for (const row of raw.expenses) {
      if (!inRange(row.expense_date, dateFrom, dateTo)) continue;
      totals.set(row.category, (totals.get(row.category) ?? 0) + Number(row.amount ?? 0));
    }
    return Array.from(totals.entries())
      .map(([key, amount]) => ({ label: EXPENSE_CATEGORY_LABELS[key as keyof typeof EXPENSE_CATEGORY_LABELS] ?? key, sortKey: key, amount }))
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }

  if (metric === "expenses_by_month") {
    const totals = new Map<string, number>();
    for (const row of raw.expenses) {
      if (!inRange(row.expense_date, dateFrom, dateTo)) continue;
      const key = monthKey(row.expense_date);
      totals.set(key, (totals.get(key) ?? 0) + Number(row.amount ?? 0));
    }
    return sortedMonthRows(totals, "amount");
  }

  // invoices_by_month
  const totals = new Map<string, number>();
  for (const row of raw.invoices) {
    if (row.status === "draft" || row.status === "cancelled") continue;
    if (!inRange(row.issue_date, dateFrom, dateTo)) continue;
    const key = monthKey(row.issue_date);
    totals.set(key, (totals.get(key) ?? 0) + row.total);
  }
  return sortedMonthRows(totals, "amount");
}

export function totalOf(rows: MetricRow[], kind: MetricKind): number {
  const field = kind === "count" ? "count" : "amount";
  return rows.reduce((sum, row) => sum + Number(row[field] ?? 0), 0);
}

export function previousPeriod(dateFrom: string, dateTo: string): { from: string; to: string } {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const lengthMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom = new Date(prevTo.getTime() - lengthMs);
  return { from: prevFrom.toISOString().slice(0, 10), to: prevTo.toISOString().slice(0, 10) };
}
