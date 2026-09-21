"use client";

import { useState } from "react";
import { checkIn, checkOut } from "./actions";

export function PresenceButton({ isCheckedIn, clubOpen }: { isCheckedIn: boolean; clubOpen: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const result = isCheckedIn ? await checkOut() : await checkIn();
    setPending(false);
    if (result && "error" in result && result.error) setError(result.error);
  }

  return (
    <div className="rounded-[18px] border border-border bg-card p-4">
      <p className="text-sm font-bold text-foreground">Tu fichaje</p>
      <p className="mt-0.5 text-xs text-muted">
        {isCheckedIn ? "Estás marcado como presente en el local." : "No estás fichado ahora mismo."}
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || (!isCheckedIn && !clubOpen)}
        className={`mt-3 w-full rounded-xl px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${
          isCheckedIn
            ? "border border-border text-muted"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {pending ? "..." : isCheckedIn ? "Me voy" : "Estoy en el local"}
      </button>
      {!isCheckedIn && !clubOpen && (
        <p className="mt-1.5 text-[11px] text-muted">El local está cerrado — abre primero si acabas de llegar.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
