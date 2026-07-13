import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createContact } from "./actions";
import { ContactRow } from "./contact-row";
import { ImportButton } from "./import-button";
import { CHANNELS, CHANNEL_LABELS } from "@/lib/channels";

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; empresa?: string; canal?: string }>;
}) {
  const { q, empresa, canal } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("id, full_name, email, phone, company_id, source, source_detail, companies(name)")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (empresa) {
    query = query.eq("company_id", empresa);
  }
  if (canal) {
    query = query.eq("source", canal);
  }

  const [{ data: contacts }, { data: companies }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contactos</h1>
        <div className="flex items-center gap-4">
          <ImportButton />
          <Link href="/contactos/export" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Exportar CSV
          </Link>
        </div>
      </div>

      <form action={createContact} className="mb-2 flex flex-wrap gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <input name="full_name" placeholder="Nombre completo" required className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Email" className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm" />
        <input name="phone" placeholder="Teléfono" className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm" />
        <select name="company_id" className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm">
          <option value="">Detectar por email / sin empresa</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <select name="source" className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm">
          <option value="">¿De dónde vino?</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {CHANNEL_LABELS[c]}
            </option>
          ))}
        </select>
        <input
          name="source_detail"
          placeholder="Detalle (ej. post reels enero, Miguel...)"
          className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Agregar
        </button>
      </form>
      <p className="mb-6 text-xs text-gray-500 dark:text-gray-500">
        Si dejas &quot;Detectar por email&quot;, se vincula automáticamente a la empresa cuyo sitio web coincida con el dominio del email (ej. juan@acme.com → Acme, si su sitio web es acme.com).
      </p>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o email..."
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
        <select name="canal" defaultValue={canal ?? ""} className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm">
          <option value="">Todos los canales</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {CHANNEL_LABELS[c]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">
          Buscar
        </button>
        {(q || empresa || canal) && (
          <Link href="/contactos" className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Canal</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={{
                  ...contact,
                  companies: (contact.companies as unknown as { name: string } | null) ?? null,
                }}
                companies={companies ?? []}
              />
            ))}
            {contacts?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400 dark:text-gray-600">
                  {q || empresa || canal ? "No se encontraron contactos." : "No hay contactos todavía."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
