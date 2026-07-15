"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getOpportunityDetail(id: string) {
  const supabase = await createClient();
  const [{ data: opportunity }, { data: activities }] = await Promise.all([
    supabase
      .from("opportunities")
      .select(
        "id, title, stage, amount, notes, created_at, stage_entered_at, updated_at, company_id, contact_id, companies!company_id(name), contacts!contact_id(full_name)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("activities")
      .select("id, body, created_at")
      .eq("opportunity_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    opportunity: opportunity
      ? {
          ...opportunity,
          companies: (opportunity.companies as unknown as { name: string } | null) ?? null,
          contacts: (opportunity.contacts as unknown as { full_name: string } | null) ?? null,
        }
      : null,
    activities: activities ?? [],
  };
}

export async function updateOpportunityNotes(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const notes = String(formData.get("notes") ?? "").trim();
  await supabase.from("opportunities").update({ notes: notes || null }).eq("id", id);
  revalidatePath("/oportunidades/pipeline");
}

export async function addOpportunityActivity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida. Vuelve a iniciar sesión." };

  const opportunityId = String(formData.get("opportunity_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Escribe algo antes de guardar la nota." };

  const { error } = await supabase.from("activities").insert({
    owner_id: user.id,
    opportunity_id: opportunityId,
    body,
  });

  if (error) return { error: "No se pudo guardar la nota. Inténtalo de nuevo." };

  revalidatePath("/oportunidades/pipeline");
}

export async function deleteOpportunityActivity(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("activities").delete().eq("id", id);
  revalidatePath("/oportunidades/pipeline");
}
