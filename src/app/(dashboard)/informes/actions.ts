"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseBlocks, validateBlocks } from "./blocks";

export async function createReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  const blocks = parseBlocks(formData.get("blocks"));
  if (!name || !blocks) return;

  const validation = validateBlocks(blocks);
  if (!validation.ok) return;

  const dateFrom = String(formData.get("date_from") ?? "").trim() || null;
  const dateTo = String(formData.get("date_to") ?? "").trim() || null;
  const isTemplate = formData.get("is_template") === "on";

  await supabase.from("reports").insert({
    owner_id: user.id,
    name,
    blocks: blocks.map((b) => ({ id: b.id, title: b.title, chart_type: b.chartType, series: b.series })),
    is_template: isTemplate,
    date_from: dateFrom,
    date_to: dateTo,
  });

  revalidatePath("/informes");
  revalidatePath("/");
}

export async function updateReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const blocks = parseBlocks(formData.get("blocks"));
  if (!id || !name || !blocks) return;

  const validation = validateBlocks(blocks);
  if (!validation.ok) return;

  const dateFrom = String(formData.get("date_from") ?? "").trim() || null;
  const dateTo = String(formData.get("date_to") ?? "").trim() || null;
  const isTemplate = formData.get("is_template") === "on";

  await supabase
    .from("reports")
    .update({
      name,
      blocks: blocks.map((b) => ({ id: b.id, title: b.title, chart_type: b.chartType, series: b.series })),
      is_template: isTemplate,
      date_from: dateFrom,
      date_to: dateTo,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/informes");
  revalidatePath("/");
}

export async function deleteReport(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("reports").delete().eq("id", id);
  revalidatePath("/informes");
  revalidatePath("/");
}

export async function setHomeReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim() || null;

  await supabase.from("reports").update({ is_home: false }).eq("owner_id", user.id).eq("is_home", true);
  if (id) {
    await supabase.from("reports").update({ is_home: true }).eq("id", id).eq("owner_id", user.id);
  }

  revalidatePath("/informes");
  revalidatePath("/");
}
