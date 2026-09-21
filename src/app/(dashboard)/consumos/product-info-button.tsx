"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InfoIcon, XIcon } from "@/components/icons";

type HistoryRow = {
  id: string;
  changed_at: string;
  old_cost: number | null;
  new_cost: number;
  old_price: number | null;
  new_price: number;
  needs_review: boolean;
};

function eur(n: number) {
  return `${n.toFixed(2)} €`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function ProductInfoButton({
  menuItemId,
  name,
  price,
  cost,
  needsReview,
}: {
  menuItemId: string;
  name: string;
  price: number;
  cost: number;
  needsReview: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setOpen(true);
    if (rows) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("menu_item_price_history")
      .select("id, changed_at, old_cost, new_cost, old_price, new_price, needs_review")
      .eq("menu_item_id", menuItemId)
      .order("changed_at", { ascending: false })
      .limit(5);
    setRows((data as HistoryRow[] | null) ?? []);
    setLoading(false);
  }

  const margin = cost > 0 ? ((price - cost) / cost) * 100 : null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Ver precio y coste de ${name}`}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-muted transition-colors hover:text-foreground"
      >
        <InfoIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-t-[26px] bg-card p-5 sm:rounded-[26px]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">{name}</p>
              <button type="button" onClick={() => setOpen(false)} className="text-muted">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border p-3 text-center">
              <div>
                <p className="text-[10px] text-muted">Coste</p>
                <p className="text-sm font-bold text-foreground">{eur(cost)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">Precio de venta</p>
                <p className="text-sm font-bold text-foreground">{eur(price)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">Margen</p>
                <p className="text-sm font-bold text-foreground">{margin !== null ? `${margin.toFixed(0)}%` : "—"}</p>
              </div>
            </div>

            {needsReview && (
              <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-xs font-semibold text-warning">
                Pendiente de revisión: el margen configurado no llega al mínimo de seguridad, así que
                el precio no se ha actualizado solo con el último coste.
              </p>
            )}

            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-muted">
              Historial de precio
            </p>
            {loading && <p className="text-sm text-muted">Cargando...</p>}
            {!loading && rows && rows.length === 0 && (
              <p className="text-sm text-muted">Sin cambios de precio todavía.</p>
            )}
            {!loading && rows && rows.length > 0 && (
              <div className="flex flex-col gap-2">
                {rows.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border p-2.5 text-xs">
                    <p className="font-semibold text-foreground">{formatDate(r.changed_at)}</p>
                    <p className="mt-0.5 text-muted">
                      Coste: {r.old_cost !== null ? eur(r.old_cost) : "—"} → {eur(r.new_cost)}
                      {" · "}
                      Precio: {r.old_price !== null ? eur(r.old_price) : "—"} → {eur(r.new_price)}
                    </p>
                    {r.needs_review && (
                      <p className="mt-0.5 font-semibold text-warning">Quedó pendiente de revisión.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
