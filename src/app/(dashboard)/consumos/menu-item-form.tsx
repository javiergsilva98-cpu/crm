"use client";

import { useRef, useState } from "react";
import { createMenuItem } from "./actions";

type InventoryItem = { id: string; name: string };

export function MenuItemForm({ inventoryItems }: { inventoryItems: InventoryItem[] }) {
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
        const result = await createMenuItem(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Nombre</label>
        <input
          name="name"
          required
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Categoría</label>
        <select
          name="category"
          defaultValue="bebida"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="bebida">Bebida</option>
          <option value="aperitivo">Aperitivo</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Bodega</label>
        <select
          name="inventory_item_id"
          required
          defaultValue=""
          title="El precio de venta se calcula solo a partir del coste de este artículo de bodega y el margen configurado."
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="" disabled>
            Elige un artículo de bodega
          </option>
          {inventoryItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Modo</label>
        <select
          name="stock_mode"
          defaultValue="unit"
          title="Individual: 1 consumo = 1 unidad. Compartido: se reparte entre varios socios y se descuenta 1 unidad en total."
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="unit">Individual</option>
          <option value="shared">Compartido</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Añadir a la carta"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
