"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addActivity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const companyId = String(formData.get("company_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await supabase.from("activities").insert({
    owner_id: user.id,
    company_id: companyId,
    body,
  });

  revalidatePath(`/empresas/${companyId}`);
}

export async function deleteActivity(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const companyId = String(formData.get("company_id"));
  await supabase.from("activities").delete().eq("id", id);
  revalidatePath(`/empresas/${companyId}`);
}

export async function addTagToCompany(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const companyId = String(formData.get("company_id"));
  const name = String(formData.get("tag_name") ?? "").trim();
  if (!name) return;

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("owner_id", user.id)
    .eq("name", name)
    .maybeSingle();

  let tagId = existing?.id;
  if (!tagId) {
    const { data: created } = await supabase
      .from("tags")
      .insert({ owner_id: user.id, name })
      .select("id")
      .single();
    tagId = created?.id;
  }

  if (tagId) {
    await supabase.from("taggables").insert({ tag_id: tagId, company_id: companyId });
  }

  revalidatePath(`/empresas/${companyId}`);
}

export async function removeTagFromCompany(formData: FormData) {
  const supabase = await createClient();
  const tagId = String(formData.get("tag_id"));
  const companyId = String(formData.get("company_id"));
  await supabase.from("taggables").delete().eq("tag_id", tagId).eq("company_id", companyId);
  revalidatePath(`/empresas/${companyId}`);
}
