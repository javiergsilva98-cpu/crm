"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseInvoiceItems } from "@/lib/invoice";

async function nextQuoteNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  year: number,
): Promise<string> {
  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .like("quote_number", `P${year}-%`);

  const next = (count ?? 0) + 1;
  return `P${year}-${String(next).padStart(4, "0")}`;
}

export async function createQuote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const companyId = String(formData.get("company_id") ?? "").trim();
  if (!companyId) return;

  const items = parseInvoiceItems(formData);
  if (items.length === 0) return;

  const issueDate = String(formData.get("issue_date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const year = new Date(issueDate).getFullYear();
  const quoteNumber = await nextQuoteNumber(supabase, user.id, year);

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      owner_id: user.id,
      company_id: companyId,
      contact_id: String(formData.get("contact_id") ?? "").trim() || null,
      opportunity_id: String(formData.get("opportunity_id") ?? "").trim() || null,
      template_id: String(formData.get("template_id") ?? "").trim() || null,
      quote_number: quoteNumber,
      issue_date: issueDate,
      valid_until: String(formData.get("valid_until") ?? "").trim() || null,
      tax_rate: Number(formData.get("tax_rate") ?? 21) || 0,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !quote) return;

  await supabase.from("quote_items").insert(
    items.map((item, position) => ({
      quote_id: quote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position,
    })),
  );

  revalidatePath("/presupuestos");
  redirect(`/presupuestos/${quote.id}`);
}

export async function updateQuote(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const items = parseInvoiceItems(formData);
  if (items.length === 0) return;

  const companyId = String(formData.get("company_id") ?? "").trim();
  if (!companyId) return;

  await supabase
    .from("quotes")
    .update({
      company_id: companyId,
      contact_id: String(formData.get("contact_id") ?? "").trim() || null,
      opportunity_id: String(formData.get("opportunity_id") ?? "").trim() || null,
      template_id: String(formData.get("template_id") ?? "").trim() || null,
      issue_date: String(formData.get("issue_date") ?? "").trim() || new Date().toISOString().slice(0, 10),
      valid_until: String(formData.get("valid_until") ?? "").trim() || null,
      tax_rate: Number(formData.get("tax_rate") ?? 21) || 0,
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  await supabase.from("quote_items").delete().eq("quote_id", id);
  await supabase.from("quote_items").insert(
    items.map((item, position) => ({
      quote_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position,
    })),
  );

  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
  redirect(`/presupuestos/${id}`);
}

export async function updateQuoteStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["draft", "sent", "accepted", "rejected", "expired"].includes(status)) return;

  await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
}

export async function deleteQuote(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("quotes").delete().eq("id", id);
  revalidatePath("/presupuestos");
  redirect("/presupuestos");
}

async function nextInvoiceNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  year: number,
): Promise<string> {
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .like("invoice_number", `${year}-%`);

  const next = (count ?? 0) + 1;
  return `${year}-${String(next).padStart(4, "0")}`;
}

export async function convertQuoteToInvoice(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id"));

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).single(),
    supabase.from("quote_items").select("description, quantity, unit_price").eq("quote_id", id).order("position"),
  ]);
  if (!quote || quote.converted_invoice_id) return;

  const issueDate = new Date().toISOString().slice(0, 10);
  const year = new Date(issueDate).getFullYear();
  const invoiceNumber = await nextInvoiceNumber(supabase, user.id, year);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      owner_id: user.id,
      company_id: quote.company_id,
      contact_id: quote.contact_id,
      opportunity_id: quote.opportunity_id,
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      tax_rate: quote.tax_rate,
      notes: quote.notes ? `${quote.notes}\n\n(Generada desde el presupuesto ${quote.quote_number})` : `Generada desde el presupuesto ${quote.quote_number}`,
    })
    .select("id")
    .single();

  if (error || !invoice) return;

  await supabase.from("invoice_items").insert(
    (items ?? []).map((item, position) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position,
    })),
  );

  await supabase.from("quotes").update({ converted_invoice_id: invoice.id }).eq("id", id);

  revalidatePath("/presupuestos");
  revalidatePath("/facturas");
  redirect(`/facturas/${invoice.id}`);
}
