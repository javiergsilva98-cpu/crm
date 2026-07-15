"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createOpportunity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const companyId = String(formData.get("company_id") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);

  await supabase.from("opportunities").insert({
    owner_id: user.id,
    title,
    company_id: companyId || null,
    amount: Number.isFinite(amount) ? amount : 0,
    stage: "nuevo",
  });

  revalidatePath("/oportunidades");
}

export async function updateOpportunity(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const companyId = String(formData.get("company_id") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);

  await supabase
    .from("opportunities")
    .update({
      title,
      company_id: companyId || null,
      amount: Number.isFinite(amount) ? amount : 0,
    })
    .eq("id", id);

  revalidatePath("/oportunidades");
}

export async function updateStage(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const stage = String(formData.get("stage"));
  await supabase.from("opportunities").update({ stage }).eq("id", id);
  revalidatePath("/oportunidades");
}

export async function deleteOpportunity(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("opportunities").delete().eq("id", id);
  revalidatePath("/oportunidades");
}

export async function bulkDeleteOpportunities(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("opportunities").delete().in("id", ids);
  revalidatePath("/oportunidades");
}

export async function bulkUpdateOpportunitiesStage(ids: string[], stage: string) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("opportunities").update({ stage }).in("id", ids);
  revalidatePath("/oportunidades");
}

export async function bulkUpdateOpportunitiesCompany(ids: string[], companyId: string | null) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("opportunities").update({ company_id: companyId }).in("id", ids);
  revalidatePath("/oportunidades");
}
