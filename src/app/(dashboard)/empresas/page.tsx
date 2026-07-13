import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCompany } from "./actions";
import { CompanyRow } from "./company-row";

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select("id, name, website, industry, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,industry.ilike.%${q}%`);
  }

  const { data: companies } = await query;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Empresas</h1>
        <Link href="/empresas/export" className="text-sm text-gray-600 hover:underline">
          Exportar CSV
        </Link>
      </div>

      <form action={createCompany} className="mb-8 flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <input name="name" placeholder="Nombre" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="website" placeholder="Sitio web" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="industry" placeholder="Industria" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Agregar
        </button>
      </form>

      <form method="get" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o industria..."
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md border border-gray-300 px-4 py-2 text-sm">
          Buscar
        </button>
        {q && (
          <Link href="/empresas" className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600">
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Sitio web</th>
              <th className="px-4 py-2">Industria</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {companies?.map((company) => (
              <CompanyRow key={company.id} company={company} />
            ))}
            {companies?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  {q ? "No se encontraron empresas." : "No hay empresas todavía."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
