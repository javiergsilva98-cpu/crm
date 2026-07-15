import { METRICS, metricInfo, type SeriesInput } from "./aggregate";
import { validateSeries, type ChartType } from "./validate";

export type ReportBlock = {
  id: string;
  title: string | null;
  chartType: ChartType;
  series: SeriesInput[];
};

const CHART_TYPES = ["bar", "line", "pie", "table", "kpi_card"] as const;

function isChartType(value: unknown): value is ChartType {
  return typeof value === "string" && (CHART_TYPES as readonly string[]).includes(value);
}

function isSeriesInput(value: unknown): value is SeriesInput {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.metric === "string" &&
    METRICS.some((m) => m.key === s.metric) &&
    typeof s.color === "string" &&
    (s.compare === undefined || typeof s.compare === "boolean")
  );
}

// Acepta tanto el formato guardado en BD (snake_case) como el que sale del
// formulario (camelCase), para no depender de cuál se use en cada sitio.
export function normalizeBlocks(parsed: unknown): ReportBlock[] | null {
  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  const blocks: ReportBlock[] = [];
  for (const b of parsed) {
    if (!b || typeof b !== "object") return null;
    const chartType = (b as Record<string, unknown>).chartType ?? (b as Record<string, unknown>).chart_type;
    const series = (b as Record<string, unknown>).series;
    if (!isChartType(chartType) || !Array.isArray(series) || !series.every(isSeriesInput)) return null;
    const title = (b as Record<string, unknown>).title;
    blocks.push({
      id: typeof (b as Record<string, unknown>).id === "string" ? ((b as Record<string, unknown>).id as string) : crypto.randomUUID(),
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      chartType,
      series: series as SeriesInput[],
    });
  }
  return blocks;
}

export function parseBlocks(raw: FormDataEntryValue | null): ReportBlock[] | null {
  try {
    return normalizeBlocks(JSON.parse(String(raw ?? "[]")));
  } catch {
    return null;
  }
}

// Para bloques ya leídos de BD (jsonb, sin metadata inválida guardada), da
// una lista vacía en vez de null si el formato no se reconoce.
export function blocksFromDb(raw: unknown): ReportBlock[] {
  return normalizeBlocks(raw) ?? [];
}

export function validateBlocks(blocks: ReportBlock[]): { ok: true } | { ok: false; message: string } {
  if (blocks.length === 0) {
    return { ok: false, message: "Añade al menos una gráfica." };
  }
  for (const block of blocks) {
    const result = validateSeries(block.chartType, block.series);
    if (!result.ok) {
      return { ok: false, message: block.title ? `"${block.title}": ${result.message}` : result.message };
    }
  }
  return { ok: true };
}

// Filtra bloques/métricas guardados que referencien una métrica que ya no
// existe, para no romper el render de informes antiguos.
export function sanitizeBlocks(blocks: ReportBlock[] | null | undefined): ReportBlock[] {
  return (blocks ?? [])
    .map((b) => ({ ...b, series: b.series.filter((s) => metricInfo(s.metric)) }))
    .filter((b) => b.series.length > 0);
}
