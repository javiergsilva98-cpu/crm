"use client";

import { useMemo, useState } from "react";
import { computeSeries, METRICS, type MetricKey, type RawData } from "./aggregate";
import { validateSeries, type ChartType } from "./validate";
import { ReportView } from "./report-view";
import { colorAt, PALETTE } from "./colors";

export type SeriesRow = { id: string; metric: MetricKey; color: string; compare: boolean };

export type ReportBuilderInitial = {
  id?: string;
  name: string;
  chartType: ChartType;
  series: { metric: MetricKey; color: string; compare?: boolean }[];
  dateFrom: string;
  dateTo: string;
  isTemplate: boolean;
};

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Barras",
  line: "Líneas",
  pie: "Circular",
  table: "Tabla de datos",
  kpi_card: "Tarjeta con un dato",
};

function ColorSwatchPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          title={color}
          aria-label={`Usar color ${color}`}
          className="h-6 w-6 shrink-0 rounded-full border-2 transition-transform hover:scale-110"
          style={{ background: color, borderColor: value === color ? "var(--color-ink)" : "transparent" }}
        />
      ))}
    </div>
  );
}

export function ReportBuilderForm({
  raw,
  action,
  submitLabel,
  initial,
  onCancel,
}: {
  raw: RawData;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initial?: ReportBuilderInitial;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [chartType, setChartType] = useState<ChartType>(initial?.chartType ?? "bar");
  const [rows, setRows] = useState<SeriesRow[]>(
    initial && initial.series.length > 0
      ? initial.series.map((s) => ({ id: crypto.randomUUID(), metric: s.metric, color: s.color, compare: s.compare ?? false }))
      : [{ id: crypto.randomUUID(), metric: METRICS[0].key, color: colorAt(0), compare: false }],
  );
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initial?.dateTo ?? "");
  const [isTemplate, setIsTemplate] = useState(initial?.isTemplate ?? false);

  const canCompare = (chartType === "table" || chartType === "kpi_card") && Boolean(dateFrom) && Boolean(dateTo);

  function addRow() {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), metric: METRICS[0].key, color: colorAt(prev.length), compare: false }]);
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

  const computedSeries = useMemo(() => {
    if (!validation.ok) return [];
    return computeSeries(
      raw,
      rows.map((r) => ({ metric: r.metric, color: r.color, compare: canCompare && r.compare })),
      dateFrom || null,
      dateTo || null,
    );
  }, [validation.ok, rows, raw, dateFrom, dateTo, canCompare]);

  return (
    <form action={action} className="flex flex-col gap-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="chart_type" value={chartType} />
      <input
        type="hidden"
        name="series"
        value={JSON.stringify(rows.map((r) => ({ metric: r.metric, color: r.color, compare: canCompare && r.compare })))}
      />
      {isTemplate && <input type="hidden" name="is_template" value="on" />}

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

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={isTemplate} onChange={(e) => setIsTemplate(e.target.checked)} />
        Guardar como plantilla para el equipo (cualquier usuario podrá verlo, solo tú puedes editarlo o borrarlo)
      </label>

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
                <ColorSwatchPicker value={row.color} onChange={(color) => updateRow(row.id, { color })} />
              )}
              {canCompare && (
                <label className="flex items-center gap-1 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={row.compare}
                    onChange={(e) => updateRow(row.id, { compare: e.target.checked })}
                  />
                  Comparar con periodo anterior
                </label>
              )}
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(row.id)} className="text-sm text-danger hover:underline">
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
        {(chartType === "table" || chartType === "kpi_card") && !canCompare && (
          <p className="mt-2 text-xs text-ink-mute">Elige un rango de fechas para poder comparar con el periodo anterior.</p>
        )}
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
            <ReportView chartType={chartType} series={computedSeries} />
          ) : (
            <p className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{validation.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!validation.ok}
          className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-ink-soft hover:underline">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
