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
  revalidatePath("/usuarios");
}
