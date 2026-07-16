import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOpportunity } from "./actions";
import { OpportunitiesTable } from "./opportunities-table";
import { AddDisclosure } from "@/components/add-disclosure";
import { CreateForm } from "@/components/create-form";
import { STAGES, STAGE_LABELS } from "@/lib/stages";
import { FieldCustomizer } from "@/components/field-customizer";
import { DETAIL_FIELD_CATALOG, resolveDetailFields } from "@/lib/detail-fields";
import { HelpButton } from "@/components/help-button";
import { AdvancedFilters } from "@/components/advanced-filters";
import { applyFilters, parseFilters } from "@/lib/table-filters";

const FILTER_FIELDS = [
  { key: "nombre_negocio", label: "Título" },
  { key: "notes", label: "Notas" },
];

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; empresa?: string; etapa?: string; f?: string }>;
}) {
  const { q, empresa, etapa, f } = await searchParams;
  const filters = parseFilters(f);
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select(
      "id, title:nombre_negocio, stage:etapa_negocio, amount:cantidad, notes, created_at:fecha_creacion, company_id:empresa_asociada_principal, contact_id, fecha_cierre, ultimo_contacto, fuente_trafico_original, desglose_fuente_original_1, desglose_fuente_original_2, esta_cerrado_ganado, esta_cerrado_perdido, fecha_ultima_modificacion, tipo_negocio, siguiente_paso, fuente_registro, probabilidad_negocio, valor_ponderado, motivo_cierre_perdido, motivo_cierre_ganado, ultima_fuente_trafico, desglose_ultima_fuente_1, desglose_ultima_fuente_2, descripcion_negocio, prioridad, categoria_prevision, ingresos_recurrentes_mensuales_mrr, companies!empresa_asociada_principal(name:nombre_empresa), contacts!contact_id(full_name)",
    )
    .order("fecha_creacion", { ascending: false });

  if (q) {
    query = query.ilike("nombre_negocio", `%${q}%`);
  }
  if (empresa) {
    query = query.eq("empresa_asociada_principal", empresa);
  }
  if (etapa) {
    query = query.eq("etapa_negocio", etapa);
  }
  query = applyFilters(query, filters);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: opportunities, error: opportunitiesError }, { data: companies }, { data: viewSettings }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name:nombre_empresa").order("nombre_empresa"),
    user
      ? supabase.from("detail_view_settings").select("fields").eq("owner_id", user.id).eq("table_name", "opportunities").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const detailFields = resolveDetailFields("opportunities", viewSettings?.fields as string[] | null);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
            Oportunidades
            <HelpButton slug="pipeline-oportunidades" label="Etapas y pipeline" />
          </h1>
          <p className="mt-1 text-sm text-ink-mute">Tu pipeline de ventas, de nuevo a ganado.</p>
        </div>
        <div className="flex items-center gap-4">
          <FieldCustomizer tableName="opportunities" catalog={DETAIL_FIELD_CATALOG.opportunities} selected={detailFields.map((f) => f.key)} />
          <Link href="/oportunidades/export" className="text-sm text-ink-soft hover:text-ink hover:underline">
            Exportar CSV
          </Link>
          <Link href="/oportunidades/pipeline" className="text-sm text-ink-soft hover:text-ink hover:underline">
            Ver como pipeline
          </Link>
        </div>
      </div>

      <AddDisclosure label="Agregar oportunidad">
        {(close) => (
          <CreateForm action={createOpportunity} onSuccess={close} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input name="title" placeholder="Título" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
            <input name="amount" type="number" step="0.01" placeholder="Monto" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-32" />
            <select name="company_id" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
              <option value="">Sin empresa</option>
              {companies?.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
              Agregar
            </button>
          </CreateForm>
        )}
      </AddDisclosure>

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por título..."
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
        <select name="etapa" defaultValue={etapa ?? ""} className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft sm:w-auto">
          <option value="">Todas las etapas</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="w-full rounded-full bg-sunken px-4 py-1.5 text-sm text-ink-soft hover:text-ink sm:w-auto">
          Buscar
        </button>
        {(q || empresa || etapa) && (
          <Link href="/oportunidades" className="w-full rounded-full px-4 py-1.5 text-sm text-ink-mute hover:text-ink sm:w-auto">
            Limpiar
          </Link>
        )}
      </form>

      <div className="mb-6">
        <AdvancedFilters fields={FILTER_FIELDS} initial={filters} />
      </div>

      {opportunitiesError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar las oportunidades: {opportunitiesError.message}
        </div>
      )}

      <OpportunitiesTable
        opportunities={(opportunities ?? []).map((opp) => ({
          ...opp,
          companies: (opp.companies as unknown as { name: string } | null) ?? null,
          contacts: (opp.contacts as unknown as { full_name: string } | null) ?? null,
        }))}
        companies={companies ?? []}
        detailFields={detailFields}
        emptyTitle={q || empresa || etapa || filters.length > 0 ? "Sin resultados" : "Todavía no tienes oportunidades"}
        emptyBody={
          q || empresa || etapa || filters.length > 0
            ? "Ninguna oportunidad coincide con este filtro. Prueba a limpiarlo."
            : "Añade la primera arriba para empezar a ver tu pipeline tomar forma."
        }
      />
    </div>
  );
}
