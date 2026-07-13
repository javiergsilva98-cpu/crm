import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateInvoice } from "../../actions";
import { InvoiceForm } from "../../invoice-form";

export default async function EditarFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: items }, { data: companies }, { data: contacts }, { data: opportunities }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id, company_id, contact_id, opportunity_id, issue_date, due_date, tax_rate, notes, status")
        .eq("id", id)
        .single(),
      supabase.from("invoice_items").select("description, quantity, unit_price").eq("invoice_id", id).order("position"),
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("contacts").select("id, full_name").order("full_name"),
      supabase.from("opportunities").select("id, title").order("created_at", { ascending: false }),
    ]);

  if (!invoice) {
    notFound();
  }

  if (invoice.status !== "draft") {
    redirect(`/facturas/${id}`);
  }

  return (
    <div>
      <Link href={`/facturas/${id}`} className="mb-4 inline-block text-sm text-ink-soft hover:underline">
        ← Volver a la factura
      </Link>
      <h1 className="mb-6 font-heading text-3xl font-semibold text-ink">Editar factura</h1>

      <InvoiceForm
        action={updateInvoice}
        invoiceId={id}
        companies={(companies ?? []).map((c) => ({ id: c.id, label: c.name }))}
        contacts={(contacts ?? []).map((c) => ({ id: c.id, label: c.full_name }))}
        opportunities={(opportunities ?? []).map((o) => ({ id: o.id, label: o.title }))}
        initial={{
          company_id: invoice.company_id,
          contact_id: invoice.contact_id,
          opportunity_id: invoice.opportunity_id,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          tax_rate: Number(invoice.tax_rate),
          notes: invoice.notes,
          items: (items ?? []).map((i) => ({
            description: i.description,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
          })),
        }}
      />
    </div>
  );
}
