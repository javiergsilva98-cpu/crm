"use client";

import { useState } from "react";
import { CupIcon, PlusIcon } from "@/components/icons";
import { markConsumption } from "./actions";

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="relative rounded-[18px] border border-border bg-card p-3.5"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await markConsumption(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
        }
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <input type="hidden" name="menu_item_id" value={menuItemId} />
      <input type="hidden" name="unit_price" value={price} />
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
        <CupIcon className="h-[17px] w-[17px] text-accent" />
      </div>
      <p className="mt-2.5 text-sm font-bold text-foreground">{name}</p>
      <p className="mt-0.5 text-xs text-muted">{price.toFixed(2)} €</p>
      {error && <p className="mt-1 pr-9 text-[10px] font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        aria-label={`Marcar ${name}`}
        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_6px_14px_-6px_var(--color-accent)] transition-transform active:scale-95 disabled:opacity-50"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
