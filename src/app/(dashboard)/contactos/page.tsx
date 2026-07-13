import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createContact } from "./actions";
import { ContactRow } from "./contact-row";
import { ImportButton } from "./import-button";
import { CHANNELS, CHANNEL_LABELS } from "@/lib/channels";
import { EmptyStateRow } from "@/components/empty-state";

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; empresa?: string; canal?: string }>;
}) {
  const { q, empresa, canal } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("id, full_name, email, phone, company_id, source, source_detail, tax_id, fiscal_address, companies(name)")
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

  const [{ data: contacts, error: contactsError }, { data: companies }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink">Contactos</h1>
          <p className="mt-1 text-sm text-ink-mute">Las personas que han llegado a tu negocio.</p>
        </div>
        <div className="flex items-center gap-4">
          <ImportButton />
          <Link href="/contactos/export" className="text-sm text-ink-soft hover:text-ink hover:underline">
            Exportar CSV
          </Link>
        </div>
      </div>

      <form action={createContact} className="mb-2 flex flex-col gap-3 rounded-lg border border-border bg-raised p-4 sm:flex-row sm:flex-wrap">
        <input name="full_name" placeholder="Nombre completo" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
        <input name="email" type="email" placeholder="Email" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
        <input name="phone" placeholder="Teléfono" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
        <select name="company_id" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
          <option value="">Detectar por email / sin empresa</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <select name="source" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
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
          className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
        />
        <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-calm-hover sm:w-auto">
          Agregar contacto
        </button>
      </form>
      <p className="mb-6 text-xs text-ink-mute">
        Si dejas &quot;Detectar por email&quot;, se vincula automáticamente a la empresa cuyo sitio web coincida con el dominio del email (ej. juan@acme.com → Acme, si su sitio web es acme.com).
      </p>

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o email..."
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
        <select name="canal" defaultValue={canal ?? ""} className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft sm:w-auto">
          <option value="">Todos los canales</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {CHANNEL_LABELS[c]}
            </option>
          ))}
        </select>
        <button type="submit" className="w-full rounded-full bg-sunken px-4 py-1.5 text-sm text-ink-soft hover:text-ink sm:w-auto">
          Buscar
        </button>
        {(q || empresa || canal) && (
          <Link href="/contactos" className="w-full rounded-full px-4 py-1.5 text-sm text-ink-mute hover:text-ink sm:w-auto">
            Limpiar
          </Link>
        )}
      </form>

      {contactsError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar los contactos: {contactsError.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Nombre</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Email</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Teléfono</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Empresa</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Canal</th>
              <th className="px-4 py-2.5" />
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
            {contacts?.length === 0 &&
              (q || empresa || canal ? (
                <EmptyStateRow colSpan={6} title="Sin resultados" body="Ningún contacto coincide con este filtro. Prueba a limpiarlo." />
              ) : (
                <EmptyStateRow
                  colSpan={6}
                  title="Todavía no tienes contactos"
                  body="Añade el primero arriba e indica de dónde vino — es lo que te va a permitir ver qué canal te trae más clientes."
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
