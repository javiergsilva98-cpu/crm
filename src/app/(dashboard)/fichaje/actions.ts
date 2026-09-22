"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDemoMemberIdCookie } from "@/lib/demo-context";

type ActionResult = { error?: string } | void;

// En la demo toda la app corre sobre una única cuenta compartida, así
// que current_member_id() (el socio real vinculado a la cuenta
// autenticada) no sirve para simular "soy tal socio" al fichar — a
// diferencia de Consumiciones/Tesorería, donde ya se usa esta misma
// cookie para elegir con qué socio se prueba cada pantalla. Se resuelve
// aquí y se manda como p_member_id a cada función; el propio RPC
// decide si se puede usar (ver 0027_fichaje_member_override.sql).
async function resolveDemoMemberId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const { data: members } = await supabase.from("members").select("id").eq("status", "activo").order("full_name");
  const list = members ?? [];
  if (list.length === 0) return null;
  const cookieId = await getDemoMemberIdCookie();
  return list.find((m) => m.id === cookieId)?.id ?? list[0].id;
}

async function callRpc(name: string, args?: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const memberId = await resolveDemoMemberId(supabase);
  const { error } = await supabase.rpc(name, { ...args, p_member_id: memberId });
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/fichaje");
  revalidatePath("/");
}

export async function openClub(): Promise<ActionResult> {
  return callRpc("club_open");
}

export async function closeClub(): Promise<ActionResult> {
  return callRpc("club_close");
}

export async function checkIn(): Promise<ActionResult> {
  return callRpc("club_checkin");
}

export async function checkOut(): Promise<ActionResult> {
  return callRpc("club_checkout");
}

export async function transferResponsibility(formData: FormData): Promise<ActionResult> {
  const toMemberId = formData.get("to_member_id") as string;
  if (!toMemberId) {
    return { error: "Elige a quién cedérsela." };
  }
  return callRpc("transfer_responsibility", { p_to_member_id: toMemberId });
}

export async function acceptResponsibility(formData: FormData): Promise<ActionResult> {
  const transferId = formData.get("transfer_id") as string;
  if (!transferId) return { error: "Falta la cesión." };
  return callRpc("accept_responsibility", { p_transfer_id: transferId });
}

export async function rejectResponsibility(formData: FormData): Promise<ActionResult> {
  const transferId = formData.get("transfer_id") as string;
  if (!transferId) return { error: "Falta la cesión." };
  return callRpc("reject_responsibility", { p_transfer_id: transferId });
}
