import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateTotals } from "@/lib/invoice";
import { deleteQuote, convertQuoteToInvoice } from "../actions";
import { StatusSelect } from "./status-select";
import { PrintButton } from "./print-button";
import { HelpButton } from "@/components/help-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aceptado",
  rejected: "Rechazado",
  expired: "Caducado",
};

export default async function PresupuestoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote }, { data: items }, { data: business }] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        "id, quote_number, issue_date, valid_until, status, tax_rate, notes, converted_invoice_id, companies!company_id(name:nombre_empresa, tax_id, fiscal_address), contacts!contact_id(full_name, tax_id, fiscal_address), opportunities!opportunity_id(title:nombre_negocio), quote_templates!template_id(name, logo_path, primary_color, secondary_color, header_text, footer_text)",
      )
      .eq("id", id)
      .single(),
    supabase.from("quote_items").select("id, description, quantity, unit_price").eq("quote_id", id).order("position"),
    supabase
      .from("business_settings")
      .select("legal_name, tax_id, address, postal_code, city, province, country, email")
      .maybeSingle(),
  ]);

  if (!quote) {
    notFound();
  }

  const { subtotal, taxAmount, total } = calculateTotals(items ?? [], Number(quote.tax_rate));
  const company = quote.companies as unknown as { name: string; tax_id: string | null; fiscal_address: string | null } | null;
  const contact = quote.contacts as unknown as { full_name: string; tax_id: string | null; fiscal_address: string | null } | null;
  const opportunity = quote.opportunities as unknown as { title: string } | null;
  const template = quote.quote_templates as unknown as {
    name: string;
    logo_path: string | null;
    primary_color: string;
    secondary_color: string;
    header_text: string | null;
    footer_text: string | null;
  } | null;

  const logoUrl = template?.logo_path ? supabase.storage.from("quote-logos").getPublicUrl(template.logo_path).data.publicUrl : null;
  const primaryColor = template?.primary_color ?? "var(--color-ink)";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Link href="/presupuestos" className="text-sm text-ink-soft hover:underline">
            ← Volver a presupuestos
          </Link>
          <HelpButton slug="presupuestos" label="Presupuestos" />
        </div>
        <div className="flex items-center gap-3">
          <PrintButton />
          {quote.status === "draft" && (
            <Link
              href={`/presupuestos/${id}/editar`}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
            >
              Editar
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-raised p-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="mb-3 h-12 w-auto object-contain" />
            )}
            <h1 className="font-heading text-2xl font-semibold text-ink" style={{ color: primaryColor }}>
              Presupuesto {quote.quote_number}
            </h1>
            {template?.header_text && <p className="mt-1 text-sm text-ink-soft">{template.header_text}</p>}
            <p className="mt-1 text-sm text-ink-mute">
              Emitido el {new Date(quote.issue_date + "T00:00:00").toLocaleDateString("es-ES")}
              {quote.valid_until && ` · Válido hasta el ${new Date(quote.valid_until + "T00:00:00").toLocaleDateString("es-ES")}`}
            </p>
            {opportunity && <p className="mt-1 text-sm text-ink-mute">Oportunidad: {opportunity.title}</p>}
          </div>
          <div className="text-right">
            <div className="print:hidden">
              <StatusSelect id={id} status={quote.status} />
            </div>
            <p className="hidden text-sm text-ink-mute print:block">{STATUS_LABELS[quote.status] ?? quote.status}</p>
            {quote.converted_invoice_id && (
              <p className="mt-2 text-xs text-ink-mute">
                <Link href={`/facturas/${quote.converted_invoice_id}`} className="hover:underline">
                  Ver factura generada →
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-ink-mute uppercase">De</p>
            <p className="text-sm font-medium text-ink">{business?.legal_name ?? "—"}</p>
            {business?.tax_id && <p className="text-sm text-ink-soft">{business.tax_id}</p>}
            {business?.address && (
              <p className="text-sm text-ink-soft">
                {business.address}, {business.postal_code} {business.city} ({business.province})
              </p>
            )}
            {business?.email && <p className="text-sm text-ink-soft">{business.email}</p>}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-ink-mute uppercase">Para</p>
            <p className="text-sm font-medium text-ink">{company?.name ?? "—"}</p>
            {contact && <p className="text-sm text-ink-soft">Att. {contact.full_name}</p>}
            {(contact?.tax_id ?? company?.tax_id) && <p className="text-sm text-ink-soft">{contact?.tax_id ?? company?.tax_id}</p>}
            {(contact?.fiscal_address ?? company?.fiscal_address) && (
              <p className="text-sm text-ink-soft">{contact?.fiscal_address ?? company?.fiscal_address}</p>
            )}
          </div>
        </div>

        <div className="mb-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-strong bg-sunken">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Concepto</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Cantidad</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Precio</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-ink-soft uppercase">Importe</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-2 text-ink">{item.description}</td>
                  <td className="px-4 py-2 text-ink-soft">{item.quantity}</td>
                  <td className="px-4 py-2 text-ink-soft">{Number(item.unit_price).toFixed(2)}€</td>
                  <td className="px-4 py-2 text-right text-ink">{(item.quantity * item.unit_price).toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-xs text-sm">
            <div className="flex justify-between py-1 text-ink-soft">
              <span>Base imponible</span>
              <span>{subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between py-1 text-ink-soft">
              <span>IVA ({Number(quote.tax_rate)}%)</span>
              <span>{taxAmount.toFixed(2)}€</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-ink" style={{ color: primaryColor }}>
              <span>Total</span>
              <span>{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-8 border-t border-border pt-4">
            <p className="mb-1 text-xs font-semibold tracking-wide text-ink-mute uppercase">Notas</p>
            <p className="text-sm text-ink-soft">{quote.notes}</p>
          </div>
        )}

        {template?.footer_text && (
          <div className="mt-8 border-t border-border pt-4">
            <p className="text-xs text-ink-mute">{template.footer_text}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 print:hidden">
        {quote.status === "accepted" && !quote.converted_invoice_id && (
          <form action={convertQuoteToInvoice}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover">
              Convertir en factura
            </button>
          </form>
        )}
        {quote.status === "draft" && (
          <form action={deleteQuote}>
            <input type="hidden" name="id" value={id} />
            <ConfirmSubmitButton
              confirmMessage={`¿Eliminar el presupuesto ${quote.quote_number}? Esta acción no se puede deshacer.`}
              className="text-sm text-danger hover:underline"
            >
              Eliminar presupuesto
            </ConfirmSubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
