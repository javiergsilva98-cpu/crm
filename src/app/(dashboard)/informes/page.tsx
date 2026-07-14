import { createClient } from "@/lib/supabase/server";
import { deleteReport, setHomeReport } from "./actions";
import { aggregateMetric, metricInfo, type MetricKey } from "./aggregate";
import { fetchRawData } from "./raw-data";
import { ReportView, type ComputedSeries } from "./report-view";
import { CreateReportForm } from "./create-report-form";
import { AddDisclosure } from "@/components/add-disclosure";
import type { ChartType } from "./validate";

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

          return (
            <div key={report.id} className="rounded-lg border border-border bg-raised p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-lg font-semibold text-ink">
                    {report.name}
                    {report.is_home && <span className="ml-2 rounded-full bg-sunken px-2 py-0.5 text-xs font-normal text-ink-soft">Inicio</span>}
                  </h2>
                  <p className="text-xs text-ink-mute">
                    {computed.map((c) => c.label).join(" + ")}
                    {(report.date_from || report.date_to) &&
                      ` · ${report.date_from ?? "inicio"} → ${report.date_to ?? "hoy"}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <form action={setHomeReport}>
                    <input type="hidden" name="id" value={report.is_home ? "" : report.id} />
                    <button type="submit" className="text-sm text-ink-soft hover:underline">
                      {report.is_home ? "Quitar de inicio" : "Usar como inicio"}
                    </button>
                  </form>
                  <form action={deleteReport}>
                    <input type="hidden" name="id" value={report.id} />
                    <button type="submit" className="text-sm text-danger hover:underline">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
              <ReportView chartType={report.chart_type as ChartType} series={computed} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
