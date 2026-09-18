import { createClient } from "@/lib/supabase/server";

export const ACCOUNT_MANAGE_ROLES = ["admin", "presidente"];

// Comprobación real (rol de la fila `profiles` del usuario autenticado),
// no el selector de vista de la demo: crear/gestionar cuentas de acceso
// es sensible y no debe depender de una cookie que cualquiera puede
// cambiar. La usan tanto /usuarios como el alta de socios en /socios.
export async function assertCanManageAccounts(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return "No has iniciado sesión.";
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ACCOUNT_MANAGE_ROLES.includes(profile.role)) {
    return "No tienes permiso para gestionar cuentas.";
  }
  return null;
}
