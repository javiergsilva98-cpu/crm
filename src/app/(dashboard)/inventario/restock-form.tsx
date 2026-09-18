"use client";

import { useRef, useState } from "react";
import { registerRestock } from "./actions";

export function RestockForm({
  items,
  members,
}: {
  items: { id: string; name: string; unit: string }[];
  members: { id: string; full_name: string }[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await registerRestock(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Artículo</label>
        <select
          name="inventory_item_id"
          required
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.unit})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Cantidad</label>
        <input
          name="quantity"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Coste (€)</label>
        <input
          name="cost"
          type="number"
          step="0.01"
          min="0"
          className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Responsable</label>
        <select
          name="responsible_member_id"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">Sin especificar</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Registrar reposición"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
