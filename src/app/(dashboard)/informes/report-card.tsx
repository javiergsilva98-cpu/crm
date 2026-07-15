"use client";

import { useState } from "react";
import { deleteReport, setHomeReport, updateReport } from "./actions";
import { metricInfo, type MetricKey, type RawData } from "./aggregate";
import { ReportView, type ComputedSeries } from "./report-view";
import { ReportBuilderForm } from "./report-builder-form";
import type { ChartType } from "./validate";

type SeriesRow = { metric: MetricKey; color: string };

type Report = {
  id: string;
  name: string;
  chart_type: string;
  series: SeriesRow[] | null;
  date_from: string | null;
  date_to: string | null;
  compare_previous: boolean;
  is_home: boolean;
};

export function ReportCard({ report, computed, raw }: { report: Report; computed: ComputedSeries[]; raw: RawData }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-lg border border-border bg-raised p-5">
        <ReportBuilderForm
          raw={raw}
          action={async (formData) => {
            await updateReport(formData);
            setEditing(false);
          }}
          submitLabel="Guardar cambios"
          onCancel={() => setEditing(false)}
          initial={{
            id: report.id,
            name: report.name,
            chartType: report.chart_type as ChartType,
            series: (report.series ?? []).filter((s) => metricInfo(s.metric)),
            dateFrom: report.date_from ?? "",
            dateTo: report.date_to ?? "",
            comparePrevious: report.compare_previous,
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-raised p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">
            {report.name}
            {report.is_home && <span className="ml-2 rounded-full bg-sunken px-2 py-0.5 text-xs font-normal text-ink-soft">Inicio</span>}
          </h2>
          <p className="text-xs text-ink-mute">
            {computed.map((c) => c.label).join(" + ")}
            {(report.date_from || report.date_to) && ` · ${report.date_from ?? "inicio"} → ${report.date_to ?? "hoy"}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-sm text-ink-soft hover:underline">
            Editar
          </button>
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
}
