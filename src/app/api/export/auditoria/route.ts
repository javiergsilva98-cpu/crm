import { createClient } from "@/lib/supabase/server";
import { assertCanExport } from "@/lib/export-auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { tableLabel, actionLabel, summaryLine, type AuditRow } from "@/app/(dashboard)/auditoria/summarize";

export async function GET() {
  const permError = await assertCanExport();
  if (permError) {
    return new Response(permError, { status: 403 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, table_name, action, actor_email, old_data, new_data, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  const rows = ((data ?? []) as AuditRow[]).map((row) => [
    row.created_at,
    row.actor_email ?? "Sistema",
    tableLabel(row.table_name),
    actionLabel(row.action),
    summaryLine(row),
  ]);

  const csv = toCsv(["Fecha", "Quién", "Sección", "Acción", "Detalle"], rows);
  return csvResponse(`auditoria-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
