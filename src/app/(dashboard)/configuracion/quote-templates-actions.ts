"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_TEMPLATES = 3;
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB — igual que el límite del bucket, para fallar rápido sin gastar el intento de subida.
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

async function uploadLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  templateId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  if (file.size === 0) return {};
  if (file.size > MAX_LOGO_BYTES) return { error: "El logo pesa más de 2 MB. Comprímelo o usa un formato más ligero." };
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) return { error: "El logo debe ser PNG, JPG, WEBP o SVG." };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${ownerId}/${templateId}.${ext}`;

  const { error } = await supabase.storage.from("quote-logos").upload(path, file, { upsert: true });
  if (error) return { error: `No se pudo subir el logo: ${error.message}` };

  return { path };
}

export async function createQuoteTemplate(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  const { count } = await supabase
    .from("quote_templates")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  if ((count ?? 0) >= MAX_TEMPLATES) {
    return { error: `Como mucho puedes tener ${MAX_TEMPLATES} plantillas. Borra una para crear otra.` };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Ponle un nombre a la plantilla." };

  const { data: template, error } = await supabase
    .from("quote_templates")
    .insert({
      owner_id: user.id,
      name,
      primary_color: String(formData.get("primary_color") ?? "#4A5B33"),
      secondary_color: String(formData.get("secondary_color") ?? "#C1653F"),
      header_text: String(formData.get("header_text") ?? "").trim() || null,
      footer_text: String(formData.get("footer_text") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !template) return { error: "No se pudo crear la plantilla." };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const result = await uploadLogo(supabase, user.id, template.id, logo);
    if (result.error) return { error: result.error };
    if (result.path) await supabase.from("quote_templates").update({ logo_path: result.path }).eq("id", template.id);
  }

  revalidatePath("/configuracion");
  return {};
}

export async function updateQuoteTemplate(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Ponle un nombre a la plantilla." };

  await supabase
    .from("quote_templates")
    .update({
      name,
      primary_color: String(formData.get("primary_color") ?? "#4A5B33"),
      secondary_color: String(formData.get("secondary_color") ?? "#C1653F"),
      header_text: String(formData.get("header_text") ?? "").trim() || null,
      footer_text: String(formData.get("footer_text") ?? "").trim() || null,
    })
    .eq("id", id);

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const result = await uploadLogo(supabase, user.id, id, logo);
    if (result.error) return { error: result.error };
    if (result.path) await supabase.from("quote_templates").update({ logo_path: result.path }).eq("id", id);
  }

  revalidatePath("/configuracion");
  return {};
}

export async function deleteQuoteTemplate(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id"));

  const { data: template } = await supabase.from("quote_templates").select("logo_path").eq("id", id).maybeSingle();
  if (template?.logo_path) {
    await supabase.storage.from("quote-logos").remove([template.logo_path]);
  }

  await supabase.from("quote_templates").delete().eq("id", id);
  revalidatePath("/configuracion");
}
