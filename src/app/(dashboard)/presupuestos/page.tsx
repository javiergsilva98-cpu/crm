import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyStateRow } from "@/components/empty-state";
import { calculateTotals } from "@/lib/invoice";
import { deleteQuote } from "./actions";
import { HelpButton } from "@/components/help-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aceptado",
  rejected: "Rechazado",
  expired: "Caducado",
};

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string; estado?: string }>;
}) {
  const { empresa, estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("quotes")
    .select(
      "id, quote_number, issue_date, valid_until, status, converted_invoice_id, tax_rate, companies!company_id(name), quote_items(quantity, unit_price)",
    )
    .order("quote_number", { ascending: false });

  if (empresa) query = query.eq("company_id", empresa);
  if (estado) query = query.eq("status", estado);

  const [{ data: quotes, error: quotesError }, { data: companies }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
            Presupuestos
            <HelpButton slug="presupuestos" label="Presupuestos" />
          </h1>
          <p className="mt-1 text-sm text-ink-mute">Envía presupuestos a tus clientes y conviértelos en factura al aceptarse.</p>
        </div>
        <Link
          href="/presupuestos/nueva"
          className="flex items-center gap-2 rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover"
        >
          <span className="text-base leading-none">+</span> Nuevo presupuesto
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
          <Link href="/presupuestos" className="w-full rounded-full px-4 py-1.5 text-sm text-ink-mute hover:text-ink sm:w-auto">
            Limpiar
          </Link>
        )}
      </form>

      {quotesError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar los presupuestos: {quotesError.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Número</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Empresa</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Fecha</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Estado</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Total</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {quotes?.map((quote) => {
              const { total } = calculateTotals(
                (quote.quote_items as unknown as { quantity: number; unit_price: number }[]) ?? [],
                Number(quote.tax_rate),
              );
              return (
                <tr key={quote.id} className="border-t border-border transition-colors hover:bg-sunken">
                  <td className="px-4 py-2">
                    <Link href={`/presupuestos/${quote.id}`} className="text-ink hover:underline">
                      {quote.quote_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{(quote.companies as unknown as { name: string } | null)?.name}</td>
                  <td className="px-4 py-2 text-ink-soft">
                    {new Date(quote.issue_date + "T00:00:00").toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-2 text-ink-soft">
                    {STATUS_LABELS[quote.status] ?? quote.status}
                    {quote.converted_invoice_id && <span className="text-ink-mute"> · facturado</span>}
                  </td>
                  <td className="px-4 py-2 text-ink">{total.toFixed(2)}€</td>
                  <td className="px-4 py-2 text-right">
                    {quote.status === "draft" && (
                      <form action={deleteQuote}>
                        <input type="hidden" name="id" value={quote.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`¿Eliminar el presupuesto ${quote.quote_number}? Esta acción no se puede deshacer.`}
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
            {quotes?.length === 0 &&
              (empresa || estado ? (
                <EmptyStateRow colSpan={6} title="Sin resultados" body="Ningún presupuesto coincide con este filtro." />
              ) : (
                <EmptyStateRow
                  colSpan={6}
                  title="Todavía no tienes presupuestos"
                  body="Crea el primero con el botón + Nuevo presupuesto de arriba."
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
