"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createOpportunity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida. Vuelve a iniciar sesión." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "El título es obligatorio." };

  const companyId = String(formData.get("company_id") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);

  const { error } = await supabase.from("opportunities").insert({
    owner_id: user.id,
    nombre_negocio: title,
    empresa_asociada_principal: companyId || null,
    cantidad: Number.isFinite(amount) ? amount : 0,
    etapa_negocio: "nuevo",
  });

  if (error) return { error: "No se pudo guardar la oportunidad. Inténtalo de nuevo." };

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
      nombre_negocio: title,
      empresa_asociada_principal: companyId || null,
      cantidad: Number.isFinite(amount) ? amount : 0,
    })
    .eq("id", id);

  revalidatePath("/oportunidades");
}

export async function updateStage(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const stage = String(formData.get("stage"));
  await supabase.from("opportunities").update({ etapa_negocio: stage }).eq("id", id);
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
  await supabase.from("opportunities").update({ etapa_negocio: stage }).in("id", ids);
  revalidatePath("/oportunidades");
}

export async function bulkUpdateOpportunitiesCompany(ids: string[], companyId: string | null) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("opportunities").update({ empresa_asociada_principal: companyId }).in("id", ids);
  revalidatePath("/oportunidades");
}
