"use client";

import { useRef, useState } from "react";
import { submitInventoryCount } from "./actions";

type Item = { id: string; name: string; unit: string; current_stock: number };
type Member = { id: string; full_name: string };

export function CountForm({
  items,
  members,
  defaultMemberId,
}: {
  items: Item[];
  members: Member[];
  defaultMemberId: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="rounded-[18px] border border-border bg-card p-4"
      action={async (formData) => {
        setPending(true);
        setError(null);
        setSaved(false);
        const result = await submitInventoryCount(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        setSaved(true);
        formRef.current?.reset();
      }}
    >
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Contado por</label>
          <select
            name="counted_by_member_id"
            defaultValue={defaultMemberId}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted">Nota (opcional)</label>
          <input
            name="notes"
            placeholder="Ej. antes del fin de semana de fiestas"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-3 py-2.5 ${idx !== items.length - 1 ? "border-b border-border" : ""}`}
          >
            <input type="hidden" name="item_id" value={item.id} />
            <input type="hidden" name="expected_stock" value={item.current_stock} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-muted">
                Teórico: {item.current_stock} {item.unit}
              </p>
            </div>
            <input
              name="actual_stock"
              type="number"
              step="0.01"
              min="0"
              placeholder="Real"
              className="w-24 rounded-xl border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
        ))}
        {items.length === 0 && (
          <p className="px-3.5 py-6 text-center text-sm text-muted">No hay artículos de bodega todavía.</p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar conteo"}
        </button>
        {saved && <p className="text-sm text-success">Conteo guardado, stock ajustado.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
