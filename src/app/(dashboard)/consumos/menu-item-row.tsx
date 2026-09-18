"use client";

import { useState } from "react";
import { updateMenuItem, deleteMenuItem, toggleMenuItemActive } from "./actions";

type MenuItem = { id: string; name: string; category: string; price: number; active: boolean };

export function MenuItemRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: (fd: FormData) => Promise<{ error?: string } | void>, formData: FormData) {
    setPending(true);
    setError(null);
    const result = await action(formData);
    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
    }
  }

  return (
    <form
      className={`flex flex-wrap items-center gap-2 px-3.5 py-3 ${isLast ? "" : "border-b border-border"}`}
      action={(fd) => run(updateMenuItem, fd)}
    >
      <input type="hidden" name="id" value={item.id} />
      <input
        name="name"
        defaultValue={item.name}
        required
        className={`min-w-[9rem] flex-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent ${
          item.active ? "text-foreground" : "text-muted line-through"
        }`}
      />
      <select
        name="category"
        defaultValue={item.category}
        className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
      >
        <option value="bebida">Bebida</option>
        <option value="aperitivo">Aperitivo</option>
      </select>
      <input
        name="price"
        type="number"
        step="0.01"
        min="0.01"
        defaultValue={item.price}
        required
        className="w-20 rounded-xl border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
      >
        Guardar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          const fd = new FormData(e.currentTarget.form!);
          fd.set("next_active", (!item.active).toString());
          run(toggleMenuItemActive, fd);
        }}
        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
      >
        {item.active ? "Desactivar" : "Activar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => run(deleteMenuItem, new FormData(e.currentTarget.form!))}
        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-warning transition-colors hover:bg-warning-soft disabled:opacity-50"
      >
        Eliminar
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
