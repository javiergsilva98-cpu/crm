"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

async function callRpc(name: string, args?: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(name, args);
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
