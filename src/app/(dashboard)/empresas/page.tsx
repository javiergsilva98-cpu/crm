import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCompany } from "./actions";
import { CompaniesTable } from "./companies-table";
import { AddDisclosure } from "@/components/add-disclosure";
import { CreateForm } from "@/components/create-form";
import { FieldCustomizer } from "@/components/field-customizer";
import { DETAIL_FIELD_CATALOG, resolveDetailFields } from "@/lib/detail-fields";
import { HelpButton } from "@/components/help-button";
import { AdvancedFilters } from "@/components/advanced-filters";
import { applyFilters, parseFilters } from "@/lib/table-filters";
import { LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS } from "@/lib/contact-lifecycle";

const FILTER_FIELDS = [
  { key: "nombre_empresa", label: "Nombre de la empresa" },
  { key: "nombre_dominio_empresa", label: "Nombre de dominio de la empresa" },
  { key: "industry", label: "Industria" },
  { key: "tax_id", label: "NIF / CIF" },
  { key: "fiscal_address", label: "Dirección fiscal" },
];

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  const { q, f } = await searchParams;
  const filters = parseFilters(f);
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select(
      "id, nombre_empresa, nombre_dominio_empresa, industry, numero_telefono, etapa_ciclo_vida, ultimo_contacto, tax_id, fiscal_address, fecha_creacion, fecha_ultima_modificacion, direccion, direccion_2, ciudad, estado_region, codigo_postal, pais_region, descripcion, industria, ingresos_anuales, numero_empleados, pagina_empresa_linkedin, tipo, fuente_registro, estado_oportunidad_venta, fecha_cierre_se_hizo_cliente, fuente_trafico_original, ultima_fuente_trafico, desglose_fuente_original_1, desglose_fuente_original_2, datos_ultima_fuente_1, datos_ultima_fuente_2, fecha_ultima_fuente_trafico, primera_conversion, fecha_primera_conversion, conversion_reciente, fecha_conversion_reciente",
    )
    .order("fecha_creacion", { ascending: false });

  if (q) {
    query = query.or(`nombre_empresa.ilike.%${q}%,industry.ilike.%${q}%`);
  }
  query = applyFilters(query, filters);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: companies, error: companiesError }, { data: viewSettings }] = await Promise.all([
    query,
    user
      ? supabase.from("detail_view_settings").select("fields").eq("owner_id", user.id).eq("table_name", "companies").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const detailFields = resolveDetailFields("companies", viewSettings?.fields as string[] | null);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
            Empresas
            <HelpButton slug="personalizar-fichas" label="Personalizar fichas" />
          </h1>
          <p className="mt-1 text-sm text-ink-mute">Las cuentas con las que trabajas. Haz clic en una fila para ver más detalles.</p>
        </div>
        <div className="flex items-center gap-3">
          <FieldCustomizer tableName="companies" catalog={DETAIL_FIELD_CATALOG.companies} selected={detailFields.map((f) => f.key)} />
          <Link href="/empresas/export" className="text-sm text-ink-soft hover:text-ink hover:underline">
            Exportar CSV
          </Link>
        </div>
      </div>

      <AddDisclosure label="Agregar empresa">
        {(close) => (
          <CreateForm action={createCompany} onSuccess={close} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input name="name" placeholder="Nombre" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
            <input
              name="website"
              placeholder="Sitio web (ej. miempresa.com)"
              pattern="^(https?:\/\/)?[\w-]+(\.[\w-]+)+.*$"
              title="Escribe un dominio válido, ej. miempresa.com o https://miempresa.com"
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
            />
            <input name="industry" placeholder="Industria" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
            <input name="phone" placeholder="Número de teléfono" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
            <select name="lifecycle_stage" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
              <option value="">Etapa del ciclo de vida</option>
              {LIFECYCLE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {LIFECYCLE_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
              Agregar
            </button>
          </CreateForm>
        )}
      </AddDisclosure>

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

      <div className="mb-6">
        <AdvancedFilters fields={FILTER_FIELDS} initial={filters} />
      </div>

      {companiesError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar las empresas: {companiesError.message}
        </div>
      )}

      <CompaniesTable
        companies={companies ?? []}
        detailFields={detailFields}
        emptyTitle={q || filters.length > 0 ? "Sin resultados" : "Todavía no tienes empresas"}
        emptyBody={
          q || filters.length > 0
            ? `Ninguna empresa coincide con "${q}". Prueba con otro término o limpia el filtro.`
            : "Añade la primera con el botón + de arriba — nombre y, si lo sabes, su sitio web (así los contactos con ese dominio de email se vinculan solos)."
        }
      />
    </div>
  );
}
