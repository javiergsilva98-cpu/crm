import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole, getDemoMemberIdCookie } from "@/lib/demo-context";
import { AlertIcon } from "@/components/icons";
import { ReportForm } from "./report-form";
import { IncidenciaRow, type IncidenciaRowData } from "./incidencia-row";

// Cambiar el estado de una incidencia es cosa de presidencia, tesorería
// y bodeguero (más admin) — el bodeguero entra porque buena parte de
// las incidencias serán de bodega/inventario. No incluye
// vicepresidente: el reparto de "quién resuelve qué" no quedó cerrado
// para esta pantalla, así que de momento se deja tal cual pide la
// Fase 7 en vez de mirar el patrón habitual de admin+presidente+vice.
const RESOLVE_ROLES = ["admin", "presidente", "tesorero", "bodeguero"];

const CATEGORY_LABELS: Record<string, string> = {
  rotura: "Algo roto",
  falta_material: "Falta material",
  convivencia: "Convivencia",
  consumicion_incorrecta: "Consumición mal registrada",
  producto: "Producto de inventario",
  fichaje: "Fichaje / responsable",
  otro: "Otro",
};
const ESTADOS = ["pendiente", "en_revision", "resuelta"] as const;
const ESTADO_LABELS: Record<string, string> = { pendiente: "Pendiente", en_revision: "En revisión", resuelta: "Resuelta" };

type RawIncidencia = {
  id: string;
  categoria: string;
  descripcion: string;
  estado: string;
  decision: string | null;
  fecha_incidencia: string;
  created_at: string;
  resolucion_notas: string | null;
  referencia_consumicion_id: string | null;
  reporter: { full_name: string } | null;
  resolver: { full_name: string } | null;
  consumption: { corrected: boolean } | null;
};

export default async function IncidenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; categoria?: string }>;
}) {
  const { estado: estadoFilter, categoria: categoriaFilter } = await searchParams;
  const supabase = await createClient();
  const demoRole = await getDemoRole();
  const canResolve = RESOLVE_ROLES.includes(demoRole);

  const cookieId = await getDemoMemberIdCookie();
  const { data: membersData } = await supabase
    .from("members")
    .select("id, full_name")
    .eq("status", "activo")
    .order("full_name");
  const members = membersData ?? [];
  const currentMemberId = members.find((m) => m.id === cookieId)?.id ?? members[0]?.id ?? "";

  let query = supabase
    .from("incidencias")
    .select(
      "id, categoria, descripcion, estado, decision, fecha_incidencia, created_at, resolucion_notas, referencia_consumicion_id, reporter:members!incidencias_reportado_por_member_id_fkey(full_name), resolver:members!incidencias_resuelta_por_member_id_fkey(full_name), consumption:consumptions!incidencias_referencia_consumicion_id_fkey(corrected)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (estadoFilter && (ESTADOS as readonly string[]).includes(estadoFilter)) {
    query = query.eq("estado", estadoFilter);
  }
  if (categoriaFilter && categoriaFilter in CATEGORY_LABELS) {
    query = query.eq("categoria", categoriaFilter);
  }

  const [{ data: incidenciasData }, { data: consumptionsData }, { data: inventoryItemsData }, { data: eventsData }] =
    await Promise.all([
      query,
      supabase
        .from("consumptions")
        .select("id, unit_price, consumed_at, menu_items(name)")
        .eq("member_id", currentMemberId)
        .order("consumed_at", { ascending: false })
        .limit(20),
      supabase.from("inventory_items").select("id, name").order("name"),
      supabase.from("events").select("id, name, event_date").order("event_date", { ascending: false }).limit(30),
    ]);

  const raw = (incidenciasData ?? []) as unknown as RawIncidencia[];
  const rows: IncidenciaRowData[] = raw.map((r) => ({
    id: r.id,
    categoria: r.categoria,
    descripcion: r.descripcion,
    estado: r.estado,
    decision: r.decision,
    fecha_incidencia: r.fecha_incidencia,
    created_at: r.created_at,
    reporter: r.reporter?.full_name ?? "—",
    resolvedBy: r.resolver?.full_name ?? null,
    resolucion_notas: r.resolucion_notas,
    isCorreccionConsumicion: r.consumption?.corrected === true,
  }));

  const consumptions = ((consumptionsData ?? []) as unknown as Array<{
    id: string;
    unit_price: number;
    consumed_at: string;
    menu_items: { name: string } | null;
  }>).map((c) => ({
    id: c.id,
    label: `${c.menu_items?.name ?? "—"} · ${new Date(c.consumed_at).toLocaleDateString("es-ES")} · ${c.unit_price.toFixed(2)} €`,
  }));
  const inventoryItems = inventoryItemsData ?? [];
  const events = (eventsData ?? []).map((e) => ({ id: e.id, name: `${e.name} (${e.event_date})` }));

  function filterHref(next: { estado?: string; categoria?: string }) {
    const params = new URLSearchParams();
    const e = next.estado !== undefined ? next.estado : estadoFilter;
    const c = next.categoria !== undefined ? next.categoria : categoriaFilter;
    if (e) params.set("estado", e);
    if (c) params.set("categoria", c);
    const qs = params.toString();
    return qs ? `/incidencias?${qs}` : "/incidencias";
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-soft">
          <AlertIcon className="h-[18px] w-[18px] text-warning" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Incidencias</h1>
      </div>
      <p className="mb-5 mt-1 text-sm text-muted">
        Listado visible para todo el club. Cualquier socio puede reportar; presidencia, tesorería y
        bodeguero pueden cambiar el estado o resolverlas.
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href={filterHref({ estado: undefined })}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${!estadoFilter ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"}`}
        >
          Todos los estados
        </Link>
        {ESTADOS.map((e) => (
          <Link
            key={e}
            href={filterHref({ estado: e })}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${estadoFilter === e ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"}`}
          >
            {ESTADO_LABELS[e]}
          </Link>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link
          href={filterHref({ categoria: undefined })}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${!categoriaFilter ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"}`}
        >
          Todas las categorías
        </Link>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={filterHref({ categoria: value })}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${categoriaFilter === value ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mb-7 overflow-hidden rounded-[18px] border border-border bg-card">
        {rows.map((row, idx) => (
          <IncidenciaRow key={row.id} row={row} canResolve={canResolve} isLast={idx === rows.length - 1} />
        ))}
        {rows.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">No hay incidencias con este filtro.</p>
        )}
      </div>

      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Reportar una incidencia</p>
      <ReportForm memberId={currentMemberId} consumptions={consumptions} inventoryItems={inventoryItems} events={events} />
    </div>
  );
}
