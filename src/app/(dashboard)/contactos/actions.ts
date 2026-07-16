"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findCompanyByEmailDomain } from "@/lib/match-company";
import { CHANNELS } from "@/lib/channels";
import { LIFECYCLE_STAGES, LEAD_STATUSES, LEGAL_BASES } from "@/lib/contact-lifecycle";

function parseSource(value: FormDataEntryValue | null): string | null {
  const source = String(value ?? "").trim();
  return (CHANNELS as readonly string[]).includes(source) ? source : null;
}

function parseLifecycleStage(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return (LIFECYCLE_STAGES as readonly string[]).includes(v) ? v : null;
}

function parseLeadStatus(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return (LEAD_STATUSES as readonly string[]).includes(v) ? v : null;
}

function parseLegalBasis(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return (LEGAL_BASES as readonly string[]).includes(v) ? v : null;
}

export async function createContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida. Vuelve a iniciar sesión." };

  const firstName = String(formData.get("first_name") ?? "").trim();
  if (!firstName) return { error: "El nombre es obligatorio." };
  const lastName = String(formData.get("last_name") ?? "").trim();

  const email = String(formData.get("email") ?? "").trim();
  let companyId = String(formData.get("company_id") ?? "").trim() || null;

  if (!companyId && email) {
    companyId = await findCompanyByEmailDomain(supabase, email);
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("owner_id", user.id)
    .ilike("full_name", fullName)
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("contacts").insert({
    owner_id: user.id,
    nombre: firstName,
    apellido: lastName || null,
    correo_electronico: email || null,
    numero_telefono: String(formData.get("phone") ?? "").trim() || null,
    phone_prefix: String(formData.get("phone_prefix") ?? "").trim() || null,
    phone_country: String(formData.get("phone_country") ?? "").trim() || null,
    empresa_principal_asociada: companyId,
    fuente_trafico_original: parseSource(formData.get("source")),
    fuente_registro: "manual",
    desglose_fuente_original_1: String(formData.get("source_detail") ?? "").trim() || null,
    source_url: String(formData.get("source_url") ?? "").trim() || null,
    tax_id: String(formData.get("tax_id") ?? "").trim() || null,
    fiscal_address: String(formData.get("fiscal_address") ?? "").trim() || null,
  });

  if (error) return { error: "No se pudo guardar el contacto. Inténtalo de nuevo." };

  revalidatePath("/contactos");

  if (existing) return { warning: `Ya existe un contacto llamado "${fullName}". Se ha creado igualmente — revisa si es un duplicado.` };
}

export async function updateContact(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const firstName = String(formData.get("first_name") ?? "").trim();
  if (!firstName) return;
  const lastName = String(formData.get("last_name") ?? "").trim();

  const email = String(formData.get("email") ?? "").trim();
  let companyId = String(formData.get("company_id") ?? "").trim() || null;

  if (!companyId && email) {
    companyId = await findCompanyByEmailDomain(supabase, email);
  }

  await supabase
    .from("contacts")
    .update({
      nombre: firstName,
      apellido: lastName || null,
      correo_electronico: email || null,
      numero_telefono: String(formData.get("phone") ?? "").trim() || null,
      numero_telefono_movil: String(formData.get("mobile_phone") ?? "").trim() || null,
      phone_prefix: String(formData.get("phone_prefix") ?? "").trim() || null,
      phone_country: String(formData.get("phone_country") ?? "").trim() || null,
      empresa_principal_asociada: companyId,
      nombre_empresa: String(formData.get("company_name") ?? "").trim() || null,
      fuente_trafico_original: parseSource(formData.get("source")),
      ultima_fuente_trafico: parseSource(formData.get("latest_source")),
      desglose_fuente_original_1: String(formData.get("source_detail") ?? "").trim() || null,
      desglose_fuente_original_2: String(formData.get("source_detail_2") ?? "").trim() || null,
      source_url: String(formData.get("source_url") ?? "").trim() || null,
      id_clic_google_ads_gclid: String(formData.get("gclid") ?? "").trim() || null,
      id_clic_facebook_fbclid: String(formData.get("fbclid") ?? "").trim() || null,
      etapa_ciclo_vida: parseLifecycleStage(formData.get("lifecycle_stage")),
      estado_lead: parseLeadStatus(formData.get("lead_status")),
      cancelacion_suscripcion_todos_correos: formData.get("email_optout") === "on",
      tax_id: String(formData.get("tax_id") ?? "").trim() || null,
      fiscal_address: String(formData.get("fiscal_address") ?? "").trim() || null,
      ciudad: String(formData.get("city") ?? "").trim() || null,
      estado_region: String(formData.get("state") ?? "").trim() || null,
      codigo_postal: String(formData.get("zip") ?? "").trim() || null,
      pais_region: String(formData.get("country") ?? "").trim() || null,
      direccion: String(formData.get("address") ?? "").trim() || null,
      cargo: String(formData.get("jobtitle") ?? "").trim() || null,
      industria: String(formData.get("contact_industry") ?? "").trim() || null,
      url_sitio_web: String(formData.get("contact_website") ?? "").trim() || null,
      url_linkedin: String(formData.get("linkedin_url") ?? "").trim() || null,
      mensaje: String(formData.get("message") ?? "").trim() || null,
      correos_electronicos_adicionales: String(formData.get("additional_emails") ?? "").trim() || null,
      base_juridica_tratamiento_datos: parseLegalBasis(formData.get("legal_basis")),
      fecha_siguiente_actividad: String(formData.get("next_activity_date") ?? "").trim() || null,
      direccion_correo_no_valida: formData.get("bad_email") === "on",
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

export async function bulkDeleteContacts(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("contacts").delete().in("id", ids);
  revalidatePath("/contactos");
}

export async function bulkUpdateContactsCompany(ids: string[], companyId: string | null) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("contacts").update({ empresa_principal_asociada: companyId }).in("id", ids);
  revalidatePath("/contactos");
}

export async function bulkUpdateContactsSource(ids: string[], source: string | null) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("contacts").update({ fuente_trafico_original: parseSource(source) }).in("id", ids);
  revalidatePath("/contactos");
}

type ImportRow = { first_name: string; last_name: string; email: string; phone: string; empresa: string; source: string };

function normalizeSource(value: string): string | null {
  const v = value.trim().toLowerCase();
  return (CHANNELS as readonly string[]).includes(v) ? v : null;
}

export async function importContacts(
  rows: ImportRow[],
): Promise<{ imported: number; skipped: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { imported: 0, skipped: rows.length };

  const { data: companies } = await supabase.from("companies").select("id, name:nombre_empresa, website:nombre_dominio_empresa");

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const firstName = row.first_name.trim();
    if (!firstName) {
      skipped++;
      continue;
    }

    const email = row.email.trim();
    let companyId: string | null = null;

    if (row.empresa.trim()) {
      const byName = companies?.find(
        (c) => c.name.toLowerCase() === row.empresa.trim().toLowerCase(),
      );
      companyId = byName?.id ?? null;
    }
    if (!companyId && email) {
      companyId = await findCompanyByEmailDomain(supabase, email);
    }

    const { error } = await supabase.from("contacts").insert({
      owner_id: user.id,
      nombre: firstName,
      apellido: row.last_name.trim() || null,
      correo_electronico: email || null,
      numero_telefono: row.phone.trim() || null,
      empresa_principal_asociada: companyId,
      fuente_trafico_original: normalizeSource(row.source),
      fuente_registro: "importacion",
    });

    if (error) {
      skipped++;
    } else {
      imported++;
    }
  }

  revalidatePath("/contactos");
  return { imported, skipped };
}
