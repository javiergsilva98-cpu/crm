"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

const CATEGORIES = [
  "rotura",
  "falta_material",
  "convivencia",
  "consumicion_incorrecta",
  "producto",
  "fichaje",
  "otro",
] as const;

export async function reportIncidencia(formData: FormData): Promise<ActionResult> {
  const memberId = formData.get("member_id") as string;
  const categoria = formData.get("categoria") as string;
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const fecha = (formData.get("fecha_incidencia") as string) || undefined;
  const referenciaConsumicionId = (formData.get("referencia_consumicion_id") as string) || null;
  const referenciaProductoId = (formData.get("referencia_producto_id") as string) || null;
  const referenciaEventoId = (formData.get("referencia_evento_id") as string) || null;

  if (!memberId) {
    return { error: "No se pudo identificar quién reporta." };
  }
  if (!CATEGORIES.includes(categoria as (typeof CATEGORIES)[number])) {
    return { error: "Elige una categoría." };
  }
  if (!descripcion) {
    return { error: "Describe la incidencia." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("incidencias").insert({
    reportado_por_member_id: memberId,
    categoria,
    descripcion,
    fecha_incidencia: fecha || undefined,
    referencia_consumicion_id: referenciaConsumicionId,
    referencia_producto_id: referenciaProductoId,
    referencia_evento_id: referenciaEventoId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/incidencias");
}

export async function resolveIncidencia(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const estado = formData.get("estado") as string;
  const decision = (formData.get("decision") as string) || null;
  const notas = (formData.get("notas") as string) || null;

  if (!id || !estado) {
    return { error: "Falta información." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_incidencia", {
    p_incidencia_id: id,
    p_estado: estado,
    p_decision: decision,
    p_notas: notas,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/incidencias");
  revalidatePath("/consumos");
  revalidatePath("/tesoreria");
}
