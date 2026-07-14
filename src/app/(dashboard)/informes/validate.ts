import { metricInfo, type MetricKey } from "./aggregate";

export type ChartType = "bar" | "line" | "pie" | "table" | "kpi_card";

export type SeriesInput = { metric: MetricKey; color: string };

export function validateSeries(
  chartType: ChartType,
  series: SeriesInput[],
): { ok: true } | { ok: false; message: string } {
  if (series.length === 0) {
    return { ok: false, message: "Añade al menos una métrica." };
  }

  const infos = series.map((s) => metricInfo(s.metric)).filter((i): i is NonNullable<typeof i> => i !== null);
  if (infos.length !== series.length) {
    return { ok: false, message: "Hay una métrica no reconocida en el informe." };
  }

  if (chartType === "kpi_card" || chartType === "pie" || chartType === "bar") {
    if (series.length > 1) {
      const kind = chartType === "kpi_card" ? "tarjeta" : chartType === "pie" ? "circular" : "de barras";
      return { ok: false, message: `Un gráfico ${kind} solo admite una métrica. Quita las demás o cambia el tipo de visualización.` };
    }
    return { ok: true };
  }

  if (chartType === "line") {
    const notMonthly = infos.find((i) => i.dimension !== "month");
    if (notMonthly) {
      return {
        ok: false,
        message: `"${notMonthly.label}" no es una métrica mensual y no se puede dibujar como línea junto a las demás.`,
      };
    }
    const firstKind = infos[0].kind;
    const mismatched = infos.find((i) => i.kind !== firstKind);
    if (mismatched) {
      return {
        ok: false,
        message: `No se pueden mezclar "${infos[0].label}" (${firstKind === "count" ? "conteo" : "importe"}) con "${mismatched.label}" (${mismatched.kind === "count" ? "conteo" : "importe"}) en el mismo gráfico de líneas.`,
      };
    }
    return { ok: true };
  }

  // table
  const firstDimension = infos[0].dimension;
  const mismatchedDimension = infos.find((i) => i.dimension !== firstDimension);
  if (mismatchedDimension) {
    return {
      ok: false,
      message: `No se pueden combinar en la misma tabla "${infos[0].label}" y "${mismatchedDimension.label}": agrupan los datos de forma distinta (una es mensual y la otra por categoría).`,
    };
  }
  return { ok: true };
}
