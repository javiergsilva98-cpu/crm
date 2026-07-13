"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return;

  const companyId = String(formData.get("company_id") ?? "").trim();

  await supabase.from("contacts").insert({
    owner_id: user.id,
    full_name: fullName,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    company_id: companyId || null,
  });

  revalidatePath("/contactos");
}

export async function updateContact(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return;

  const companyId = String(formData.get("company_id") ?? "").trim();

  await supabase
    .from("contacts")
    .update({
      full_name: fullName,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      company_id: companyId || null,
    })
    .eq("id", id);

  revalidatePath("/contactos");
}

export async function deleteContact(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("contacts").delete().eq("id", id);
  revalidatePath("/contactos");
}
