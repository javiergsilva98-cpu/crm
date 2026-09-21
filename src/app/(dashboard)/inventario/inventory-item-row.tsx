"use client";

import { useState } from "react";
import { BoxIcon } from "@/components/icons";
import { updateLowStockThreshold } from "./actions";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  low_stock_threshold: number;
  current_cost: number;
  sale_price: number | null;
};

function eur(n: number) {
  return `${n.toFixed(2)} €`;
}

export function InventoryItemRow({
  item,
  isLast,
  canEditThreshold,
}: {
  item: InventoryItem;
  isLast: boolean;
  canEditThreshold: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const low = item.current_stock <= item.low_stock_threshold;

  return (
    <div className={`flex flex-wrap items-center gap-3 px-3.5 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <div
        className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-xl ${
          low ? "bg-warning-soft" : "bg-accent-soft"
        }`}
      >
        <BoxIcon className={`h-4 w-4 ${low ? "text-warning" : "text-accent"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
          {low && (
            <span className="flex-shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning">
              Pocas unidades
            </span>
          )}
        </div>
        {canEditThreshold && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-[11px] text-muted underline decoration-dotted transition-colors hover:text-foreground"
          >
            Aviso con {item.low_stock_threshold} {item.unit} o menos
          </button>
        )}
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
        <p className={`text-sm font-bold ${low ? "text-warning" : "text-foreground"}`}>
          {item.current_stock} <span className="font-normal text-muted">{item.unit}</span>
        </p>
        <p className="text-[11px] text-muted">
          coste {eur(item.current_cost)}
          {item.sale_price !== null && <> · venta {eur(item.sale_price)}</>}
        </p>
      </div>

      {editing && canEditThreshold && (
        <form
          className="flex w-full items-center gap-2 pl-[46px]"
          action={async (fd) => {
            setPending(true);
            setError(null);
            const result = await updateLowStockThreshold(fd);
            setPending(false);
            if (result && "error" in result && result.error) {
              setError(result.error);
              return;
            }
            setEditing(false);
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <label className="text-xs text-muted">Avisar cuando queden</label>
          <input
            name="low_stock_threshold"
            type="number"
            min="0"
            step="1"
            defaultValue={item.low_stock_threshold}
            className="w-20 rounded-xl border border-border bg-background px-2.5 py-1 text-xs text-foreground outline-none focus:border-accent"
          />
          <span className="text-xs text-muted">{item.unit} o menos</span>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            Guardar
          </button>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
