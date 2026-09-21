"use client";

import { useState } from "react";
import { UserPlusIcon } from "@/components/icons";
import { MarkConsumptionForm } from "./mark-consumption-form";
import { ShareConsumptionForm } from "./share-consumption-form";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  guest_price: number;
  current_cost: number;
  needs_price_review: boolean;
  stock_mode: string;
};
type Member = { id: string; full_name: string };

// El toggle "Llevo invitados" vive solo en este componente (estado de
// React, sin cookie ni tabla): es una preferencia de esta pantalla en
// este momento, se pierde al recargar y no afecta a lo que ven otros
// socios, tal y como pide la Fase 6.
export function GuestModeBoard({
  bebidas,
  aperitivos,
  memberId,
  members,
}: {
  bebidas: MenuItem[];
  aperitivos: MenuItem[];
  memberId: string;
  members: Member[];
}) {
  const [guestMode, setGuestMode] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setGuestMode((v) => !v)}
        aria-pressed={guestMode}
        className={`mb-5 flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
          guestMode
            ? "border-accent bg-accent-soft text-accent"
            : "border-border bg-card text-muted hover:text-foreground"
        }`}
      >
        <UserPlusIcon className="h-4 w-4" />
        Llevo invitados
        {guestMode && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">ON</span>}
      </button>

      <MenuSection title="Bebidas" items={bebidas} memberId={memberId} members={members} guestMode={guestMode} />
      <MenuSection title="Aperitivos" items={aperitivos} memberId={memberId} members={members} guestMode={guestMode} />
    </div>
  );
}

function MenuSection({
  title,
  items,
  memberId,
  members,
  guestMode,
}: {
  title: string;
  items: MenuItem[];
  memberId: string;
  members: Member[];
  guestMode: boolean;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) =>
          item.stock_mode === "shared" ? (
            <ShareConsumptionForm
              key={item.id}
              menuItemId={item.id}
              name={item.name}
              price={item.price}
              guestPrice={item.guest_price}
              cost={item.current_cost}
              needsPriceReview={item.needs_price_review}
              currentMemberId={memberId}
              members={members}
              guestMode={guestMode}
            />
          ) : (
            <MarkConsumptionForm
              key={item.id}
              memberId={memberId}
              menuItemId={item.id}
              name={item.name}
              price={item.price}
              guestPrice={item.guest_price}
              cost={item.current_cost}
              needsPriceReview={item.needs_price_review}
              guestMode={guestMode}
            />
          ),
        )}
        {items.length === 0 && <p className="text-sm text-muted">Sin artículos.</p>}
      </div>
    </div>
  );
}
