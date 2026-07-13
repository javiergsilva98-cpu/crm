"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/profile";

export async function updateUserRole(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  if (role !== "admin" && role !== "user") return;

  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/configuracion");
}

export async function createInvite(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const role = String(formData.get("role") ?? "user");
  if (role !== "admin" && role !== "user") return;

  await supabase.from("invites").insert({ role, created_by: user.id });
  revalidatePath("/configuracion");
}

export async function deleteInvite(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("invites").delete().eq("id", id);
  revalidatePath("/configuracion");
}
