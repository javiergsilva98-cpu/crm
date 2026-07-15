import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "../actions";
import { InvoiceForm } from "../invoice-form";
import { HelpButton } from "@/components/help-button";

export default async function NuevaFacturaPage() {
  const supabase = await createClient();
  const [{ data: companies }, { data: contacts }, { data: opportunities }] = await Promise.all([
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("contacts").select("id, full_name").order("full_name"),
    supabase.from("opportunities").select("id, title").order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <Link href="/facturas" className="mb-4 inline-block text-sm text-ink-soft hover:underline">
        ← Volver a facturas
      </Link>
      <h1 className="mb-6 flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
        Nueva factura
        <HelpButton slug="facturas-estados" label="Estados de factura" />
      </h1>

      <InvoiceForm
        action={createInvoice}
        companies={(companies ?? []).map((c) => ({ id: c.id, label: c.name }))}
        contacts={(contacts ?? []).map((c) => ({ id: c.id, label: c.full_name }))}
        opportunities={(opportunities ?? []).map((o) => ({ id: o.id, label: o.title }))}
      />
    </div>
  );
}
