import type { MetricRow } from "./metrics";

function formatAmount(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function ReportChart({ rows, kind }: { rows: MetricRow[]; kind: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-mute">No hay datos todavía para este informe.</p>;
  }

  const primary = kind === "count" ? "count" : "amount";
  const max = Math.max(...rows.map((r) => Number(r[primary] ?? 0)), 1);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => {
        const value = Number(row[primary] ?? 0);
        const width = Math.max((value / max) * 100, 2);
        return (
          <div key={row.label} className="flex items-center gap-3 text-sm">
            <span className="w-36 shrink-0 truncate text-ink-soft">{row.label}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-sunken">
              <div className="h-full rounded bg-calm" style={{ width: `${width}%` }} />
            </div>
            <span className="w-28 shrink-0 text-right text-ink">
              {primary === "amount" ? formatAmount(value) : value}
              {kind === "count_amount" && row.count !== undefined && (
                <span className="ml-1 text-xs text-ink-mute">({row.count})</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
