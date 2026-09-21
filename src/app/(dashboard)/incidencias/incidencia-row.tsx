"use client";

import { useState } from "react";
import { resolveIncidencia } from "./actions";

const CATEGORY_LABELS: Record<string, string> = {
  rotura: "Algo roto",
  falta_material: "Falta material",
  convivencia: "Convivencia",
  consumicion_incorrecta: "Consumición mal registrada",
  producto: "Producto de inventario",
  fichaje: "Fichaje / responsable de esa jornada",
  otro: "Otro",
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelta: "Resuelta",
};

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-warning-soft text-warning",
  en_revision: "bg-accent-soft text-accent",
  resuelta: "bg-success-soft text-success",
};

export type IncidenciaRowData = {
  id: string;
  categoria: string;
  descripcion: string;
  estado: string;
  decision: string | null;
  fecha_incidencia: string;
  created_at: string;
  reporter: string;
  resolvedBy: string | null;
  resolucion_notas: string | null;
  isCorreccionConsumicion: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function IncidenciaRow({ row, canResolve, isLast }: { row: IncidenciaRowData; canResolve: boolean; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(estado: string, decision?: string) {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("id", row.id);
    fd.set("estado", estado);
    if (decision) fd.set("decision", decision);
    const result = await resolveIncidencia(fd);
    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <div className={`px-3.5 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-bold text-foreground">
              {CATEGORY_LABELS[row.categoria] ?? row.categoria}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ESTADO_STYLES[row.estado] ?? ""}`}>
              {ESTADO_LABELS[row.estado] ?? row.estado}
            </span>
            {row.decision && (
              <span className="text-[10px] font-semibold text-muted">
                {row.decision === "aprobada" ? "Aprobada" : "Rechazada"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground">{row.descripcion}</p>
          <p className="mt-0.5 text-xs text-muted">
            {row.reporter} · {formatDate(row.fecha_incidencia)}
            {row.resolvedBy && ` · resuelta por ${row.resolvedBy}`}
          </p>
          {row.resolucion_notas && <p className="mt-0.5 text-xs text-muted">Nota: {row.resolucion_notas}</p>}
          {row.isCorreccionConsumicion && (
            <p className="mt-0.5 text-xs font-semibold text-success">Consumición corregida (cargo anulado).</p>
          )}
        </div>
        {canResolve && row.estado !== "resuelta" && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex-shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
          >
            Gestionar
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border p-3">
          {row.estado === "pendiente" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => act("en_revision")}
              className="self-start rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground disabled:opacity-50"
            >
              Marcar en revisión
            </button>
          )}
          {row.categoria === "consumicion_incorrecta" ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => act("resuelta", "aprobada")}
                className="flex-1 rounded-xl bg-success px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Aprobar (corrige el cargo)
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => act("resuelta", "rechazada")}
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => act("resuelta", "aprobada")}
                className="flex-1 rounded-xl bg-success px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Marcar resuelta
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => act("resuelta", "rechazada")}
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted disabled:opacity-50"
              >
                Descartar
              </button>
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
