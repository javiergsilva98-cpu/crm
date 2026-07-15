import { createClient } from "@/lib/supabase/server";
import { aggregateMetric, metricInfo, type MetricKey } from "./aggregate";
import { fetchRawData } from "./raw-data";
import type { ComputedSeries } from "./report-view";
import { CreateReportForm } from "./create-report-form";
import { ReportCard } from "./report-card";
import { AddDisclosure } from "@/components/add-disclosure";

type SeriesRow = { metric: MetricKey; color: string };

export default async function InformesPage() {
  const supabase = await createClient();
  const [{ data: reports }, raw] = await Promise.all([
    supabase
      .from("reports")
      .select("id, name, chart_type, series, date_from, date_to, compare_previous, is_home, created_at")
      .order("created_at", { ascending: false }),
    fetchRawData(supabase),
  ]);

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Informes</h1>
      <p className="mb-8 text-sm text-ink-mute">
        Crea y guarda informes con las métricas del CRM que más te interesan. Puedes marcar uno como la pantalla de inicio.
      </p>

      <AddDisclosure label="Crear informe">
        <CreateReportForm raw={raw} />
      </AddDisclosure>

      {(!reports || reports.length === 0) && (
        <div className="rounded-lg border border-border bg-raised p-6 text-center">
          <p className="font-heading text-base text-ink">Todavía no tienes informes</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">Crea el primero arriba eligiendo una métrica.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {(reports ?? []).map((report) => {
          const series = ((report.series as SeriesRow[] | null) ?? []).filter((s) => metricInfo(s.metric));
          const computed: ComputedSeries[] = series.map((s) => {
            const info = metricInfo(s.metric)!;
            return {
              metric: s.metric,
              label: info.label,
              kind: info.kind,
              color: s.color,
              rows: aggregateMetric(raw, s.metric, report.date_from, report.date_to),
            };
          });

          return <ReportCard key={report.id} report={report} computed={computed} raw={raw} />;
        })}
      </div>
    </div>
  );
}
