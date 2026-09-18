"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function updateOwnProfile(formData: FormData): Promise<ActionResult> {
  const fullName = (formData.get("full_name") as string)?.trim();
  const avatarUrl = (formData.get("avatar_url") as string) || null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_member_profile", {
    p_full_name: fullName,
    p_avatar_url: avatarUrl,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/perfil");
  revalidatePath("/");
}
