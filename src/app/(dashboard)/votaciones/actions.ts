"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function createVote(formData: FormData): Promise<ActionResult> {
  const question = (formData.get("question") as string)?.trim();
  const description = (formData.get("description") as string) || null;
  const isAnonymous = formData.get("is_anonymous") === "on";
  const category = formData.get("category") === "express" ? "express" : "normal";
  const deadlineRaw = (formData.get("deadline") as string) || "";
  const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;
  const options = [1, 2, 3, 4, 5]
    .map((n) => (formData.get(`option_${n}`) as string)?.trim())
    .filter((v): v is string => Boolean(v));

  if (!question) {
    return { error: "Indica la pregunta de la votación." };
  }
  if (options.length < 2) {
    return { error: "Añade al menos dos opciones." };
  }
  if (deadlineRaw && Number.isNaN(new Date(deadlineRaw).getTime())) {
    return { error: "La fecha límite no es válida." };
  }

  const supabase = await createClient();
  const { data: vote, error } = await supabase
    .from("votes")
    .insert({ question, description, is_anonymous: isAnonymous, category, deadline })
    .select("id")
    .single();

  if (error || !vote) {
    return { error: error?.message ?? "No se pudo crear la votación." };
  }

  const { error: optionsError } = await supabase.from("vote_options").insert(
    options.map((label, idx) => ({ vote_id: vote.id, label, position: idx })),
  );

  if (optionsError) {
    return { error: optionsError.message };
  }

  revalidatePath("/votaciones");
}

export async function castVote(formData: FormData): Promise<ActionResult> {
  const voteId = formData.get("vote_id") as string;
  const optionId = formData.get("option_id") as string;
  const memberId = formData.get("member_id") as string;

  if (!optionId) {
    return { error: "Elige una opción antes de votar." };
  }
  if (!memberId) {
    return { error: "No se pudo identificar quién vota." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vote_casts")
    .insert({ vote_id: voteId, option_id: optionId, member_id: memberId });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/votaciones");
}

export async function closeExpiredVotes(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("close_expired_votes");
}

export async function closeVote(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("votes").update({ status: "cerrada" }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/votaciones");
}
