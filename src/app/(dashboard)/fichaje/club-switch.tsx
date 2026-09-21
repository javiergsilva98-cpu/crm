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

  async function handleOpen() {
    setPending(true);
    setError(null);
    const result = await openClub();
    setPending(false);
    if (result && "error" in result && result.error) setError(result.error);
  }

  async function handleClose() {
    if (!window.confirm("¿Cerrar el local? El switch pasará a cerrado para todos.")) return;
    setPending(true);
    setError(null);
    const result = await closeClub();
    setPending(false);
    if (result && "error" in result && result.error) setError(result.error);
  }

  return (
    <div className="rounded-[18px] border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span
          className={`h-3 w-3 flex-shrink-0 rounded-full ${isOpen ? "bg-success" : "bg-warning"}`}
          aria-hidden
        />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{isOpen ? "Club abierto" : "Club cerrado"}</p>
          {isOpen && responsibleName && (
            <p className="text-xs text-muted">
              Responsable de cierre: {responsibleName}
              {openedAt && ` · abierto ${formatDateTime(openedAt)}`}
            </p>
          )}
        </div>
        <KeyIcon className="h-5 w-5 text-muted" />
      </div>

      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          disabled={pending}
          className="mt-3 w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Abriendo..." : "He abierto"}
        </button>
      )}
      {isOpen && (isResponsible || canForceClose) && (
        <button
          type="button"
          onClick={handleClose}
          disabled={pending}
          className="mt-3 w-full rounded-xl border border-warning/40 px-3 py-2.5 text-sm font-semibold text-warning disabled:opacity-50"
        >
          {pending ? "Cerrando..." : "Cerrar el local"}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
