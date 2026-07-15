"use client";

import { useMemo, useState } from "react";
import { computeSeries, METRICS, type MetricKey, type RawData, type SeriesInput } from "./aggregate";
import { validateSeries, type ChartType } from "./validate";
import { ReportView } from "./report-view";
import { colorAt, PALETTE } from "./colors";
import type { ReportBlock } from "./blocks";

type SeriesRow = { id: string; metric: MetricKey; color: string; compare: boolean };
type BlockState = { id: string; title: string; chartType: ChartType; rows: SeriesRow[] };

export type ReportBuilderInitial = {
  id?: string;
  name: string;
  blocks: ReportBlock[];
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

function newBlock(): BlockState {
  return {
    id: crypto.randomUUID(),
    title: "",
    chartType: "bar",
    rows: [{ id: crypto.randomUUID(), metric: METRICS[0].key, color: colorAt(0), compare: false }],
  };
}

function blockFromInitial(block: ReportBlock): BlockState {
  return {
    id: block.id,
    title: block.title ?? "",
    chartType: block.chartType,
    rows: block.series.map((s) => ({
      id: crypto.randomUUID(),
      metric: s.metric,
      color: s.color,
      compare: s.compare ?? false,
    })),
  };
}

function BlockEditor({
  block,
  index,
  canRemove,
  canCompare,
  raw,
  dateFrom,
  dateTo,
  onChange,
  onRemove,
}: {
  block: BlockState;
  index: number;
  canRemove: boolean;
  canCompare: boolean;
  raw: RawData;
  dateFrom: string;
  dateTo: string;
  onChange: (patch: Partial<BlockState>) => void;
  onRemove: () => void;
}) {
  function addRow() {
    onChange({ rows: [...block.rows, { id: crypto.randomUUID(), metric: METRICS[0].key, color: colorAt(block.rows.length), compare: false }] });
  }

  function updateRow(id: string, patch: Partial<SeriesRow>) {
    onChange({ rows: block.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }

  function removeRow(id: string) {
    onChange({ rows: block.rows.filter((r) => r.id !== id) });
  }

  const validation = useMemo(
    () => validateSeries(block.chartType, block.rows.map((r) => ({ metric: r.metric, color: r.color }))),
    [block.chartType, block.rows],
  );

  const computedSeries = useMemo(() => {
    if (!validation.ok) return [];
    return computeSeries(
      raw,
      block.rows.map((r) => ({ metric: r.metric, color: r.color, compare: canCompare && r.compare })),
      dateFrom || null,
      dateTo || null,
    );
  }, [validation.ok, block.rows, raw, dateFrom, dateTo, canCompare]);

  return (
    <div className="rounded-lg border border-border bg-base p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Gráfica {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-sm text-danger hover:underline">
            Quitar gráfica
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Título de la gráfica (opcional)"
          className="w-full rounded-md border border-border bg-raised px-3 py-2 text-sm text-ink sm:w-auto sm:flex-1"
        />
        <select
          value={block.chartType}
          onChange={(e) => onChange({ chartType: e.target.value as ChartType })}
          className="w-full rounded-md border border-border bg-raised px-3 py-2 text-sm text-ink sm:w-auto"
        >
          {Object.entries(CHART_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-border bg-raised p-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">Métricas</p>
        <div className="flex flex-col gap-2">
          {block.rows.map((row) => (
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
              {(block.chartType === "line" || block.chartType === "bar") && (
                <ColorSwatchPicker value={row.color} onChange={(color) => updateRow(row.id, { color })} />
              )}
              {canCompare && (block.chartType === "table" || block.chartType === "kpi_card") && (
                <label className="flex items-center gap-1 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={row.compare}
                    onChange={(e) => updateRow(row.id, { compare: e.target.checked })}
                  />
                  Comparar con periodo anterior
                </label>
              )}
              {block.rows.length > 1 && (
                <button type="button" onClick={() => removeRow(row.id)} className="text-sm text-danger hover:underline">
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
        {(block.chartType === "table" || block.chartType === "kpi_card") && !canCompare && (
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

      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">Vista previa</p>
        <div className="rounded-lg border border-border bg-raised p-4">
          {validation.ok ? (
            <ReportView chartType={block.chartType} series={computedSeries} />
          ) : (
            <p className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{validation.message}</p>
          )}
        </div>
      </div>
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
  const [blocks, setBlocks] = useState<BlockState[]>(
    initial && initial.blocks.length > 0 ? initial.blocks.map(blockFromInitial) : [newBlock()],
  );
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initial?.dateTo ?? "");
  const [isTemplate, setIsTemplate] = useState(initial?.isTemplate ?? false);

  const canCompare = Boolean(dateFrom) && Boolean(dateTo);

  function updateBlock(id: string, patch: Partial<BlockState>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function addBlock() {
    setBlocks((prev) => [...prev, newBlock()]);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  const serializedBlocks: ReportBlock[] = blocks.map((b) => ({
    id: b.id,
    title: b.title.trim() || null,
    chartType: b.chartType,
    series: b.rows.map((r) => ({
      metric: r.metric,
      color: r.color,
      compare: (b.chartType === "table" || b.chartType === "kpi_card") && canCompare && r.compare,
    })) as SeriesInput[],
  }));

  const allValid = blocks.every((b) => validateSeries(b.chartType, b.rows.map((r) => ({ metric: r.metric, color: r.color }))).ok);

  return (
    <form action={action} className="flex flex-col gap-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="blocks" value={JSON.stringify(serializedBlocks)} />
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

      <div className="flex flex-col gap-4">
        {blocks.map((block, i) => (
          <BlockEditor
            key={block.id}
            block={block}
            index={i}
            canRemove={blocks.length > 1}
            canCompare={canCompare}
            raw={raw}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={(patch) => updateBlock(block.id, patch)}
            onRemove={() => removeBlock(block.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addBlock}
        className="self-start rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
      >
        + Añadir gráfica
      </button>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!allValid}
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
