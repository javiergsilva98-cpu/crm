"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDemoMemberIdCookie } from "@/lib/demo-context";

type ActionResult = { error?: string } | void;

export async function createEvent(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const eventDate = formData.get("event_date") as string;
  const endDate = (formData.get("end_date") as string) || null;
  const opensMemberId = (formData.get("opens_member_id") as string) || null;
  const closesMemberId = (formData.get("closes_member_id") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!name || !eventDate) {
    return { error: "Indica al menos el nombre y la fecha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    name,
    event_date: eventDate,
    end_date: endDate,
    opens_member_id: opensMemberId,
    closes_member_id: closesMemberId,
    notes,
    kind: "evento",
    status: "confirmado",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/calendario");
}

export async function requestReservation(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const eventDate = formData.get("event_date") as string;
  const endDate = (formData.get("end_date") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const memberId = (formData.get("member_id") as string) || (await getDemoMemberIdCookie());

  if (!name || !eventDate) {
    return { error: "Indica al menos el motivo y la fecha." };
  }
  if (!memberId) {
    return { error: "No se pudo identificar al socio que solicita la reserva." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    name,
    event_date: eventDate,
    end_date: endDate,
    notes,
    kind: "reserva",
    status: "pendiente",
    requested_by_member_id: memberId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/calendario");
}

export async function approveReservation(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const opensMemberId = (formData.get("opens_member_id") as string) || null;
  const closesMemberId = (formData.get("closes_member_id") as string) || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "confirmado", opens_member_id: opensMemberId, closes_member_id: closesMemberId })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/calendario");
}

export async function rejectReservation(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ status: "rechazado" }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/calendario");
}
