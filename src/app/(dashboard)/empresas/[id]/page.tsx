import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addActivity, deleteActivity, addTagToCompany, removeTagFromCompany } from "./actions";
import { calculateTotals } from "@/lib/invoice";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitida",
  paid: "Pagada",
  cancelled: "Anulada",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: company }, { data: contacts }, { data: opportunities }, { data: activities }, { data: taggables }, { data: invoices }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("id, name, website, industry, notes, tax_id, fiscal_address")
        .eq("id", id)
        .single(),
      supabase
        .from("contacts")
        .select("id, full_name, email, phone")
        .eq("company_id", id)
        .order("full_name"),
      supabase
        .from("opportunities")
        .select("id, title, stage, amount")
        .eq("company_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("activities")
        .select("id, body, created_at")
        .eq("company_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("taggables").select("tag_id, tags(id, name, color)").eq("company_id", id),
      supabase
        .from("invoices")
        .select("id, invoice_number, issue_date, status, tax_rate, invoice_items(quantity, unit_price)")
        .eq("company_id", id)
        .order("invoice_number", { ascending: false }),
    ]);

  if (!company) {
    notFound();
  }

  const totalPipeline = (opportunities ?? []).reduce((sum, o) => sum + Number(o.amount), 0);
  const tags = (taggables ?? [])
    .map((t) => t.tags as unknown as { id: string; name: string; color: string } | null)
    .filter((t): t is { id: string; name: string; color: string } => t !== null);

  return (
    <div>
      <Link href="/empresas" className="mb-4 inline-block text-sm text-ink-soft hover:underline">
        ← Volver a empresas
      </Link>

      <div className="mb-8 rounded-lg border border-border bg-raised p-6">
        <h1 className="font-heading text-3xl font-semibold text-ink">{company.name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <form action={removeTagFromCompany}>
                <input type="hidden" name="tag_id" value={tag.id} />
                <input type="hidden" name="company_id" value={id} />
                <button type="submit" aria-label={`Quitar etiqueta ${tag.name}`} className="ml-1">
                  ×
                </button>
              </form>
            </span>
          ))}
          <form action={addTagToCompany} className="inline-flex items-center gap-1">
            <input type="hidden" name="company_id" value={id} />
            <input
              name="tag_name"
              placeholder="+ etiqueta"
              className="w-24 rounded-full border border-border px-2 py-0.5 text-xs"
            />
          </form>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-mute">Sitio web</dt>
            <dd>{company.website || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-mute">Industria</dt>
            <dd>{company.industry || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-mute">Pipeline total</dt>
            <dd>${totalPipeline.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-ink-mute">NIF / CIF</dt>
            <dd>{company.tax_id || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-mute">Dirección fiscal</dt>
            <dd>{company.fiscal_address || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Contactos ({contacts?.length ?? 0})</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-strong bg-sunken">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Nombre</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Email</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {contacts?.map((contact) => (
                <tr key={contact.id} className="border-t border-border transition-colors hover:bg-sunken">
                  <td className="px-4 py-2">{contact.full_name}</td>
                  <td className="px-4 py-2">{contact.email}</td>
                  <td className="px-4 py-2">{contact.phone}</td>
                </tr>
              ))}
              {contacts?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-ink-mute">
                    Sin contactos asociados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Oportunidades ({opportunities?.length ?? 0})</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-strong bg-sunken">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Título</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Etapa</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Monto</th>
              </tr>
            </thead>
            <tbody>
              {opportunities?.map((opp) => (
                <tr key={opp.id} className="border-t border-border transition-colors hover:bg-sunken">
                  <td className="px-4 py-2">{opp.title}</td>
                  <td className="px-4 py-2 capitalize">{opp.stage}</td>
                  <td className="px-4 py-2">${Number(opp.amount).toLocaleString()}</td>
                </tr>
              ))}
              {opportunities?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-ink-mute">
                    Sin oportunidades asociadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Facturas ({invoices?.length ?? 0})</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-strong bg-sunken">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Número</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Fecha</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Estado</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Total</th>
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
                    <td className="px-4 py-2">
                      <Link href={`/facturas/${invoice.id}`} className="text-ink hover:underline">
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-ink-soft">
                      {new Date(invoice.issue_date + "T00:00:00").toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-2 text-ink-soft">{STATUS_LABELS[invoice.status] ?? invoice.status}</td>
                    <td className="px-4 py-2 text-ink">{total.toFixed(2)}€</td>
                  </tr>
                );
              })}
              {invoices?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink-mute">
                    Sin facturas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Actividad ({activities?.length ?? 0})</h2>
        <form action={addActivity} className="mb-3 flex gap-2">
          <input type="hidden" name="company_id" value={id} />
          <input
            name="body"
            placeholder="Añadir una nota (llamada, reunión, email...)"
            required
            className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
            Añadir
          </button>
        </form>
        <div className="flex flex-col gap-2">
          {activities?.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border border-border bg-raised px-4 py-3 text-sm"
            >
              <div>
                <p>{activity.body}</p>
                <p className="text-xs text-ink-mute">
                  {new Date(activity.created_at).toLocaleString("es-ES")}
                </p>
              </div>
              <form action={deleteActivity}>
                <input type="hidden" name="id" value={activity.id} />
                <input type="hidden" name="company_id" value={id} />
                <button type="submit" className="text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
          {activities?.length === 0 && (
            <p className="rounded-lg border border-border bg-raised px-4 py-6 text-center text-ink-mute">
              Sin actividad registrada todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
