"use client";

import { useState } from "react";
import { saveDetailFields } from "@/app/(dashboard)/detail-view-actions";
import type { DetailField, DetailTableName } from "@/lib/detail-fields";

export function FieldCustomizer({
  tableName,
  catalog,
  selected,
}: {
  tableName: DetailTableName;
  catalog: DetailField[];
  selected: string[];
}) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>(selected.length > 0 ? selected : catalog.map((f) => f.key));

  function toggle(key: string) {
    setOrder((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function move(key: string, dir: -1 | 1) {
    setOrder((prev) => {
      const index = prev.indexOf(key);
      const target = index + dir;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M11.5 1.9a1.4 1.4 0 0 1 2 2L4.8 12.6l-2.8.6.6-2.8L11.5 1.9Z" strokeLinejoin="round" />
          <path d="M10 3.4l2 2" strokeLinecap="round" />
        </svg>
        Personalizar
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-72 rounded-lg border border-border bg-raised p-3 shadow-lg shadow-black/10">
          <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">Campos de la ficha</p>
          <div className="flex flex-col gap-1">
            {order
              .filter((key) => catalog.some((f) => f.key === key))
              .map((key) => {
                const field = catalog.find((f) => f.key === key)!;
                return (
                  <div key={key} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-sunken">
                    <input type="checkbox" checked onChange={() => toggle(key)} />
                    <span className="flex-1 text-ink">{field.label}</span>
                    <button type="button" onClick={() => move(key, -1)} className="text-ink-soft hover:text-ink">
                      ↑
                    </button>
                    <button type="button" onClick={() => move(key, 1)} className="text-ink-soft hover:text-ink">
                      ↓
                    </button>
                  </div>
                );
              })}
          </div>

          {catalog.some((f) => !order.includes(f.key)) && (
            <>
              <p className="mt-3 mb-1 text-xs font-semibold tracking-wide text-ink-mute uppercase">Ocultos</p>
              <div className="flex flex-col gap-1">
                {catalog
                  .filter((f) => !order.includes(f.key))
                  .map((field) => (
                    <label key={field.key} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm text-ink-mute hover:bg-sunken">
                      <input type="checkbox" checked={false} onChange={() => toggle(field.key)} />
                      {field.label}
                    </label>
                  ))}
              </div>
            </>
          )}

          <form
            action={async (formData) => {
              await saveDetailFields(formData);
              setOpen(false);
            }}
            className="mt-3 flex justify-end gap-2"
          >
            <input type="hidden" name="table_name" value={tableName} />
            <input type="hidden" name="fields" value={JSON.stringify(order)} />
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-soft hover:underline">
              Cancelar
            </button>
            <button type="submit" className="rounded-md bg-calm px-3 py-1 text-sm text-base transition-colors hover:bg-calm-hover">
              Guardar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
