import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { ExportLink } from "@/components/export-link";
import { AuditEntryRow } from "./audit-entry-row";
import { BIG_MOVEMENT_TABLES, type AuditRow } from "./summarize";
import { AUDIT_ROLES } from "@/lib/permissions";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ big?: string }>;
}) {
  const { big } = await searchParams;
  const bigOnly = big === "1";
  const supabase = await createClient();
  const demoRole = await getDemoRole();

  if (!AUDIT_ROLES.includes(demoRole)) {
    return (
      <p className="text-sm text-muted">
        La auditoría es cosa de admin, presidencia y tesorería. Cambia de rol arriba a la derecha
        para verla.
      </p>
    );
  }

  let query = supabase
    .from("audit_log")
    .select("id, table_name, action, actor_email, old_data, new_data, created_at")
    .order("created_at", { ascending: false })
    .limit(150);
  if (bigOnly) {
    query = query.in("table_name", BIG_MOVEMENT_TABLES);
  }
  const { data } = await query;

  const entries = (data ?? []) as AuditRow[];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Auditoría</h1>
        <ExportLink href={bigOnly ? "/api/export/auditoria?big=1" : "/api/export/auditoria"} label="Exportar" />
      </div>
      <p className="mb-5 text-sm text-muted">
        Historial de altas, bajas y cambios en socios, tesorería, inventario, consumos y cuentas.
        Se registra solo (nadie puede editarlo ni borrarlo desde la app). Toca una fila para ver el
        detalle.
      </p>

      <div className="mb-4 flex gap-1.5">
        <Link
          href="/auditoria"
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${!bigOnly ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"}`}
        >
          Todo
        </Link>
        <Link
          href="/auditoria?big=1"
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${bigOnly ? "border-accent bg-accent-soft text-accent" : "border-border text-muted"}`}
        >
          Solo movimientos gordos
        </Link>
      </div>
      {bigOnly && (
        <p className="mb-4 text-xs text-muted">
          Altas de socios, reposiciones de inventario, cambios de precio y cesiones de
          responsabilidad del fichaje.
        </p>
      )}

      <div className="overflow-hidden rounded-[18px] border border-border bg-card">
        {entries.map((row, idx) => (
          <AuditEntryRow key={row.id} row={row} isLast={idx === entries.length - 1} />
        ))}
        {entries.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">Todavía no hay nada registrado.</p>
        )}
      </div>
    </div>
  );
}
