import { createClient } from "@/lib/supabase/server";

// Para operaciones que se hacen con el cliente admin (service role) —
// crear/editar/borrar cuentas, resetear contraseñas — la base de datos
// no puede atribuir el cambio a quien lo pidió (esa conexión no lleva
// su sesión). Se registra aparte con el cliente normal de la propia
// petición, que sí la lleva.
export async function logAudit(
  tableName: string,
  rowId: string | null,
  action: "insert" | "update" | "delete",
  newData?: Record<string, unknown>,
) {
  const supabase = await createClient();
  await supabase.rpc("log_audit_event", {
    p_table_name: tableName,
    p_row_id: rowId,
    p_action: action,
    p_new_data: newData ?? null,
  });
}
