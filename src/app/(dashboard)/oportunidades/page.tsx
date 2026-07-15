import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOpportunity } from "./actions";
import { OpportunityRow } from "./opportunity-row";
import { EmptyStateRow } from "@/components/empty-state";
import { AddDisclosure } from "@/components/add-disclosure";
import { STAGES, STAGE_LABELS } from "@/lib/stages";
import { FieldCustomizer } from "@/components/field-customizer";
import { DETAIL_FIELD_CATALOG, resolveDetailFields } from "@/lib/detail-fields";
import { HelpButton } from "@/components/help-button";
import { ResizableTh } from "@/components/resizable-th";

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; empresa?: string; etapa?: string }>;
}) {
  const { q, empresa, etapa } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select(
      "id, title, stage, amount, notes, created_at, company_id, contact_id, companies!company_id(name), contacts!contact_id(full_name)",
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }
  if (empresa) {
    query = query.eq("company_id", empresa);
  }
  if (etapa) {
    query = query.eq("stage", etapa);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: opportunities, error: opportunitiesError }, { data: companies }, { data: viewSettings }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
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
            <HelpButton slug="personalizar-fichas" label="Personalizar fichas" />
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
        <form action={createOpportunity} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
        </form>
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

      {opportunitiesError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar las oportunidades: {opportunitiesError.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm" style={{ tableLayout: "fixed" }}>
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <ResizableTh tableId="oportunidades" columnKey="title" defaultWidth={240}>Título</ResizableTh>
              <ResizableTh tableId="oportunidades" columnKey="company" defaultWidth={180}>Empresa</ResizableTh>
              <ResizableTh tableId="oportunidades" columnKey="amount" defaultWidth={110}>Monto</ResizableTh>
              <ResizableTh tableId="oportunidades" columnKey="stage" defaultWidth={160}>Etapa</ResizableTh>
              <th className="px-4 py-2.5" style={{ width: 96 }} />
            </tr>
          </thead>
          <tbody>
            {opportunities?.map((opp) => (
              <OpportunityRow
                key={opp.id}
                opportunity={{
                  ...opp,
                  companies: (opp.companies as unknown as { name: string } | null) ?? null,
                  contacts: (opp.contacts as unknown as { full_name: string } | null) ?? null,
                }}
                companies={companies ?? []}
                detailFields={detailFields}
              />
            ))}
            {opportunities?.length === 0 &&
              (q || empresa || etapa ? (
                <EmptyStateRow colSpan={5} title="Sin resultados" body="Ninguna oportunidad coincide con este filtro. Prueba a limpiarlo." />
              ) : (
                <EmptyStateRow
                  colSpan={5}
                  title="Todavía no tienes oportunidades"
                  body="Añade la primera arriba para empezar a ver tu pipeline tomar forma."
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
