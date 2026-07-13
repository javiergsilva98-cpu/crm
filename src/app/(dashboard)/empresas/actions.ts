"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase.from("companies").insert({
    owner_id: user.id,
    name,
    website: String(formData.get("website") ?? "").trim() || null,
    industry: String(formData.get("industry") ?? "").trim() || null,
    tax_id: String(formData.get("tax_id") ?? "").trim() || null,
    fiscal_address: String(formData.get("fiscal_address") ?? "").trim() || null,
  });

  revalidatePath("/empresas");
}

export async function updateCompany(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase
    .from("companies")
    .update({
      name,
      website: String(formData.get("website") ?? "").trim() || null,
      industry: String(formData.get("industry") ?? "").trim() || null,
      tax_id: String(formData.get("tax_id") ?? "").trim() || null,
      fiscal_address: String(formData.get("fiscal_address") ?? "").trim() || null,
    })
    .eq("id", id);

  revalidatePath("/empresas");
}

export async function deleteCompany(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("companies").delete().eq("id", id);
  revalidatePath("/empresas");
}
