import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateQuote } from "../../actions";
import { QuoteForm } from "../../quote-form";
import { HelpButton } from "@/components/help-button";

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: quote }, { data: items }, { data: companies }, { data: contacts }, { data: opportunities }, { data: templates }, { data: services }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id, company_id, contact_id, opportunity_id, template_id, issue_date, valid_until, tax_rate, notes, status")
        .eq("id", id)
        .single(),
      supabase.from("quote_items").select("description, quantity, unit_price").eq("quote_id", id).order("position"),
      supabase.from("companies").select("id, name:nombre_empresa").order("nombre_empresa"),
      supabase.from("contacts").select("id, full_name").order("full_name"),
      supabase.from("opportunities").select("id, title:nombre_negocio").order("fecha_creacion", { ascending: false }),
      supabase.from("quote_templates").select("id, name").eq("owner_id", user?.id ?? "").order("name"),
      supabase.from("services").select("id, name, description, unit_price").eq("owner_id", user?.id ?? "").order("name"),
    ]);

  if (!quote) {
    notFound();
  }

  if (quote.status !== "draft") {
    redirect(`/presupuestos/${id}`);
  }

  return (
    <div>
      <Link href={`/presupuestos/${id}`} className="mb-4 inline-block text-sm text-ink-soft hover:underline">
        ← Volver al presupuesto
      </Link>
      <h1 className="mb-6 flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
        Editar presupuesto
        <HelpButton slug="presupuestos" label="Presupuestos" />
      </h1>

      <QuoteForm
        action={updateQuote}
        quoteId={id}
        companies={(companies ?? []).map((c) => ({ id: c.id, label: c.name }))}
        contacts={(contacts ?? []).map((c) => ({ id: c.id, label: c.full_name }))}
        opportunities={(opportunities ?? []).map((o) => ({ id: o.id, label: o.title }))}
        templates={templates ?? []}
        services={services ?? []}
        initial={{
          company_id: quote.company_id,
          contact_id: quote.contact_id,
          opportunity_id: quote.opportunity_id,
          template_id: quote.template_id,
          issue_date: quote.issue_date,
          valid_until: quote.valid_until,
          tax_rate: Number(quote.tax_rate),
          notes: quote.notes,
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
