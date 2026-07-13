import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOpportunity } from "./actions";
import { OpportunityRow } from "./opportunity-row";

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Oportunidades</h1>
        <div className="flex items-center gap-4">
          <Link href="/oportunidades/export" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Exportar CSV
          </Link>
          <Link href="/oportunidades/pipeline" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Ver como pipeline
          </Link>
        </div>
      </div>

      <form action={createOpportunity} className="mb-8 flex flex-wrap gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <input name="title" placeholder="Título" required className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm" />
        <input name="amount" type="number" step="0.01" placeholder="Monto" className="w-32 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm" />
        <select name="company_id" className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm">
          <option value="">Sin empresa</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Agregar
        </button>
      </form>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por título..."
          className="w-full max-w-sm rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
        />
        <select name="empresa" defaultValue={empresa ?? ""} className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm">
          <option value="">Todas las empresas</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <select name="etapa" defaultValue={etapa ?? ""} className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm">
          <option value="">Todas las etapas</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">
          Buscar
        </button>
        {(q || empresa || etapa) && (
          <Link href="/oportunidades" className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-500">
            <tr>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Monto</th>
              <th className="px-4 py-2">Etapa</th>
              <th className="px-4 py-2" />
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
            {opportunities?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400 dark:text-gray-600">
                  {q || empresa || etapa ? "No se encontraron oportunidades." : "No hay oportunidades todavía."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
