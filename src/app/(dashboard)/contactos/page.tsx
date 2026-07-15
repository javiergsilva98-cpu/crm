import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createContact } from "./actions";
import { ContactRow } from "./contact-row";
import { ImportButton } from "./import-button";
import { CHANNELS, CHANNEL_LABELS } from "@/lib/channels";
import { EmptyStateRow } from "@/components/empty-state";
import { AddDisclosure } from "@/components/add-disclosure";
import { FieldCustomizer } from "@/components/field-customizer";
import { DETAIL_FIELD_CATALOG, resolveDetailFields } from "@/lib/detail-fields";
import { HelpButton } from "@/components/help-button";
import { ResizableTh } from "@/components/resizable-th";

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; empresa?: string; canal?: string }>;
}) {
  const { q, empresa, canal } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, full_name, email, phone, phone_prefix, phone_country, company_id, source, source_detail, source_url, tax_id, fiscal_address, last_activity_at, last_activity_by, companies!company_id(name)",
    )
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: contacts, error: contactsError }, { data: companies }, { data: profiles }, { data: viewSettings }] =
    await Promise.all([
      query,
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("profiles").select("id, email"),
      user
        ? supabase.from("detail_view_settings").select("fields").eq("owner_id", user.id).eq("table_name", "contacts").maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const profileEmailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));
  const detailFields = resolveDetailFields("contacts", viewSettings?.fields as string[] | null);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
            Contactos
            <HelpButton slug="canal-origen-contactos" label="Canal de origen" />
          </h1>
          <p className="mt-1 text-sm text-ink-mute">Las personas que han llegado a tu negocio. Haz clic en una fila para ver más detalles.</p>
        </div>
        <div className="flex items-center gap-4">
          <FieldCustomizer tableName="contacts" catalog={DETAIL_FIELD_CATALOG.contacts} selected={detailFields.map((f) => f.key)} />
          <ImportButton />
          <Link href="/contactos/export" className="text-sm text-ink-soft hover:text-ink hover:underline">
            Exportar CSV
          </Link>
        </div>
      </div>

      <AddDisclosure label="Agregar contacto">
        <form action={createContact} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input name="first_name" placeholder="Nombre" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
          <input name="last_name" placeholder="Apellidos" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
          <input name="email" type="email" placeholder="Email" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
          <input name="phone_prefix" placeholder="Prefijo" defaultValue="+34" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-20" />
          <input name="phone" placeholder="Teléfono" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
          <input name="phone_country" placeholder="País" defaultValue="España" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
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
          <input
            name="source_url"
            type="url"
            placeholder="URL de origen (ej. landing, anuncio...)"
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
          />
          <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
            Agregar
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-mute">
          Si dejas &quot;Detectar por email&quot;, se vincula automáticamente a la empresa cuyo sitio web coincida con el dominio del email (ej. juan@acme.com → Acme, si su sitio web es acme.com).
        </p>
      </AddDisclosure>

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
        <table className="w-full text-left text-sm" style={{ tableLayout: "fixed" }}>
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <ResizableTh tableId="contactos" columnKey="full_name" defaultWidth={160}>Nombre</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="email" defaultWidth={200}>Email</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="phone" defaultWidth={130}>Teléfono</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="company" defaultWidth={160}>Empresa</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="source" defaultWidth={120}>Canal</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="last_activity" defaultWidth={160}>Última actividad</ResizableTh>
              <th className="px-4 py-2.5" style={{ width: 96 }} />
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
                lastActivityByEmail={contact.last_activity_by ? (profileEmailById.get(contact.last_activity_by) ?? null) : null}
                detailFields={detailFields}
              />
            ))}
            {contacts?.length === 0 &&
              (q || empresa || canal ? (
                <EmptyStateRow colSpan={7} title="Sin resultados" body="Ningún contacto coincide con este filtro. Prueba a limpiarlo." />
              ) : (
                <EmptyStateRow
                  colSpan={7}
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
