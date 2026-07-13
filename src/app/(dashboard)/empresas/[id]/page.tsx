import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: company }, { data: contacts }, { data: opportunities }] = await Promise.all([
    supabase.from("companies").select("id, name, website, industry, notes").eq("id", id).single(),
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
  ]);

  if (!company) {
    notFound();
  }

  const totalPipeline = (opportunities ?? []).reduce((sum, o) => sum + Number(o.amount), 0);

  return (
    <div>
      <Link href="/empresas" className="mb-4 inline-block text-sm text-gray-600 hover:underline">
        ← Volver a empresas
      </Link>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">{company.name}</h1>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-500">Sitio web</dt>
            <dd>{company.website || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Industria</dt>
            <dd>{company.industry || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Pipeline total</dt>
            <dd>${totalPipeline.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Contactos ({contacts?.length ?? 0})</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {contacts?.map((contact) => (
                <tr key={contact.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{contact.full_name}</td>
                  <td className="px-4 py-2">{contact.email}</td>
                  <td className="px-4 py-2">{contact.phone}</td>
                </tr>
              ))}
              {contacts?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    Sin contactos asociados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Oportunidades ({opportunities?.length ?? 0})</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2">Título</th>
                <th className="px-4 py-2">Etapa</th>
                <th className="px-4 py-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {opportunities?.map((opp) => (
                <tr key={opp.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{opp.title}</td>
                  <td className="px-4 py-2 capitalize">{opp.stage}</td>
                  <td className="px-4 py-2">${Number(opp.amount).toLocaleString()}</td>
                </tr>
              ))}
              {opportunities?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    Sin oportunidades asociadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
