"use client";

import { useState } from "react";
import { createReport } from "./actions";
import { METRICS, type MetricKey, type RawData } from "./aggregate";
import { colorAt } from "./colors";
import { ReportBuilderForm } from "./report-builder-form";

export function CreateReportForm({ raw }: { raw: RawData }) {
  const [advanced, setAdvanced] = useState(false);

  // Modo simple
  const [simpleName, setSimpleName] = useState("");
  const [simpleMetric, setSimpleMetric] = useState<MetricKey>(METRICS[0].key);
  const [simpleFrom, setSimpleFrom] = useState("");
  const [simpleTo, setSimpleTo] = useState("");

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
          Creación avanzada
        </label>
      </div>

      {!advanced && (
        <form action={createReport} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input type="hidden" name="chart_type" value="bar" />
          <input type="hidden" name="series" value={JSON.stringify([{ metric: simpleMetric, color: colorAt(0) }])} />
          <input
            name="name"
            value={simpleName}
            onChange={(e) => setSimpleName(e.target.value)}
            placeholder="Nombre del informe"
            required
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
          />
          <select
            value={simpleMetric}
            onChange={(e) => setSimpleMetric(e.target.value as MetricKey)}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            name="date_from"
            type="date"
            value={simpleFrom}
            onChange={(e) => setSimpleFrom(e.target.value)}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
          />
          <input
            name="date_to"
            type="date"
            value={simpleTo}
            onChange={(e) => setSimpleTo(e.target.value)}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
          />
          <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
            Crear
          </button>
        </form>
      )}

      {advanced && <ReportBuilderForm raw={raw} action={createReport} submitLabel="Crear informe" />}
    </div>
  );
}
