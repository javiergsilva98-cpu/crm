"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIFECYCLE_STAGES } from "@/lib/contact-lifecycle";

function parseLifecycleStage(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return (LIFECYCLE_STAGES as readonly string[]).includes(v) ? v : null;
}

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida. Vuelve a iniciar sesión." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };

  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .ilike("nombre_empresa", name)
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("companies").insert({
    owner_id: user.id,
    nombre_empresa: name,
    nombre_dominio_empresa: String(formData.get("website") ?? "").trim() || null,
    industry: String(formData.get("industry") ?? "").trim() || null,
    numero_telefono: String(formData.get("phone") ?? "").trim() || null,
    etapa_ciclo_vida: parseLifecycleStage(formData.get("lifecycle_stage")),
    tax_id: String(formData.get("tax_id") ?? "").trim() || null,
    fiscal_address: String(formData.get("fiscal_address") ?? "").trim() || null,
  });

  if (error) return { error: "No se pudo guardar la empresa. Inténtalo de nuevo." };

  revalidatePath("/empresas");

  if (existing) return { warning: `Ya existe una empresa llamada "${name}". Se ha creado igualmente — revisa si es un duplicado.` };
}

export async function updateCompany(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase
    .from("companies")
    .update({
      nombre_empresa: name,
      nombre_dominio_empresa: String(formData.get("website") ?? "").trim() || null,
      industry: String(formData.get("industry") ?? "").trim() || null,
      numero_telefono: String(formData.get("phone") ?? "").trim() || null,
      etapa_ciclo_vida: parseLifecycleStage(formData.get("lifecycle_stage")),
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

export async function bulkDeleteCompanies(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("companies").delete().in("id", ids);
  revalidatePath("/empresas");
}

export async function bulkUpdateCompaniesIndustry(ids: string[], industry: string | null) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("companies").update({ industry }).in("id", ids);
  revalidatePath("/empresas");
}
