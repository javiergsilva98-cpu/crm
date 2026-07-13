const STAGE_ORDER = ["nuevo", "calificado", "propuesta", "negociacion", "ganado", "perdido"] as const;

const STAGE_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  calificado: "Calificado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

// Rampa secuencial azul (etapas abiertas) + colores de estado (ganado/perdido).
const STAGE_COLORS: Record<string, string> = {
  nuevo: "#9ec5f4",
  calificado: "#6da7ec",
  propuesta: "#3987e5",
  negociacion: "#1c5cab",
  ganado: "#0ca30c",
  perdido: "#d03b3b",
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
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Valor del pipeline por etapa</h2>
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const widthPct = Math.max(2, (row.amount / max) * 100);
          return (
            <div key={row.stage} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-gray-600">{STAGE_LABELS[row.stage]}</span>
              <div className="h-4 flex-1 rounded-sm bg-gray-100">
                <div
                  className="h-4 rounded-sm"
                  style={{ width: `${widthPct}%`, backgroundColor: STAGE_COLORS[row.stage] }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-gray-700">
                ${row.amount.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
