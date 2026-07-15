"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FILTER_OP_LABELS, type FilterOp, type TableFilter } from "@/lib/table-filters";

export type FilterFieldOption = { key: string; label: string };

export function AdvancedFilters({ fields, initial }: { fields: FilterFieldOption[]; initial: TableFilter[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(initial.length > 0);
  const [rows, setRows] = useState<TableFilter[]>(
    initial.length > 0 ? initial : [{ field: fields[0]?.key ?? "", op: "contains", value: "" }],
  );

  function updateRow(i: number, patch: Partial<TableFilter>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { field: fields[0]?.key ?? "", op: "contains", value: "" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function apply() {
    const valid = rows.filter((r) => r.value.trim() !== "");
    const params = new URLSearchParams(searchParams.toString());
    if (valid.length > 0) params.set("f", JSON.stringify(valid));
    else params.delete("f");
    router.push(`?${params.toString()}`);
  }

  function clearAll() {
    setRows([{ field: fields[0]?.key ?? "", op: "contains", value: "" }]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("f");
    router.push(`?${params.toString()}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-ink-soft hover:text-ink hover:underline"
      >
        Filtros avanzados{initial.length > 0 ? ` (${initial.length})` : ""}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-raised p-3">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={row.field}
                onChange={(e) => updateRow(i, { field: e.target.value })}
                className="rounded-md border border-border bg-base px-2 py-1 text-sm text-ink"
              >
                {fields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={row.op}
                onChange={(e) => updateRow(i, { op: e.target.value as FilterOp })}
                className="rounded-md border border-border bg-base px-2 py-1 text-sm text-ink"
              >
                {(Object.entries(FILTER_OP_LABELS) as [FilterOp, string][]).map(([op, label]) => (
                  <option key={op} value={op}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                value={row.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                placeholder="Valor"
                className="rounded-md border border-border bg-base px-2 py-1 text-sm text-ink"
              />
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} className="text-sm text-danger hover:underline">
                  Quitar
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button type="button" onClick={addRow} className="text-xs text-ink-soft hover:text-ink hover:underline">
              + Añadir filtro
            </button>
            <button type="button" onClick={apply} className="rounded-md bg-calm px-3 py-1 text-sm text-base transition-colors hover:bg-calm-hover">
              Aplicar
            </button>
            {initial.length > 0 && (
              <button type="button" onClick={clearAll} className="text-sm text-ink-mute hover:text-ink hover:underline">
                Quitar filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
