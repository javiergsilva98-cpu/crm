"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIFECYCLE_STAGES, LEAD_STATUSES } from "@/lib/contact-lifecycle";
import { CHANNELS } from "@/lib/channels";
import { COMPANY_TYPES } from "@/lib/company-fields";

function parseLifecycleStage(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return (LIFECYCLE_STAGES as readonly string[]).includes(v) ? v : null;
}

function parseLeadStatus(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return (LEAD_STATUSES as readonly string[]).includes(v) ? v : null;
}

function parseSource(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return (CHANNELS as readonly string[]).includes(v) ? v : null;
}

function parseCompanyType(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return (COMPANY_TYPES as readonly string[]).includes(v) ? v : null;
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
    fuente_registro: "manual",
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
      direccion: String(formData.get("address") ?? "").trim() || null,
      direccion_2: String(formData.get("address2") ?? "").trim() || null,
      ciudad: String(formData.get("city") ?? "").trim() || null,
      estado_region: String(formData.get("state") ?? "").trim() || null,
      codigo_postal: String(formData.get("zip") ?? "").trim() || null,
      pais_region: String(formData.get("country") ?? "").trim() || null,
      descripcion: String(formData.get("description") ?? "").trim() || null,
      industria: String(formData.get("company_industry_text") ?? "").trim() || null,
      ingresos_anuales: Number(formData.get("annual_revenue") ?? "") || null,
      numero_empleados: Number(formData.get("num_employees") ?? "") || null,
      pagina_empresa_linkedin: String(formData.get("linkedin_page") ?? "").trim() || null,
      tipo: parseCompanyType(formData.get("company_type")),
      estado_oportunidad_venta: parseLeadStatus(formData.get("lead_status")),
      fuente_trafico_original: parseSource(formData.get("source")),
      ultima_fuente_trafico: parseSource(formData.get("latest_source")),
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
