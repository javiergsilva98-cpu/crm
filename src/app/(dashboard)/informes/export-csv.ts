import type { ComputedSeries } from "./aggregate";

function primaryField(kind: ComputedSeries["kind"]): "count" | "amount" {
  return kind === "count" ? "count" : "amount";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function seriesToCsv(series: ComputedSeries[]): string {
  const labelsBySortKey = new Map<string, string>();
  for (const s of series) {
    for (const row of s.rows) labelsBySortKey.set(row.sortKey, row.label);
  }
  const sortKeys = Array.from(labelsBySortKey.keys()).sort();

  const header = [
    "",
    ...series.flatMap((s) => (s.previousRows ? [s.label, `${s.label} (anterior)`] : [s.label])),
  ];
  const lines = [header];

  for (const key of sortKeys) {
    const line = [labelsBySortKey.get(key) ?? key];
    for (const s of series) {
      const field = primaryField(s.kind);
      const row = s.rows.find((r) => r.sortKey === key);
      line.push(row ? String(row[field] ?? "") : "");
      if (s.previousRows) {
        const prevRow = s.previousRows.find((r) => r.sortKey === key);
        line.push(prevRow ? String(prevRow[field] ?? "") : "");
      }
    }
    lines.push(line);
  }

  return lines.map((line) => line.map(csvCell).join(",")).join("\n");
}
