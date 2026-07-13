"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findCompanyByEmailDomain } from "@/lib/match-company";

export async function createContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return;

  const email = String(formData.get("email") ?? "").trim();
  let companyId = String(formData.get("company_id") ?? "").trim() || null;

  if (!companyId && email) {
    companyId = await findCompanyByEmailDomain(supabase, email);
  }

  await supabase.from("contacts").insert({
    owner_id: user.id,
    full_name: fullName,
    email: email || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    company_id: companyId,
  });

  revalidatePath("/contactos");
}

export async function updateContact(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return;

  const email = String(formData.get("email") ?? "").trim();
  let companyId = String(formData.get("company_id") ?? "").trim() || null;

  if (!companyId && email) {
    companyId = await findCompanyByEmailDomain(supabase, email);
  }

  await supabase
    .from("contacts")
    .update({
      full_name: fullName,
      email: email || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      company_id: companyId,
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
