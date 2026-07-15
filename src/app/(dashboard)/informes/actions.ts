"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { METRICS, type SeriesInput } from "./aggregate";
import { validateSeries, type ChartType } from "./validate";

function parseChartType(value: FormDataEntryValue | null): ChartType | null {
  const v = String(value ?? "");
  return (["bar", "line", "pie", "table", "kpi_card"] as const).includes(v as ChartType) ? (v as ChartType) : null;
}

function parseSeries(raw: FormDataEntryValue | null): SeriesInput[] | null {
  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.every(
      (s) =>
        s &&
        typeof s.metric === "string" &&
        METRICS.some((m) => m.key === s.metric) &&
        typeof s.color === "string" &&
        (s.compare === undefined || typeof s.compare === "boolean"),
    );
    return valid ? parsed : null;
  } catch {
    return null;
  }
}

export async function createReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  const chartType = parseChartType(formData.get("chart_type"));
  const series = parseSeries(formData.get("series"));
  if (!name || !chartType || !series) return;

  const validation = validateSeries(chartType, series);
  if (!validation.ok) return;

  const dateFrom = String(formData.get("date_from") ?? "").trim() || null;
  const dateTo = String(formData.get("date_to") ?? "").trim() || null;
  const isTemplate = formData.get("is_template") === "on";

  await supabase.from("reports").insert({
    owner_id: user.id,
    name,
    metric: series[0]?.metric ?? null,
    series,
    chart_type: chartType,
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
  const chartType = parseChartType(formData.get("chart_type"));
  const series = parseSeries(formData.get("series"));
  if (!id || !name || !chartType || !series) return;

  const validation = validateSeries(chartType, series);
  if (!validation.ok) return;

  const dateFrom = String(formData.get("date_from") ?? "").trim() || null;
  const dateTo = String(formData.get("date_to") ?? "").trim() || null;
  const isTemplate = formData.get("is_template") === "on";

  await supabase
    .from("reports")
    .update({
      name,
      metric: series[0]?.metric ?? null,
      series,
      chart_type: chartType,
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
