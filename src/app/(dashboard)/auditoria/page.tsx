import { createClient } from "@/lib/supabase/server";
import { getDemoRole } from "@/lib/demo-context";
import { ExportLink } from "@/components/export-link";
import { AuditEntryRow } from "./audit-entry-row";
import type { AuditRow } from "./summarize";

const AUDIT_ROLES = ["admin", "presidente", "tesorero"];

export default async function AuditoriaPage() {
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

  const { data } = await supabase
    .from("audit_log")
    .select("id, table_name, action, actor_email, old_data, new_data, created_at")
    .order("created_at", { ascending: false })
    .limit(150);

  const entries = (data ?? []) as AuditRow[];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Auditoría</h1>
        <ExportLink href="/api/export/auditoria" label="Exportar" />
      </div>
      <p className="mb-5 text-sm text-muted">
        Historial de altas, bajas y cambios en socios, tesorería, inventario, consumos y cuentas.
        Se registra solo (nadie puede editarlo ni borrarlo desde la app). Toca una fila para ver el
        detalle.
      </p>

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
