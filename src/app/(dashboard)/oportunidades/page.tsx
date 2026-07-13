import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOpportunity } from "./actions";
import { OpportunityRow } from "./opportunity-row";
import { EmptyStateRow } from "@/components/empty-state";

const STAGES = ["nuevo", "calificado", "propuesta", "negociacion", "ganado", "perdido"];

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; empresa?: string; etapa?: string }>;
}) {
  const { q, empresa, etapa } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select("id, title, stage, amount, company_id, companies(name)")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }
  if (empresa) {
    query = query.eq("company_id", empresa);
  }
  if (etapa) {
    query = query.eq("stage", etapa);
  }

  const [{ data: opportunities }, { data: companies }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink">Oportunidades</h1>
          <p className="mt-1 text-sm text-ink-mute">Tu pipeline de ventas, de nuevo a ganado.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/oportunidades/export" className="text-sm text-ink-soft hover:text-ink hover:underline">
            Exportar CSV
          </Link>
          <Link href="/oportunidades/pipeline" className="text-sm text-ink-soft hover:text-ink hover:underline">
            Ver como pipeline
          </Link>
        </div>
      </div>

      <form action={createOpportunity} className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-raised p-4 sm:flex-row sm:flex-wrap">
        <input name="title" placeholder="Título" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
        <input name="amount" type="number" step="0.01" placeholder="Monto" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-32" />
        <select name="company_id" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
          <option value="">Sin empresa</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-calm-hover sm:w-auto">
          Agregar oportunidad
        </button>
      </form>

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por título..."
          className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft outline-none focus:text-ink sm:max-w-sm"
        />
        <select name="empresa" defaultValue={empresa ?? ""} className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft sm:w-auto">
          <option value="">Todas las empresas</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <select name="etapa" defaultValue={etapa ?? ""} className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft sm:w-auto">
          <option value="">Todas las etapas</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="w-full rounded-full bg-sunken px-4 py-1.5 text-sm text-ink-soft hover:text-ink sm:w-auto">
          Buscar
        </button>
        {(q || empresa || etapa) && (
          <Link href="/oportunidades" className="w-full rounded-full px-4 py-1.5 text-sm text-ink-mute hover:text-ink sm:w-auto">
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Título</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Empresa</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Monto</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Etapa</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {opportunities?.map((opp) => (
              <OpportunityRow
                key={opp.id}
                opportunity={{
                  ...opp,
                  companies: (opp.companies as unknown as { name: string } | null) ?? null,
                }}
                companies={companies ?? []}
              />
            ))}
            {opportunities?.length === 0 &&
              (q || empresa || etapa ? (
                <EmptyStateRow colSpan={5} title="Sin resultados" body="Ninguna oportunidad coincide con este filtro. Prueba a limpiarlo." />
              ) : (
                <EmptyStateRow
                  colSpan={5}
                  title="Todavía no tienes oportunidades"
                  body="Añade la primera arriba para empezar a ver tu pipeline tomar forma."
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
