"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function createMember(formData: FormData): Promise<ActionResult> {
  const fullName = (formData.get("full_name") as string)?.trim();
  const clubRole = formData.get("club_role") as string;
  const keyNumber = (formData.get("key_number") as string) || null;

  if (!fullName || !clubRole) {
    return { error: "Indica al menos el nombre y el rol." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    full_name: fullName,
    club_role: clubRole,
    key_number: keyNumber,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/socios");
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
