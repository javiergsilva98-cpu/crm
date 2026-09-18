"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { error?: string } | void;

const USER_MANAGE_ROLES = ["admin", "presidente"];

// Comprobación real (rol de la fila `profiles` del usuario autenticado),
// no el selector de vista de la demo: gestionar cuentas es sensible y
// no debe depender de una cookie que cualquiera puede cambiar.
async function assertCanManageUsers(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return "No has iniciado sesión.";
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !USER_MANAGE_ROLES.includes(profile.role)) {
    return "No tienes permiso para gestionar usuarios.";
  }
  return null;
}

export async function createUserAccount(formData: FormData): Promise<ActionResult> {
  const permError = await assertCanManageUsers();
  if (permError) {
    return { error: permError };
  }

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const memberId = (formData.get("member_id") as string) || null;

  if (!email || !password || password.length < 6 || !role) {
    return { error: "Indica email, una contraseña de al menos 6 caracteres y un rol." };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "No se pudo crear la cuenta." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role, member_id: memberId })
    .eq("id", created.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/usuarios");
}

export async function updateUserAccount(formData: FormData): Promise<ActionResult> {
  const permError = await assertCanManageUsers();
  if (permError) {
    return { error: permError };
  }

  const id = formData.get("id") as string;
  const role = formData.get("role") as string;
  const memberId = (formData.get("member_id") as string) || null;

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role, member_id: memberId }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/usuarios");
}

export async function deleteUserAccount(formData: FormData): Promise<ActionResult> {
  const permError = await assertCanManageUsers();
  if (permError) {
    return { error: permError };
  }

  const id = formData.get("id") as string;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/usuarios");
}
