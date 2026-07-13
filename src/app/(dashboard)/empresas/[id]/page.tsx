import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addActivity, deleteActivity, addTagToCompany, removeTagFromCompany } from "./actions";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: company }, { data: contacts }, { data: opportunities }, { data: activities }, { data: taggables }] =
    await Promise.all([
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
      supabase
        .from("activities")
        .select("id, body, created_at")
        .eq("company_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("taggables").select("tag_id, tags(id, name, color)").eq("company_id", id),
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
      <Link href="/empresas" className="mb-4 inline-block text-sm text-gray-600 dark:text-gray-400 hover:underline">
        ← Volver a empresas
      </Link>

      <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h1 className="text-2xl font-semibold">{company.name}</h1>

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
              className="w-24 rounded-full border border-gray-300 dark:border-gray-700 px-2 py-0.5 text-xs"
            />
          </form>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-500 dark:text-gray-500">Sitio web</dt>
            <dd>{company.website || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-500">Industria</dt>
            <dd>{company.industry || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-500">Pipeline total</dt>
            <dd>${totalPipeline.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Contactos ({contacts?.length ?? 0})</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {contacts?.map((contact) => (
                <tr key={contact.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2">{contact.full_name}</td>
                  <td className="px-4 py-2">{contact.email}</td>
                  <td className="px-4 py-2">{contact.phone}</td>
                </tr>
              ))}
              {contacts?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400 dark:text-gray-600">
                    Sin contactos asociados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Oportunidades ({opportunities?.length ?? 0})</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-500">
              <tr>
                <th className="px-4 py-2">Título</th>
                <th className="px-4 py-2">Etapa</th>
                <th className="px-4 py-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {opportunities?.map((opp) => (
                <tr key={opp.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2">{opp.title}</td>
                  <td className="px-4 py-2 capitalize">{opp.stage}</td>
                  <td className="px-4 py-2">${Number(opp.amount).toLocaleString()}</td>
                </tr>
              ))}
              {opportunities?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400 dark:text-gray-600">
                    Sin oportunidades asociadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Actividad ({activities?.length ?? 0})</h2>
        <form action={addActivity} className="mb-3 flex gap-2">
          <input type="hidden" name="company_id" value={id} />
          <input
            name="body"
            placeholder="Añadir una nota (llamada, reunión, email...)"
            required
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            Añadir
          </button>
        </form>
        <div className="flex flex-col gap-2">
          {activities?.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
            >
              <div>
                <p>{activity.body}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(activity.created_at).toLocaleString("es-ES")}
                </p>
              </div>
              <form action={deleteActivity}>
                <input type="hidden" name="id" value={activity.id} />
                <input type="hidden" name="company_id" value={id} />
                <button type="submit" className="text-red-600 hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
          {activities?.length === 0 && (
            <p className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-6 text-center text-gray-400 dark:text-gray-600">
              Sin actividad registrada todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
