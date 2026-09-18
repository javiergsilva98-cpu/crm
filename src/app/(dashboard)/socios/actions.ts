"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCanManageAccounts } from "@/lib/account-auth";
import { logAudit } from "@/lib/audit";

type ActionResult = { error?: string } | void;
type CreateAccountResult = { error?: string } | { password: string };

// Da de alta la ficha del socio y su cuenta de acceso (email + contraseña
// provisional) en un solo paso. Si falla la creación de la cuenta,
// deshace la ficha para no dejar un socio "huérfano" sin login.
export async function createMemberAccount(formData: FormData): Promise<CreateAccountResult> {
  const permError = await assertCanManageAccounts();
  if (permError) {
    return { error: permError };
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const clubRole = formData.get("club_role") as string;
  const keyNumber = (formData.get("key_number") as string)?.trim() || null;
  const password = formData.get("password") as string;

  if (!fullName || !email || !clubRole || !password || password.length < 8) {
    return { error: "Completa nombre, email, rol y una contraseña de al menos 8 caracteres." };
  }

  const admin = createAdminClient();

  const { data: memberRow, error: memberError } = await admin
    .from("members")
    .insert({ full_name: fullName, club_role: clubRole, key_number: keyNumber })
    .select("id")
    .single();

  if (memberError || !memberRow) {
    return { error: memberError?.message ?? "No se pudo dar de alta al socio." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    await admin.from("members").delete().eq("id", memberRow.id);
    return { error: createError?.message ?? "No se pudo crear la cuenta de acceso." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: clubRole, member_id: memberRow.id, must_change_password: true })
    .eq("id", created.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  await logAudit("members", memberRow.id, "insert", {
    full_name: fullName,
    club_role: clubRole,
    key_number: keyNumber,
    email,
  });
  revalidatePath("/socios");
  revalidatePath("/usuarios");
  return { password };
}

export async function toggleMemberStatus(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const nextStatus = formData.get("next_status") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ status: nextStatus }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/socios");
}
