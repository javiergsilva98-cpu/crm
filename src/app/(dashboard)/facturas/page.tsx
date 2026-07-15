import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyStateRow } from "@/components/empty-state";
import { calculateTotals } from "@/lib/invoice";
import { deleteInvoice } from "./actions";
import { HelpButton } from "@/components/help-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ResizableTh } from "@/components/resizable-th";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitida",
  paid: "Pagada",
  cancelled: "Anulada",
};

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string; estado?: string }>;
}) {
  const { empresa, estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select("id, invoice_number, issue_date, status, paid_at, tax_rate, companies!company_id(name), invoice_items(quantity, unit_price)")
    .order("invoice_number", { ascending: false });

  if (empresa) query = query.eq("company_id", empresa);
  if (estado) query = query.eq("status", estado);

  const [{ data: invoices, error: invoicesError }, { data: companies }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
            Facturas
            <HelpButton slug="facturas-estados" label="Estados y exportación" />
          </h1>
          <p className="mt-1 text-sm text-ink-mute">Numeración correlativa, vinculadas a tus empresas y negocios.</p>
        </div>
        <Link
          href="/facturas/nueva"
          className="flex items-center gap-2 rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover"
        >
          <span className="text-base leading-none">+</span> Nueva factura
        </Link>
      </div>

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row">
        <select name="empresa" defaultValue={empresa ?? ""} className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft sm:w-auto">
          <option value="">Todas las empresas</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <select name="estado" defaultValue={estado ?? ""} className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft sm:w-auto">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="w-full rounded-full bg-sunken px-4 py-1.5 text-sm text-ink-soft hover:text-ink sm:w-auto">
          Filtrar
        </button>
        {(empresa || estado) && (
          <Link href="/facturas" className="w-full rounded-full px-4 py-1.5 text-sm text-ink-mute hover:text-ink sm:w-auto">
            Limpiar
          </Link>
        )}
      </form>

      {invoicesError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar las facturas: {invoicesError.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm" style={{ tableLayout: "fixed" }}>
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <ResizableTh tableId="facturas" columnKey="number" defaultWidth={130}>Número</ResizableTh>
              <ResizableTh tableId="facturas" columnKey="company" defaultWidth={200}>Empresa</ResizableTh>
              <ResizableTh tableId="facturas" columnKey="date" defaultWidth={110}>Fecha</ResizableTh>
              <ResizableTh tableId="facturas" columnKey="status" defaultWidth={160}>Estado</ResizableTh>
              <ResizableTh tableId="facturas" columnKey="total" defaultWidth={100}>Total</ResizableTh>
              <th className="px-4 py-2.5" style={{ width: 96 }} />
            </tr>
          </thead>
          <tbody>
            {invoices?.map((invoice) => {
              const { total } = calculateTotals(
                (invoice.invoice_items as unknown as { quantity: number; unit_price: number }[]) ?? [],
                Number(invoice.tax_rate),
              );
              return (
                <tr key={invoice.id} className="border-t border-border transition-colors hover:bg-sunken">
                  <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">
                    <Link href={`/facturas/${invoice.id}`} className="text-ink hover:underline">
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">{(invoice.companies as unknown as { name: string } | null)?.name}</td>
                  <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink-soft">
                    {new Date(invoice.issue_date + "T00:00:00").toLocaleDateString("es-ES")}
                  </td>
                  <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink-soft">
                    {STATUS_LABELS[invoice.status] ?? invoice.status}
                    {invoice.status === "paid" && invoice.paid_at && (
                      <span className="text-ink-mute"> ({new Date(invoice.paid_at + "T00:00:00").toLocaleDateString("es-ES")})</span>
                    )}
                  </td>
                  <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink">{total.toFixed(2)}€</td>
                  <td className="px-4 py-2 text-right">
                    {invoice.status === "draft" && (
                      <form action={deleteInvoice}>
                        <input type="hidden" name="id" value={invoice.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`¿Eliminar la factura ${invoice.invoice_number}? Esta acción no se puede deshacer.`}
                          className="text-sm text-danger hover:underline"
                        >
                          Eliminar
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {invoices?.length === 0 &&
              (empresa || estado ? (
                <EmptyStateRow colSpan={6} title="Sin resultados" body="Ninguna factura coincide con este filtro." />
              ) : (
                <EmptyStateRow
                  colSpan={6}
                  title="Todavía no tienes facturas"
                  body="Crea la primera con el botón + Nueva factura de arriba."
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
