"use client";

import { useState, useTransition } from "react";
import { updateStage as updateStageAction } from "../actions";

const STAGES = ["nuevo", "calificado", "propuesta", "negociacion", "ganado", "perdido"] as const;

const STAGE_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  calificado: "Calificado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

type Opportunity = {
  id: string;
  title: string;
  stage: string;
  amount: number;
  companies: { name: string } | null;
};

export function PipelineBoard({ opportunities }: { opportunities: Opportunity[] }) {
  const [items, setItems] = useState(opportunities);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function moveTo(id: string, stage: string) {
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    startTransition(() => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("stage", stage);
      updateStageAction(formData);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageItems = items.filter((o) => o.stage === stage);
        const stageTotal = stageItems.reduce((sum, o) => sum + Number(o.amount), 0);

        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) moveTo(dragId, stage);
            }}
            className="w-64 shrink-0 rounded-lg border border-border bg-sunken"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {stage === "ganado" && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
                {stage === "perdido" && <span className="h-1.5 w-1.5 rounded-full bg-danger" />}
                {STAGE_LABELS[stage]}
              </p>
              <p className="text-xs text-ink-mute">
                {stageItems.length} · ${stageTotal.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col gap-2 p-2">
              {stageItems.map((opp) => (
                <div
                  key={opp.id}
                  draggable
                  onDragStart={() => setDragId(opp.id)}
                  onDragEnd={() => setDragId(null)}
                  className="cursor-grab rounded-md border border-border bg-raised p-3 text-sm shadow-sm active:cursor-grabbing"
                >
                  <p className="font-medium text-ink">{opp.title}</p>
                  {opp.companies?.name && <p className="text-xs text-ink-mute">{opp.companies.name}</p>}
                  <p className="mt-1 text-xs text-ink-soft">${Number(opp.amount).toLocaleString()}</p>
                </div>
              ))}
              {stageItems.length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-ink-mute">Sin oportunidades</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
