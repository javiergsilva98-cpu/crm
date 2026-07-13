import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCompany } from "./actions";
import { CompanyRow } from "./company-row";
import { EmptyStateRow } from "@/components/empty-state";

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select("id, name, website, industry, tax_id, fiscal_address, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,industry.ilike.%${q}%`);
  }

  const { data: companies } = await query;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink">Empresas</h1>
          <p className="mt-1 text-sm text-ink-mute">Las cuentas con las que trabajas.</p>
        </div>
        <Link href="/empresas/export" className="text-sm text-ink-soft hover:text-ink hover:underline">
          Exportar CSV
        </Link>
      </div>

      <form action={createCompany} className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-raised p-4 sm:flex-row sm:flex-wrap">
        <input name="name" placeholder="Nombre" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
        <input name="website" placeholder="Sitio web" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
        <input name="industry" placeholder="Industria" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
        <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-calm-hover sm:w-auto">
          Agregar empresa
        </button>
      </form>

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o industria..."
          className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft outline-none focus:text-ink sm:max-w-sm"
        />
        <button type="submit" className="w-full rounded-full bg-sunken px-4 py-1.5 text-sm text-ink-soft hover:text-ink sm:w-auto">
          Buscar
        </button>
        {q && (
          <Link href="/empresas" className="w-full rounded-full px-4 py-1.5 text-sm text-ink-mute hover:text-ink sm:w-auto">
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Nombre</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Sitio web</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Industria</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {companies?.map((company) => (
              <CompanyRow key={company.id} company={company} />
            ))}
            {companies?.length === 0 &&
              (q ? (
                <EmptyStateRow colSpan={4} title="Sin resultados" body={`Ninguna empresa coincide con "${q}". Prueba con otro término o limpia el filtro.`} />
              ) : (
                <EmptyStateRow
                  colSpan={4}
                  title="Todavía no tienes empresas"
                  body="Añade la primera arriba — nombre y, si lo sabes, su sitio web (así los contactos con ese dominio de email se vinculan solos)."
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
