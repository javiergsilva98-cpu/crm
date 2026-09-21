"use client";

import { useState } from "react";
import { CupIcon, PlusIcon, CheckIcon } from "@/components/icons";
import { markConsumption } from "./actions";

type Step = "idle" | "confirm" | "success";

export function MarkConsumptionForm({
  memberId,
  menuItemId,
  name,
  price,
}: {
  memberId: string;
  menuItemId: string;
  name: string;
  price: number;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("member_id", memberId);
    fd.set("menu_item_id", menuItemId);
    fd.set("unit_price", String(price));
    const result = await markConsumption(fd);
    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setStep("idle");
      return;
    }
    setStep("success");
    setTimeout(() => setStep("idle"), 1100);
  }

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-border bg-card p-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
        <CupIcon className="h-[17px] w-[17px] text-accent" />
      </div>
      <p className="mt-2.5 text-sm font-bold text-foreground">{name}</p>
      <p className="mt-0.5 text-xs text-muted">{price.toFixed(2)} €</p>
      {error && <p className="mt-1 pr-9 text-[10px] font-medium text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => setStep("confirm")}
        aria-label={`Pedir ${name}`}
        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_6px_14px_-6px_var(--color-accent)] transition-transform active:scale-95"
      >
        <PlusIcon className="h-4 w-4" />
      </button>

      {step === "success" && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-card/95">
          <div className="flex h-10 w-10 animate-pop-in items-center justify-center rounded-full bg-success text-white">
            <CheckIcon className="h-5 w-5" />
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setStep("idle")}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-[26px] bg-card p-5 sm:rounded-[26px]"
          >
            <p className="text-sm font-bold text-foreground">Confirmar pedido</p>
            <p className="mt-0.5 text-xs text-muted">Se apunta a tu cuenta al momento y no se puede deshacer.</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                <CupIcon className="h-[17px] w-[17px] text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted">{price.toFixed(2)} €</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setStep("idle")}
                className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
              >
                {pending ? "Confirmando..." : "Confirmar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
