import type { SupabaseClient } from "@supabase/supabase-js";
import type { RawData } from "./aggregate";

export async function fetchRawData(supabase: SupabaseClient): Promise<RawData> {
  const [{ data: companies }, { data: contacts }, { data: opportunities }, { data: expenses }, { data: invoiceItems }, { data: channelSessions }] =
    await Promise.all([
      supabase.from("companies").select("created_at"),
      supabase.from("contacts").select("created_at, source"),
      supabase.from("opportunities").select("created_at, stage, amount"),
      supabase.from("expenses").select("expense_date, category, amount, tax_rate"),
      supabase
        .from("invoice_items")
        .select("invoice_id, quantity, unit_price, invoices!inner(issue_date, tax_rate, status)"),
      supabase.from("channel_sessions").select("month, channel, sessions"),
    ]);

  // Se agrupa por invoice_id (no por el objeto `invoices` embebido: PostgREST
  // devuelve una copia nueva de ese objeto por cada línea, así que agrupar
  // por identidad de objeto nunca uniría las líneas de una misma factura).
  // Base y cuota de IVA se guardan por separado: el IVA repercutido no es
  // ingreso del negocio, es dinero retenido para Hacienda (ver P&L).
  const perInvoice = new Map<string, { issue_date: string; status: string; base: number; tax: number }>();
  for (const row of invoiceItems ?? []) {
    const invoice = Array.isArray(row.invoices) ? row.invoices[0] : row.invoices;
    if (!invoice) continue;
    const lineBase = Number(row.quantity) * Number(row.unit_price);
    const acc = perInvoice.get(row.invoice_id) ?? { issue_date: invoice.issue_date, status: invoice.status, base: 0, tax: 0 };
    acc.base += lineBase;
    acc.tax += lineBase * (Number(invoice.tax_rate) / 100);
    perInvoice.set(row.invoice_id, acc);
  }

  return {
    companies: companies ?? [],
    contacts: contacts ?? [],
    opportunities: (opportunities ?? []).map((o) => ({ ...o, amount: Number(o.amount) })),
    expenses: (expenses ?? []).map((e) => ({ ...e, amount: Number(e.amount), tax_rate: Number(e.tax_rate) })),
    invoices: Array.from(perInvoice.values()),
    channelSessions: (channelSessions ?? []).map((c) => ({ ...c, sessions: Number(c.sessions) })),
  };
}
