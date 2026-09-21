"use client";

import { useRef, useState } from "react";
import { registerRestock, createInventoryItem } from "./actions";

type Item = { id: string; name: string; unit: string };
type Member = { id: string; full_name: string };

export function RestockForm({
  items,
  members,
  canCreateNew,
}: {
  items: Item[];
  members: Member[];
  canCreateNew: boolean;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      {canCreateNew && (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "existing" ? "bg-accent text-accent-foreground" : "border border-border text-muted"
            }`}
          >
            Producto existente
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "new" ? "bg-accent text-accent-foreground" : "border border-border text-muted"
            }`}
          >
            Producto nuevo
          </button>
        </div>
      )}

      <form
        ref={formRef}
        className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
        action={async (formData) => {
          setPending(true);
          setError(null);
          const result = mode === "existing" ? await registerRestock(formData) : await createInventoryItem(formData);
          setPending(false);
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          formRef.current?.reset();
        }}
      >
        {mode === "existing" ? (
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
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs text-muted">Nombre</label>
              <input
                name="name"
                required
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Unidad</label>
              <input
                name="unit"
                placeholder="latas, botellas..."
                defaultValue="ud"
                className="w-28 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
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
              <label className="mb-1 block text-xs text-muted">Modo</label>
              <select
                name="stock_mode"
                defaultValue="unit"
                title="Individual: 1 consumo = 1 unidad. A repartir: se reparte entre varios socios y se descuenta 1 unidad en total."
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="unit">Individual</option>
                <option value="shared">A repartir</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-xs text-muted">{mode === "existing" ? "Cantidad" : "Cantidad inicial"}</label>
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
          <label className="mb-1 block text-xs text-muted">Coste del pedido (€)</label>
          <input
            name="cost"
            type="number"
            step="0.01"
            min={mode === "new" ? "0.01" : "0"}
            required={mode === "new"}
            className="w-28 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          {mode === "new" && (
            <p className="mt-1 text-[11px] text-muted">El precio de venta se calcula solo con el margen configurado.</p>
          )}
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
          {pending ? "Guardando..." : mode === "existing" ? "Registrar reposición" : "Crear artículo"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
