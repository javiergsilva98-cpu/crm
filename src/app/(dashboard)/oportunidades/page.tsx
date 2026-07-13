import { createClient } from "@/lib/supabase/server";
import { createOpportunity, deleteOpportunity } from "./actions";
import { StageSelect } from "./stage-select";

export default async function OportunidadesPage() {
  const supabase = await createClient();
  const [{ data: opportunities }, { data: companies }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id, title, stage, amount, companies(name)")
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Oportunidades</h1>

      <form action={createOpportunity} className="mb-8 flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <input name="title" placeholder="Título" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <input name="amount" type="number" step="0.01" placeholder="Monto" className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <select name="company_id" className="rounded-md border border-gray-300 px-3 py-2 text-sm">
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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
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
              <tr key={opp.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{opp.title}</td>
                <td className="px-4 py-2">{(opp.companies as unknown as { name: string } | null)?.name}</td>
                <td className="px-4 py-2">${Number(opp.amount).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <StageSelect id={opp.id} stage={opp.stage} />
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteOpportunity}>
                    <input type="hidden" name="id" value={opp.id} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {opportunities?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No hay oportunidades todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
