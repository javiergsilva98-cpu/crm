import { createClient } from "@/lib/supabase/server";
import { createCompany, deleteCompany } from "./actions";

export default async function EmpresasPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, website, industry, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Empresas</h1>

      <form action={createCompany} className="mb-8 flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <input name="name" placeholder="Nombre" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="website" placeholder="Sitio web" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="industry" placeholder="Industria" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Agregar
        </button>
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
              <tr key={company.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{company.name}</td>
                <td className="px-4 py-2">{company.website}</td>
                <td className="px-4 py-2">{company.industry}</td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteCompany}>
                    <input type="hidden" name="id" value={company.id} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {companies?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No hay empresas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
