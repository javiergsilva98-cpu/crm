import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createQuote } from "../actions";
import { QuoteForm } from "../quote-form";
import { HelpButton } from "@/components/help-button";

export default async function NuevoPresupuestoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: companies }, { data: contacts }, { data: opportunities }, { data: templates }, { data: services }] =
    await Promise.all([
      supabase.from("companies").select("id, name:nombre_empresa").order("nombre_empresa"),
      supabase.from("contacts").select("id, full_name").order("full_name"),
      supabase.from("opportunities").select("id, title:nombre_negocio").order("fecha_creacion", { ascending: false }),
      supabase.from("quote_templates").select("id, name").eq("owner_id", user?.id ?? "").order("name"),
      supabase.from("services").select("id, name, description, unit_price").eq("owner_id", user?.id ?? "").order("name"),
    ]);

  return (
    <div>
      <Link href="/presupuestos" className="mb-4 inline-block text-sm text-ink-soft hover:underline">
        ← Volver a presupuestos
      </Link>
      <h1 className="mb-6 flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
        Nuevo presupuesto
        <HelpButton slug="presupuestos" label="Presupuestos" />
      </h1>

      <QuoteForm
        action={createQuote}
        companies={(companies ?? []).map((c) => ({ id: c.id, label: c.name }))}
        contacts={(contacts ?? []).map((c) => ({ id: c.id, label: c.full_name }))}
        opportunities={(opportunities ?? []).map((o) => ({ id: o.id, label: o.title }))}
        templates={templates ?? []}
        services={services ?? []}
      />
    </div>
  );
}
