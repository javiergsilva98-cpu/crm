"use client";

import { useState } from "react";
import { CupIcon, UsersIcon } from "@/components/icons";
import { markSharedConsumption } from "./actions";

type Member = { id: string; full_name: string };

export function ShareConsumptionForm({
  menuItemId,
  name,
  price,
  currentMemberId,
  members,
}: {
  menuItemId: string;
  name: string;
  price: number;
  currentMemberId: string;
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([currentMemberId]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length < 2) {
      setError("Elige al menos un socio más para repartir.");
      return;
    }
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("menu_item_id", menuItemId);
    selected.forEach((id) => fd.append("member_ids", id));
    const result = await markSharedConsumption(fd);
    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setSelected([currentMemberId]);
  }

  return (
    <div className="relative rounded-[18px] border border-border bg-card p-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
        <CupIcon className="h-[17px] w-[17px] text-accent" />
      </div>
      <p className="mt-2.5 text-sm font-bold text-foreground">{name}</p>
      <p className="mt-0.5 text-xs text-muted">{price.toFixed(2)} € · a repartir</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Compartir ${name}`}
        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_6px_14px_-6px_var(--color-accent)] transition-transform active:scale-95"
      >
        <UsersIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-t-[26px] bg-card p-5 sm:rounded-[26px]"
          >
            <p className="text-sm font-bold text-foreground">Repartir {name}</p>
            <p className="mt-0.5 text-xs text-muted">
              {price.toFixed(2)} € entre {selected.length || 1} socio{selected.length === 1 ? "" : "s"} ={" "}
              {(price / Math.max(selected.length, 1)).toFixed(2)} € cada uno
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {members.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 accent-accent"
                  />
                  {m.full_name}
                  {m.id === currentMemberId && <span className="text-xs text-muted">(tú)</span>}
                </label>
              ))}
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
              >
                {pending ? "Repartiendo..." : "Confirmar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
