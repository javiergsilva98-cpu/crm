const STAGE_ORDER = ["nuevo", "calificado", "propuesta", "negociacion", "ganado", "perdido"] as const;

const STAGE_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  calificado: "Calificado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

// Rampa secuencial en el verde oliva de marca (etapas abiertas) + colores de estado (ganado/perdido).
const STAGE_COLORS: Record<string, string> = {
  nuevo: "#b7c1a3",
  calificado: "#93a374",
  propuesta: "#6e8250",
  negociacion: "#4a5b33",
  ganado: "#6f9450",
  perdido: "#a8342a",
};

export function PipelineChart({
  data,
}: {
  data: { stage: string; amount: number }[];
}) {
  const byStage = new Map<string, number>();
  for (const d of data) {
    byStage.set(d.stage, (byStage.get(d.stage) ?? 0) + d.amount);
  }
  const rows = STAGE_ORDER.map((stage) => ({
    stage,
    amount: byStage.get(stage) ?? 0,
  }));
  const max = Math.max(1, ...rows.map((r) => r.amount));

  return (
    <div className="rounded-lg border border-border bg-raised p-6 transition-colors hover:border-border-strong">
      <h2 className="mb-4 text-sm font-semibold text-ink">Valor del pipeline por etapa</h2>
      <div className="flex flex-col gap-1">
        {rows.map((row) => {
          const widthPct = Math.max(2, (row.amount / max) * 100);
          return (
            <div
              key={row.stage}
              title={`${STAGE_LABELS[row.stage]}: ${row.amount.toLocaleString("es-ES")}€`}
              className="group flex items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-sunken"
            >
              <span className="w-24 shrink-0 text-xs text-ink-soft transition-colors group-hover:text-ink">
                {STAGE_LABELS[row.stage]}
              </span>
              <div className="h-4 flex-1 rounded-sm bg-sunken">
                <div
                  className="h-4 rounded-sm transition-[width,filter] duration-300 group-hover:brightness-90"
                  style={{ width: `${widthPct}%`, backgroundColor: STAGE_COLORS[row.stage] }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-ink-soft transition-colors group-hover:text-ink">
                {row.amount.toLocaleString("es-ES")}€
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
