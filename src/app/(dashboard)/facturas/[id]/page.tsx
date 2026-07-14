import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateTotals } from "@/lib/invoice";
import { deleteInvoice } from "../actions";
import { StatusSelect } from "./status-select";
import { PrintButton } from "./print-button";
import { PaidAtInput } from "./paid-at-input";

export default async function FacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: items }, { data: business }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "id, invoice_number, issue_date, due_date, status, paid_at, tax_rate, notes, companies!company_id(name, tax_id, fiscal_address), contacts!contact_id(full_name, tax_id, fiscal_address), opportunities!opportunity_id(title)",
      )
      .eq("id", id)
      .single(),
    supabase.from("invoice_items").select("id, description, quantity, unit_price").eq("invoice_id", id).order("position"),
    supabase
      .from("business_settings")
      .select("legal_name, tax_id, address, postal_code, city, province, country, email")
      .maybeSingle(),
  ]);

  if (!invoice) {
    notFound();
  }

  const { subtotal, taxAmount, total } = calculateTotals(items ?? [], Number(invoice.tax_rate));
  const company = invoice.companies as unknown as { name: string; tax_id: string | null; fiscal_address: string | null } | null;
  const contact = invoice.contacts as unknown as { full_name: string; tax_id: string | null; fiscal_address: string | null } | null;
  const opportunity = invoice.opportunities as unknown as { title: string } | null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/facturas" className="text-sm text-ink-soft hover:underline">
          ← Volver a facturas
        </Link>
        <div className="flex items-center gap-3">
          <PrintButton />
          {invoice.status === "draft" && (
            <Link
              href={`/facturas/${id}/editar`}
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
            <h1 className="font-heading text-2xl font-semibold text-ink">Factura {invoice.invoice_number}</h1>
            <p className="mt-1 text-sm text-ink-mute">
              Emitida el {new Date(invoice.issue_date + "T00:00:00").toLocaleDateString("es-ES")}
              {invoice.due_date && ` · Vence el ${new Date(invoice.due_date + "T00:00:00").toLocaleDateString("es-ES")}`}
            </p>
            {opportunity && <p className="mt-1 text-sm text-ink-mute">Oportunidad: {opportunity.title}</p>}
          </div>
          <div className="text-right">
            <div className="print:hidden">
              <StatusSelect id={id} status={invoice.status} />
            </div>
            {invoice.status === "paid" && (
              <div className="mt-2">
                <PaidAtInput id={id} paidAt={invoice.paid_at} />
                <p className="hidden text-sm text-ink-mute print:block">
                  Pagada el {invoice.paid_at && new Date(invoice.paid_at + "T00:00:00").toLocaleDateString("es-ES")}
                </p>
              </div>
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
              <span>IVA ({Number(invoice.tax_rate)}%)</span>
              <span>{taxAmount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between border-t border-border py-2 font-semibold text-ink">
              <span>Total</span>
              <span>{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 border-t border-border pt-4">
            <p className="mb-1 text-xs font-semibold tracking-wide text-ink-mute uppercase">Notas</p>
            <p className="text-sm text-ink-soft">{invoice.notes}</p>
          </div>
        )}
      </div>

      {invoice.status === "draft" && (
        <form action={deleteInvoice} className="mt-4 print:hidden">
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="text-sm text-danger hover:underline">
            Eliminar factura
          </button>
        </form>
      )}
    </div>
  );
}
