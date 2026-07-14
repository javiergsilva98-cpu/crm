"use client";

import { useMemo, useState } from "react";
import { createReport } from "./actions";
import { aggregateMetric, metricInfo, METRICS, previousPeriod, type MetricKey, type RawData } from "./aggregate";
import { validateSeries, type ChartType } from "./validate";
import { ReportView, type ComputedSeries } from "./report-view";
import { colorAt } from "./colors";

type SeriesRow = { id: string; metric: MetricKey; color: string };

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Barras",
  line: "Líneas",
  pie: "Circular",
  table: "Tabla de datos",
  kpi_card: "Tarjeta con un dato",
};

export function CreateReportForm({ raw }: { raw: RawData }) {
  const [advanced, setAdvanced] = useState(false);

  // Modo simple
  const [simpleName, setSimpleName] = useState("");
  const [simpleMetric, setSimpleMetric] = useState<MetricKey>(METRICS[0].key);
  const [simpleFrom, setSimpleFrom] = useState("");
  const [simpleTo, setSimpleTo] = useState("");

  // Modo avanzado
  const [name, setName] = useState("");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [rows, setRows] = useState<SeriesRow[]>([{ id: crypto.randomUUID(), metric: METRICS[0].key, color: colorAt(0) }]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [comparePrevious, setComparePrevious] = useState(false);

  function addRow() {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), metric: METRICS[0].key, color: colorAt(prev.length) }]);
  }

  function updateRow(id: string, patch: Partial<SeriesRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const validation = useMemo(
    () => validateSeries(chartType, rows.map((r) => ({ metric: r.metric, color: r.color }))),
    [chartType, rows],
  );

  const computedSeries: ComputedSeries[] = useMemo(() => {
    if (!validation.ok) return [];
    return rows.map((r) => {
      const info = metricInfo(r.metric)!;
      return {
        metric: r.metric,
        label: info.label,
        kind: info.kind,
        color: r.color,
        rows: aggregateMetric(raw, r.metric, dateFrom || null, dateTo || null),
      };
    });
  }, [validation.ok, rows, raw, dateFrom, dateTo]);

  const compare = useMemo(() => {
    if (chartType !== "kpi_card" || !comparePrevious || !dateFrom || !dateTo || computedSeries.length === 0) return null;
    const info = metricInfo(rows[0].metric)!;
    const field = info.kind === "count" ? "count" : "amount";
    const currentTotal = computedSeries[0].rows.reduce((sum, row) => sum + Number(row[field] ?? 0), 0);
    const { from, to } = previousPeriod(dateFrom, dateTo);
    const prevRows = aggregateMetric(raw, rows[0].metric, from, to);
    const previousTotal = prevRows.reduce((sum, row) => sum + Number(row[field] ?? 0), 0);
    return { currentTotal, previousTotal };
  }, [chartType, comparePrevious, dateFrom, dateTo, computedSeries, rows, raw]);

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
          <input
            type="hidden"
            name="series"
            value={JSON.stringify([{ metric: simpleMetric, color: colorAt(0) }])}
          />
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

      {advanced && (
        <form action={createReport} className="flex flex-col gap-4">
          <input type="hidden" name="chart_type" value={chartType} />
          <input type="hidden" name="series" value={JSON.stringify(rows.map((r) => ({ metric: r.metric, color: r.color })))} />
          {comparePrevious && <input type="hidden" name="compare_previous" value="on" />}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del informe"
              required
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto sm:flex-1"
            />
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
            >
              {Object.entries(CHART_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <input
              name="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
            />
            <input
              name="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
            />
          </div>

          {chartType === "kpi_card" && (
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={comparePrevious}
                onChange={(e) => setComparePrevious(e.target.checked)}
                disabled={!dateFrom || !dateTo}
              />
              Comparar con el periodo anterior de la misma duración
              {(!dateFrom || !dateTo) && <span className="text-xs text-ink-mute">(elige un rango de fechas)</span>}
            </label>
          )}

          <div className="rounded-lg border border-border bg-base p-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">Métricas</p>
            <div className="flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.metric}
                    onChange={(e) => updateRow(row.id, { metric: e.target.value as MetricKey })}
                    className="rounded-md border border-border px-2 py-1 text-sm"
                  >
                    {METRICS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {(chartType === "line" || chartType === "bar") && (
                    <input
                      type="color"
                      value={row.color}
                      onChange={(e) => updateRow(row.id, { color: e.target.value })}
                      className="h-8 w-10 rounded border border-border"
                      title="Color"
                    />
                  )}
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(row.id)} className="text-sm text-danger hover:underline">
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-2 rounded-md border border-border px-3 py-1 text-xs text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
            >
              + Añadir métrica
            </button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">Vista previa</p>
            <div className="rounded-lg border border-border bg-raised p-4">
              {validation.ok ? (
                <ReportView chartType={chartType} series={computedSeries} compare={compare} />
              ) : (
                <p className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{validation.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!validation.ok}
            className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Crear informe
          </button>
        </form>
      )}
    </div>
  );
}
