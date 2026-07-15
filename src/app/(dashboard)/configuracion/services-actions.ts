"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createService(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const unitPrice = Number(formData.get("unit_price") ?? 0);
  const taxRate = Number(formData.get("tax_rate") ?? 21);

  await supabase.from("services").insert({
    owner_id: user.id,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
    tax_rate: Number.isFinite(taxRate) ? taxRate : 21,
  });

  revalidatePath("/configuracion");
}

export async function updateService(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const unitPrice = Number(formData.get("unit_price") ?? 0);
  const taxRate = Number(formData.get("tax_rate") ?? 21);

  await supabase
    .from("services")
    .update({
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
      tax_rate: Number.isFinite(taxRate) ? taxRate : 21,
    })
    .eq("id", id);

  revalidatePath("/configuracion");
}

export async function deleteService(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/configuracion");
}
