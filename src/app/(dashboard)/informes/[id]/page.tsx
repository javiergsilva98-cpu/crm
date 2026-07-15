import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeSeries, metricInfo, type MetricKey } from "../aggregate";
import { fetchRawData } from "../raw-data";
import { ReportView } from "../report-view";
import { PrintButton } from "./print-button";
import type { ChartType } from "../validate";

type SeriesRow = { metric: MetricKey; color: string; compare?: boolean };

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: report }, raw] = await Promise.all([
    supabase
      .from("reports")
      .select("id, name, chart_type, series, date_from, date_to")
      .eq("id", id)
      .maybeSingle(),
    fetchRawData(supabase),
  ]);

  if (!report) notFound();

  const series = ((report.series as SeriesRow[] | null) ?? []).filter((s) => metricInfo(s.metric));
  const computed = computeSeries(raw, series, report.date_from, report.date_to);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">{report.name}</h1>
          {(report.date_from || report.date_to) && (
            <p className="text-sm text-ink-mute">
              {report.date_from ?? "inicio"} → {report.date_to ?? "hoy"}
            </p>
          )}
        </div>
        <PrintButton />
      </div>
      <div className="rounded-lg border border-border bg-raised p-5">
        <ReportView chartType={report.chart_type as ChartType} series={computed} />
      </div>
    </div>
  );
}
