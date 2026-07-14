"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { METRICS } from "./metrics";

export async function createReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  const metric = String(formData.get("metric") ?? "");
  if (!name || !METRICS.some((m) => m.key === metric)) return;

  const dateFrom = String(formData.get("date_from") ?? "").trim() || null;
  const dateTo = String(formData.get("date_to") ?? "").trim() || null;

  await supabase.from("reports").insert({
    owner_id: user.id,
    name,
    metric,
    date_from: dateFrom,
    date_to: dateTo,
  });

  revalidatePath("/informes");
}

export async function deleteReport(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("reports").delete().eq("id", id);
  revalidatePath("/informes");
}
