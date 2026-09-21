"use client";

import { useState } from "react";
import { CupIcon, PlusIcon, CheckIcon } from "@/components/icons";
import { markConsumption } from "./actions";
import { ProductInfoButton } from "./product-info-button";

type Step = "idle" | "confirm" | "success";

export function MarkConsumptionForm({
  memberId,
  menuItemId,
  name,
  price,
  guestPrice,
  cost,
  needsPriceReview,
  guestMode,
}: {
  memberId: string;
  menuItemId: string;
  name: string;
  price: number;
  guestPrice: number;
  cost: number;
  needsPriceReview: boolean;
  guestMode: boolean;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Qué botón de precio se ha tocado para abrir la confirmación (socio o
  // invitado) — la elección ya se hace al tocar el botón de la carta, la
  // hoja de confirmación solo pide el segundo toque (doble confirmación
  // de la Fase 1), no vuelve a preguntar socio/invitado.
  const [pendingGuest, setPendingGuest] = useState(false);

  function openConfirm(isGuest: boolean) {
    setPendingGuest(isGuest);
    setStep("confirm");
  }

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("member_id", memberId);
    fd.set("menu_item_id", menuItemId);
    fd.set("is_guest", String(pendingGuest));
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
      <ProductInfoButton menuItemId={menuItemId} name={name} price={price} cost={cost} needsReview={needsPriceReview} />
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
        <CupIcon className="h-[17px] w-[17px] text-accent" />
      </div>
      <p className="mt-2.5 pr-7 text-sm font-bold text-foreground">{name}</p>
      {error && <p className="mt-1 text-[10px] font-medium text-red-600">{error}</p>}
      <div className="mt-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => openConfirm(false)}
          aria-label={`Pedir ${name} (socio)`}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-accent px-2 py-2 text-sm font-bold text-accent-foreground shadow-[0_6px_14px_-6px_var(--color-accent)] transition-transform active:scale-95"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {price.toFixed(2)} €
        </button>
        {guestMode && (
          <button
            type="button"
            onClick={() => openConfirm(true)}
            aria-label={`Pedir ${name} (invitado)`}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-accent px-2 py-2 text-sm font-bold text-accent transition-transform active:scale-95"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {guestPrice.toFixed(2)} €
          </button>
        )}
      </div>

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
                <p className="text-sm font-semibold text-foreground">
                  {name}
                  {pendingGuest && (
                    <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
                      Invitado
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">{(pendingGuest ? guestPrice : price).toFixed(2)} €</p>
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
                onClick={() => handleConfirm()}
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
