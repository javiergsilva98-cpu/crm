"use client";

import { useState } from "react";
import { updateMarginSettings } from "./actions";

export function MarginSettingsForm({
  saleMarginPct,
  minMarginPct,
}: {
  saleMarginPct: number;
  minMarginPct: number;
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
        const result = await updateMarginSettings(formData);
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
        <label className="mb-1 block text-xs text-muted">Margen de venta (%)</label>
        <input
          name="sale_margin_pct"
          type="number"
          step="0.1"
          min="0"
          defaultValue={saleMarginPct}
          required
          className="w-28 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Margen mínimo de seguridad (%)</label>
        <input
          name="min_margin_pct"
          type="number"
          step="0.1"
          min="0"
          defaultValue={minMarginPct}
          required
          className="w-28 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
      {saved && <p className="w-full text-sm text-success">Guardado. La carta vinculada a bodega se ha recalculado.</p>}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
