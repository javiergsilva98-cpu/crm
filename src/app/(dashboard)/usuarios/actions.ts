"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCanManageAccounts } from "@/lib/account-auth";
import { generatePassword } from "@/lib/generate-password";

type ActionResult = { error?: string } | void;
type ResetResult = { error?: string } | { password: string };

export async function createUserAccount(formData: FormData): Promise<ActionResult> {
  const permError = await assertCanManageAccounts();
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
    .update({ role, member_id: memberId, must_change_password: true })
    .eq("id", created.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/usuarios");
}

export async function updateUserAccount(formData: FormData): Promise<ActionResult> {
  const permError = await assertCanManageAccounts();
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
  const permError = await assertCanManageAccounts();
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

// Genera una contraseña provisional nueva para una cuenta existente (por
// si el socio la ha perdido) y le vuelve a exigir cambiarla al entrar.
export async function resetUserPassword(id: string): Promise<ResetResult> {
  const permError = await assertCanManageAccounts();
  if (permError) {
    return { error: permError };
  }

  const password = generatePassword();
  const admin = createAdminClient();

  const { error: authError } = await admin.auth.admin.updateUserById(id, { password });
  if (authError) {
    return { error: authError.message };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", id);
  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/usuarios");
  return { password };
}
