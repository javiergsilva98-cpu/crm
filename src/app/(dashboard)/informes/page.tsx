import { createClient } from "@/lib/supabase/server";
import { createReport, deleteReport } from "./actions";
import { computeMetric, metricInfo, METRICS, type MetricKey } from "./metrics";
import { ReportChart } from "./report-chart";
import { AddDisclosure } from "@/components/add-disclosure";

export default async function InformesPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, name, metric, date_from, date_to, created_at")
    .order("created_at", { ascending: false });

  const reportsWithData = await Promise.all(
    (reports ?? []).map(async (report) => ({
      report,
      rows: await computeMetric(supabase, report.metric as MetricKey, report.date_from, report.date_to),
    })),
  );

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Informes</h1>
      <p className="mb-8 text-sm text-ink-mute">Crea y guarda informes con las métricas del CRM que más te interesan.</p>

      <AddDisclosure label="Crear informe">
        <form action={createReport} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            name="name"
            placeholder="Nombre del informe"
            required
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
          />
          <select name="metric" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            name="date_from"
            type="date"
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
          />
          <input
            name="date_to"
            type="date"
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
          />
          <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
            Crear
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-mute">
          Deja las fechas en blanco para incluir todo el histórico.
        </p>
      </AddDisclosure>

      {reportsWithData.length === 0 && (
        <div className="rounded-lg border border-border bg-raised p-6 text-center">
          <p className="font-heading text-base text-ink">Todavía no tienes informes</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">Crea el primero arriba eligiendo una métrica.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {reportsWithData.map(({ report, rows }) => {
          const info = metricInfo(report.metric);
          return (
            <div key={report.id} className="rounded-lg border border-border bg-raised p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-lg font-semibold text-ink">{report.name}</h2>
                  <p className="text-xs text-ink-mute">
                    {info?.label}
                    {(report.date_from || report.date_to) &&
                      ` · ${report.date_from ?? "inicio"} → ${report.date_to ?? "hoy"}`}
                  </p>
                </div>
                <form action={deleteReport}>
                  <input type="hidden" name="id" value={report.id} />
                  <button type="submit" className="text-sm text-danger hover:underline">
                    Eliminar
                  </button>
                </form>
              </div>
              <ReportChart rows={rows} kind={info?.kind ?? "count"} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
