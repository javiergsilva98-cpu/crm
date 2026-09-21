"use client";

import { useState } from "react";
import { updateClubSettings } from "./actions";

export function ClubSettingsForm({
  reservedFunds,
  reservedNote,
}: {
  reservedFunds: number;
  reservedNote: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      action={async (formData) => {
        setPending(true);
        setError(null);
        setSaved(false);
        const result = await updateClubSettings(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Importe reservado (€)</label>
        <input
          name="reserved_funds"
          type="number"
          step="0.01"
          min="0"
          defaultValue={reservedFunds}
          required
          className="w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-muted">Nota (opcional)</label>
        <input
          name="reserved_note"
          defaultValue={reservedNote}
          placeholder="Ej. seguro de los próximos 3 meses"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
      {saved && <p className="w-full text-sm text-success">Guardado.</p>}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
