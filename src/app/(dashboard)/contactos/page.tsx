import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createContact } from "./actions";
import { ContactsTable } from "./contacts-table";
import { ImportButton } from "./import-button";
import { CHANNELS, CHANNEL_LABELS } from "@/lib/channels";
import { AddDisclosure } from "@/components/add-disclosure";
import { CreateForm } from "@/components/create-form";
import { FieldCustomizer } from "@/components/field-customizer";
import { DETAIL_FIELD_CATALOG, resolveDetailFields } from "@/lib/detail-fields";
import { HelpButton } from "@/components/help-button";
import { AdvancedFilters } from "@/components/advanced-filters";
import { applyFilters, parseFilters } from "@/lib/table-filters";

const FILTER_FIELDS = [
  { key: "full_name", label: "Nombre completo" },
  { key: "correo_electronico", label: "Email" },
  { key: "numero_telefono", label: "Teléfono" },
  { key: "desglose_fuente_original_1", label: "Detalle del canal" },
  { key: "tax_id", label: "NIF" },
  { key: "fiscal_address", label: "Dirección fiscal" },
];

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; empresa?: string; canal?: string; f?: string }>;
}) {
  const { q, empresa, canal, f } = await searchParams;
  const filters = parseFilters(f);
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select(
      "id, nombre, apellido, full_name, correo_electronico, numero_telefono, numero_telefono_movil, phone_prefix, phone_country, empresa_principal_asociada, nombre_empresa, fuente_trafico_original, ultima_fuente_trafico, desglose_fuente_original_1, desglose_fuente_original_2, source_url, id_clic_google_ads_gclid, id_clic_facebook_fbclid, etapa_ciclo_vida, estado_lead, cancelacion_suscripcion_todos_correos, tax_id, fiscal_address, ultimo_contacto, fecha_ultima_modificacion, last_activity_by, ciudad, estado_region, codigo_postal, pais_region, direccion, cargo, industria, url_sitio_web, url_linkedin, mensaje, correos_electronicos_adicionales, contacto_sin_gestionar, fuente_registro, base_juridica_tratamiento_datos, desglose_ultima_fuente_1, desglose_ultima_fuente_2, fecha_ultima_fuente_trafico, primera_conversion, fecha_primera_conversion, conversion_reciente, fecha_conversion_reciente, fecha_siguiente_actividad, direccion_correo_no_valida, fecha_cierre_se_hizo_cliente, companies!empresa_principal_asociada(nombre_empresa)",
    )
    .order("fecha_creacion", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,correo_electronico.ilike.%${q}%`);
  }
  if (empresa) {
    query = query.eq("empresa_principal_asociada", empresa);
  }
  if (canal) {
    query = query.eq("fuente_trafico_original", canal);
  }
  query = applyFilters(query, filters);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: contacts, error: contactsError }, { data: companies }, { data: profiles }, { data: viewSettings }] =
    await Promise.all([
      query,
      supabase.from("companies").select("id, nombre_empresa").order("nombre_empresa"),
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
        <>
          <CreateForm action={createContact} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                    {company.nombre_empresa}
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
            </CreateForm>
            <p className="mt-2 text-xs text-ink-mute">
              Si dejas &quot;Detectar por email&quot;, se vincula automáticamente a la empresa cuyo sitio web coincida con el dominio del email (ej. juan@acme.com → Acme, si su sitio web es acme.com).
            </p>
        </>
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
              {company.nombre_empresa}
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

      <div className="mb-6">
        <AdvancedFilters fields={FILTER_FIELDS} initial={filters} />
      </div>

      {contactsError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar los contactos: {contactsError.message}
        </div>
      )}

      <ContactsTable
        contacts={(contacts ?? []).map((contact) => ({
          ...contact,
          companies: (contact.companies as unknown as { nombre_empresa: string } | null) ?? null,
        }))}
        companies={companies ?? []}
        profileEmailById={profileEmailById}
        detailFields={detailFields}
        emptyTitle={q || empresa || canal || filters.length > 0 ? "Sin resultados" : "Todavía no tienes contactos"}
        emptyBody={
          q || empresa || canal || filters.length > 0
            ? "Ningún contacto coincide con este filtro. Prueba a limpiarlo."
            : "Añade el primero arriba e indica de dónde vino — es lo que te va a permitir ver qué canal te trae más clientes."
        }
      />
    </div>
  );
}
