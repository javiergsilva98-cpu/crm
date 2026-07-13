"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseInvoiceItems } from "@/lib/invoice";

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

export async function createInvoice(formData: FormData) {
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
  const invoiceNumber = await nextInvoiceNumber(supabase, user.id, year);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      owner_id: user.id,
      company_id: companyId,
      contact_id: String(formData.get("contact_id") ?? "").trim() || null,
      opportunity_id: String(formData.get("opportunity_id") ?? "").trim() || null,
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: String(formData.get("due_date") ?? "").trim() || null,
      tax_rate: Number(formData.get("tax_rate") ?? 21) || 0,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !invoice) return;

  await supabase.from("invoice_items").insert(
    items.map((item, position) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position,
    })),
  );

  revalidatePath("/facturas");
  redirect(`/facturas/${invoice.id}`);
}

export async function updateInvoice(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const items = parseInvoiceItems(formData);
  if (items.length === 0) return;

  const companyId = String(formData.get("company_id") ?? "").trim();
  if (!companyId) return;

  await supabase
    .from("invoices")
    .update({
      company_id: companyId,
      contact_id: String(formData.get("contact_id") ?? "").trim() || null,
      opportunity_id: String(formData.get("opportunity_id") ?? "").trim() || null,
      issue_date: String(formData.get("issue_date") ?? "").trim() || new Date().toISOString().slice(0, 10),
      due_date: String(formData.get("due_date") ?? "").trim() || null,
      tax_rate: Number(formData.get("tax_rate") ?? 21) || 0,
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  await supabase.from("invoice_items").insert(
    items.map((item, position) => ({
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position,
    })),
  );

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
  redirect(`/facturas/${id}`);
}

export async function updateInvoiceStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["draft", "issued", "paid", "cancelled"].includes(status)) return;

  await supabase
    .from("invoices")
    .update({
      status,
      paid_at: status === "paid" ? new Date().toISOString().slice(0, 10) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
}

export async function updatePaidAt(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const paidAt = String(formData.get("paid_at") ?? "").trim() || null;

  await supabase
    .from("invoices")
    .update({ paid_at: paidAt, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
}

export async function deleteInvoice(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("invoices").delete().eq("id", id);
  revalidatePath("/facturas");
  redirect("/facturas");
}
