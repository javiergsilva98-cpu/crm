"use client";

import { useState, type ReactNode } from "react";

export function AddDisclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex items-center gap-2 rounded-md border border-border bg-raised px-4 py-2 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
      >
        <span className="flex h-4 w-4 items-center justify-center text-base leading-none">+</span>
        {label}
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-border bg-raised p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="text-ink-mute transition-colors hover:text-ink"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  );
}
