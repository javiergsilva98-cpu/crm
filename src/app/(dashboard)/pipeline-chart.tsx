const STAGE_ORDER = ["nuevo", "calificado", "propuesta", "negociacion", "ganado", "perdido"] as const;

const STAGE_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  calificado: "Calificado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

// Rampa secuencial en el color de marca "calm" (etapas abiertas) + colores de estado (ganado/perdido).
const STAGE_COLORS: Record<string, string> = {
  nuevo: "#7fb3b3",
  calificado: "#5c9c9c",
  propuesta: "#3d8686",
  negociacion: "#2b6e6e",
  ganado: "#7fa37a",
  perdido: "#c1553b",
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
    <div className="rounded-lg border border-border bg-raised p-6">
      <h2 className="mb-4 text-sm font-semibold text-ink">Valor del pipeline por etapa</h2>
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const widthPct = Math.max(2, (row.amount / max) * 100);
          return (
            <div key={row.stage} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-ink-soft">{STAGE_LABELS[row.stage]}</span>
              <div className="h-4 flex-1 rounded-sm bg-sunken">
                <div
                  className="h-4 rounded-sm"
                  style={{ width: `${widthPct}%`, backgroundColor: STAGE_COLORS[row.stage] }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-ink-soft">
                ${row.amount.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
