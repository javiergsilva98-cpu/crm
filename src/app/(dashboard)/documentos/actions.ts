"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function createDocument(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const docType = formData.get("doc_type") as string;
  const referenceUrl = (formData.get("reference_url") as string)?.trim();
  const folder = formData.get("folder") === "privado" ? "privado" : "general";

  if (!name || !docType) {
    return { error: "Indica al menos el nombre y el tipo de documento." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    name,
    doc_type: docType,
    reference_url: referenceUrl ? normalizeUrl(referenceUrl) : null,
    folder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/documentos");
}

export async function updateDocument(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const docType = formData.get("doc_type") as string;
  const referenceUrl = (formData.get("reference_url") as string)?.trim();
  const folder = formData.get("folder") === "privado" ? "privado" : "general";

  if (!id || !name || !docType) {
    return { error: "Indica al menos el nombre y el tipo de documento." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ name, doc_type: docType, reference_url: referenceUrl ? normalizeUrl(referenceUrl) : null, folder })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/documentos");
}

export async function deleteDocument(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/documentos");
}
