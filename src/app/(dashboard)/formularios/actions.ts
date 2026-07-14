"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormField } from "./types";

export async function createForm(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const defaultFields: FormField[] = [
    { id: randomUUID(), type: "full_name", key: "full_name", label: "Nombre completo", required: true },
    { id: randomUUID(), type: "email", key: "email", label: "Email", required: false },
  ];

  const { data: form } = await supabase
    .from("forms")
    .insert({ owner_id: user.id, name, fields: defaultFields })
    .select("id")
    .single();

  revalidatePath("/formularios");
  if (form) redirect(`/formularios/${form.id}`);
}

export async function updateForm(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  let fields: FormField[] = [];
  try {
    fields = JSON.parse(String(formData.get("fields") ?? "[]"));
  } catch {
    return;
  }

  await supabase
    .from("forms")
    .update({
      name,
      fields,
      meta_pixel_id: String(formData.get("meta_pixel_id") ?? "").trim() || null,
      google_ads_conversion_id: String(formData.get("google_ads_conversion_id") ?? "").trim() || null,
      google_ads_conversion_label: String(formData.get("google_ads_conversion_label") ?? "").trim() || null,
    })
    .eq("id", id);

  revalidatePath(`/formularios/${id}`);
  revalidatePath("/formularios");
}

export async function deleteForm(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("forms").delete().eq("id", id);
  revalidatePath("/formularios");
}
