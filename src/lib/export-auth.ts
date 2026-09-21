import { createClient } from "@/lib/supabase/server";

const EXPORT_ROLES = ["admin", "presidente", "vicepresidente", "tesorero"];

// Igual que assertCanManageUsers en /usuarios: comprueba el rol real de
// `profiles`, no el selector de vista de la demo, porque exportar datos
// del club es sensible.
export async function assertCanExport(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return "No has iniciado sesión.";
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !EXPORT_ROLES.includes(profile.role)) {
    return "No tienes permiso para exportar datos.";
  }
  return null;
}
