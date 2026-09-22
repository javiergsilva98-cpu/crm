"use client";

import { useState } from "react";
import { checkIn, checkOut } from "./actions";

export function PresenceButton({ isCheckedIn, clubOpen }: { isCheckedIn: boolean; clubOpen: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Estado optimista: refleja el toque al instante (el texto/estilo del
  // botón cambia ya, sin esperar la ida y vuelta al servidor) y solo se
  // deshace si la acción falla. Se resincroniza con la prop real cuando
  // la página se vuelve a renderizar tras el revalidatePath.
  const [optimisticCheckedIn, setOptimisticCheckedIn] = useState(isCheckedIn);
  if (!pending && optimisticCheckedIn !== isCheckedIn) setOptimisticCheckedIn(isCheckedIn);

  async function handleClick() {
    const next = !optimisticCheckedIn;
    setOptimisticCheckedIn(next);
    setPending(true);
    setError(null);
    const result = optimisticCheckedIn ? await checkOut() : await checkIn();
    setPending(false);
    if (result && "error" in result && result.error) {
      setOptimisticCheckedIn(!next);
      setError(result.error);
    }
  }

  return (
    <div className="rounded-[18px] border border-border bg-card p-4">
      <p className="text-sm font-bold text-foreground">Tu fichaje</p>
      <p className="mt-0.5 text-xs text-muted">
        {optimisticCheckedIn ? "Estás marcado como presente en el local." : "No estás fichado ahora mismo."}
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || (!optimisticCheckedIn && !clubOpen)}
        className={`mt-3 w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 ${
          optimisticCheckedIn
            ? "border border-border text-muted"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {optimisticCheckedIn ? "Me voy" : "Estoy en el local"}
      </button>
      {!optimisticCheckedIn && !clubOpen && (
        <p className="mt-1.5 text-[11px] text-muted">El local está cerrado — abre primero si acabas de llegar.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
