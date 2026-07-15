import { Fragment } from "react";
import type { ComputedSeries, MetricKind, MetricRow } from "./aggregate";

export type { ComputedSeries } from "./aggregate";

function formatAmount(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function formatValue(n: number, kind: MetricKind) {
  return kind === "count" ? String(n) : formatAmount(n);
}

function primaryField(kind: MetricKind): "count" | "amount" {
  return kind === "count" ? "count" : "amount";
}

function deltaPct(current: number, previous: number): number | null {
  if (previous !== 0) return ((current - previous) / previous) * 100;
  if (current > 0) return 100;
  return null;
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-ink-mute">—</span>;
  return (
    <span className={delta >= 0 ? "text-emerald-600" : "text-danger"}>
      {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))}%
    </span>
  );
}

export function ReportView({
  chartType,
  series,
}: {
  chartType: "bar" | "line" | "pie" | "table" | "kpi_card";
  series: ComputedSeries[];
}) {
  if (series.length === 0) return <p className="text-sm text-ink-mute">No hay métricas configuradas.</p>;

  if (chartType === "kpi_card") return <KpiCard series={series[0]} />;
  if (chartType === "pie") return <PieChart series={series[0]} />;
  if (chartType === "line") return <LineChart series={series} />;
  if (chartType === "table") return <TableView series={series} />;
  return <BarChart series={series[0]} />;
}

function BarChart({ series }: { series: ComputedSeries }) {
  const { rows, kind, color } = series;
  if (rows.length === 0) return <p className="text-sm text-ink-mute">No hay datos todavía para este informe.</p>;

  const field = primaryField(kind);
  const max = Math.max(...rows.map((r) => Number(r[field] ?? 0)), 1);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => {
        const value = Number(row[field] ?? 0);
        const width = Math.max((value / max) * 100, 2);
        return (
          <div key={row.sortKey} className="flex items-center gap-3 text-sm">
            <span className="w-36 shrink-0 truncate text-ink-soft">{row.label}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-sunken">
              <div className="h-full rounded" style={{ width: `${width}%`, background: color }} />
            </div>
            <span className="w-28 shrink-0 text-right text-ink">
              {formatValue(value, kind)}
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

function PieChart({ series }: { series: ComputedSeries }) {
  const { rows, kind } = series;
  if (rows.length === 0) return <p className="text-sm text-ink-mute">No hay datos todavía para este informe.</p>;

  const field = primaryField(kind);
  const total = rows.reduce((sum, r) => sum + Number(r[field] ?? 0), 0);
  if (total <= 0) return <p className="text-sm text-ink-mute">No hay datos todavía para este informe.</p>;

  const palette = ["#4A5B33", "#C1653F", "#5B7FA6", "#B08A3E", "#7A5C99", "#3E8E7E", "#B4544A", "#5C6BC0"];

  const slices = rows.reduce<
    { row: MetricRow; value: number; fraction: number; startAngle: number; endAngle: number; color: string }[]
  >((acc, row, i) => {
    const value = Number(row[field] ?? 0);
    const fraction = value / total;
    const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const endAngle = startAngle + fraction * 360;
    acc.push({ row, value, fraction, startAngle, endAngle, color: palette[i % palette.length] });
    return acc;
  }, []);

  const cx = 80;
  const cy = 80;
  const r = 70;

  function polar(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg width={160} height={160} viewBox="0 0 160 160" role="img" aria-label="Gráfico circular">
        {slices.map((s) => {
          if (s.fraction >= 0.999) {
            return <circle key={s.row.sortKey} cx={cx} cy={cy} r={r} fill={s.color} />;
          }
          const start = polar(s.startAngle);
          const end = polar(s.endAngle);
          const largeArc = s.endAngle - s.startAngle > 180 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
          return <path key={s.row.sortKey} d={d} fill={s.color} />;
        })}
      </svg>
      <div className="flex flex-col gap-1.5 text-sm">
        {slices.map((s) => (
          <div key={s.row.sortKey} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="text-ink-soft">{s.row.label}</span>
            <span className="text-ink-mute">
              {formatValue(s.value, kind)} · {Math.round(s.fraction * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ series }: { series: ComputedSeries[] }) {
  const labelsBySortKey = new Map<string, string>();
  for (const s of series) {
    for (const row of s.rows) labelsBySortKey.set(row.sortKey, row.label);
  }
  const sortKeys = Array.from(labelsBySortKey.keys()).sort();
  if (sortKeys.length === 0) return <p className="text-sm text-ink-mute">No hay datos todavía para este informe.</p>;

  const field = primaryField(series[0].kind);
  const max = Math.max(...series.flatMap((s) => s.rows.map((r) => Number(r[field] ?? 0))), 1);

  const width = 600;
  const height = 220;
  const padding = 30;

  function pointsFor(s: ComputedSeries) {
    const byKey = new Map(s.rows.map((r) => [r.sortKey, Number(r[field] ?? 0)]));
    return sortKeys.map((key, i) => {
      const x = sortKeys.length > 1 ? padding + (i / (sortKeys.length - 1)) * (width - padding * 2) : width / 2;
      const value = byKey.get(key) ?? 0;
      const y = height - padding - (value / max) * (height - padding * 2);
      return { x, y, value };
    });
  }

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de líneas" className="overflow-visible">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-strong)" strokeWidth={1} />
        {series.map((s) => {
          const points = pointsFor(s);
          const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
          return (
            <g key={s.metric}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}
        {sortKeys.map((key, i) => {
          // Con muchos puntos las etiquetas se solapan (sobre todo en móvil,
          // donde el SVG se escala hacia abajo), así que se muestran solo
          // unas cuantas repartidas.
          const labelStep = Math.max(1, Math.ceil(sortKeys.length / 8));
          if (i % labelStep !== 0 && i !== sortKeys.length - 1) return null;
          const x = sortKeys.length > 1 ? padding + (i / (sortKeys.length - 1)) * (width - padding * 2) : width / 2;
          return (
            <text key={key} x={x} y={height - 8} fontSize={10} textAnchor="middle" fill="var(--text-muted)">
              {labelsBySortKey.get(key)}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        {series.map((s) => (
          <div key={s.metric} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-ink-soft">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableView({ series }: { series: ComputedSeries[] }) {
  const labelsBySortKey = new Map<string, string>();
  for (const s of series) {
    for (const row of s.rows) labelsBySortKey.set(row.sortKey, row.label);
  }
  const sortKeys = Array.from(labelsBySortKey.keys()).sort();
  if (sortKeys.length === 0) return <p className="text-sm text-ink-mute">No hay datos todavía para este informe.</p>;

  const hasAnyCompare = series.some((s) => s.previousRows);

  function totalsFor(s: ComputedSeries) {
    const field = primaryField(s.kind);
    const total = s.rows.reduce((sum, r) => sum + Number(r[field] ?? 0), 0);
    const previousTotal = s.previousRows ? s.previousRows.reduce((sum, r) => sum + Number(r[field] ?? 0), 0) : null;
    return { total, previousTotal };
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border-strong bg-sunken">
          <tr>
            <th className="px-3 py-2 text-xs font-semibold tracking-wide text-ink-soft uppercase"></th>
            {series.map((s) =>
              s.previousRows ? (
                <Fragment key={s.metric}>
                  <th className="px-3 py-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">{s.label}</th>
                  <th className="px-3 py-2 text-xs font-semibold tracking-wide text-ink-mute uppercase">{s.label} (anterior)</th>
                  <th className="px-3 py-2 text-xs font-semibold tracking-wide text-ink-mute uppercase">Δ</th>
                </Fragment>
              ) : (
                <th key={s.metric} className="px-3 py-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
                  {s.label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {sortKeys.map((key) => (
            <tr key={key} className="border-t border-border">
              <td className="px-3 py-2 text-ink-soft">{labelsBySortKey.get(key)}</td>
              {series.map((s) => {
                const field = primaryField(s.kind);
                const row = s.rows.find((r) => r.sortKey === key);
                const value = Number(row?.[field] ?? 0);
                if (!s.previousRows) {
                  return (
                    <td key={s.metric} className="px-3 py-2 text-ink">
                      {row ? formatValue(value, s.kind) : "—"}
                    </td>
                  );
                }
                const prevRow = s.previousRows.find((r) => r.sortKey === key);
                const prevValue = prevRow ? Number(prevRow[field] ?? 0) : null;
                return (
                  <Fragment key={s.metric}>
                    <td className="px-3 py-2 text-ink">{row ? formatValue(value, s.kind) : "—"}</td>
                    <td className="px-3 py-2 text-ink-mute">{prevValue !== null ? formatValue(prevValue, s.kind) : "—"}</td>
                    <td className="px-3 py-2">
                      <DeltaBadge delta={prevValue !== null ? deltaPct(value, prevValue) : null} />
                    </td>
                  </Fragment>
                );
              })}
            </tr>
          ))}
          {hasAnyCompare && (
            <tr className="border-t-2 border-border-strong font-medium">
              <td className="px-3 py-2 text-ink">Total</td>
              {series.map((s) => {
                const { total, previousTotal } = totalsFor(s);
                if (!s.previousRows) {
                  return (
                    <td key={s.metric} className="px-3 py-2 text-ink">
                      {formatValue(total, s.kind)}
                    </td>
                  );
                }
                return (
                  <Fragment key={s.metric}>
                    <td className="px-3 py-2 text-ink">{formatValue(total, s.kind)}</td>
                    <td className="px-3 py-2 text-ink-mute">{formatValue(previousTotal ?? 0, s.kind)}</td>
                    <td className="px-3 py-2">
                      <DeltaBadge delta={deltaPct(total, previousTotal ?? 0)} />
                    </td>
                  </Fragment>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function KpiCard({ series }: { series: ComputedSeries }) {
  const field = primaryField(series.kind);
  const total = series.rows.reduce((sum, r) => sum + Number(r[field] ?? 0), 0);
  const previousTotal = series.previousRows ? series.previousRows.reduce((sum, r) => sum + Number(r[field] ?? 0), 0) : null;
  const delta = previousTotal !== null ? deltaPct(total, previousTotal) : null;

  return (
    <div>
      <p className="text-3xl font-semibold text-ink" style={{ color: series.color }}>
        {formatValue(total, series.kind)}
      </p>
      {previousTotal !== null && (
        <p className="mt-2 text-sm">
          <DeltaBadge delta={delta} /> <span className="text-ink-mute">vs. periodo anterior ({formatValue(previousTotal, series.kind)})</span>
        </p>
      )}
    </div>
  );
}
