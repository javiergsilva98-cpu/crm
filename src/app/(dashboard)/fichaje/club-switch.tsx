"use client";

import { useState } from "react";
import { KeyIcon } from "@/components/icons";
import { openClub, closeClub } from "./actions";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export function ClubSwitch({
  isOpen,
  responsibleName,
  openedAt,
  isResponsible,
  canForceClose,
}: {
  isOpen: boolean;
  responsibleName: string | null;
  openedAt: string | null;
  isResponsible: boolean;
  canForceClose: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Igual que en PresenceButton: refleja el toque al instante (el punto
  // y el texto cambian ya) en vez de esperar la ida y vuelta al
  // servidor, y se deshace si la acción falla.
  const [optimisticOpen, setOptimisticOpen] = useState(isOpen);
  if (!pending && optimisticOpen !== isOpen) setOptimisticOpen(isOpen);

  async function handleOpen() {
    setOptimisticOpen(true);
    setPending(true);
    setError(null);
    const result = await openClub();
    setPending(false);
    if (result && "error" in result && result.error) {
      setOptimisticOpen(false);
      setError(result.error);
    }
  }

  async function handleClose() {
    if (!window.confirm("¿Cerrar el local? El switch pasará a cerrado para todos.")) return;
    setOptimisticOpen(false);
    setPending(true);
    setError(null);
    const result = await closeClub();
    setPending(false);
    if (result && "error" in result && result.error) {
      setOptimisticOpen(true);
      setError(result.error);
    }
  }

  return (
    <div className="rounded-[18px] border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span
          className={`h-3 w-3 flex-shrink-0 rounded-full transition-colors ${optimisticOpen ? "bg-success" : "bg-warning"}`}
          aria-hidden
        />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{optimisticOpen ? "Club abierto" : "Club cerrado"}</p>
          {optimisticOpen && responsibleName && (
            <p className="text-xs text-muted">
              Responsable de cierre: {responsibleName}
              {openedAt && ` · abierto ${formatDateTime(openedAt)}`}
            </p>
          )}
        </div>
        <KeyIcon className="h-5 w-5 text-muted" />
      </div>

      {!optimisticOpen && (
        <button
          type="button"
          onClick={handleOpen}
          disabled={pending}
          className="mt-3 w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          He abierto
        </button>
      )}
      {optimisticOpen && (isResponsible || canForceClose) && (
        <button
          type="button"
          onClick={handleClose}
          disabled={pending}
          className="mt-3 w-full rounded-xl border border-warning/40 px-3 py-2.5 text-sm font-semibold text-warning disabled:opacity-50"
        >
          Cerrar el local
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
