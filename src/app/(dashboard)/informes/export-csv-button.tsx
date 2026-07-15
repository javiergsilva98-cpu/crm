"use client";

import type { ComputedSeries } from "./aggregate";
import { seriesToCsv } from "./export-csv";

export function ExportCsvButton({ series, filename }: { series: ComputedSeries[]; filename: string }) {
  function handleClick() {
    const csv = seriesToCsv(series);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "informe"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={handleClick} className="text-sm text-ink-soft hover:underline">
      Exportar CSV
    </button>
  );
}
