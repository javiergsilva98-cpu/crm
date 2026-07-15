"use client";

import { useState } from "react";
import { CompanyRow } from "./company-row";
import { EmptyStateRow } from "@/components/empty-state";
import { ResizableTh } from "@/components/resizable-th";
import type { DetailField } from "@/lib/detail-fields";
import { toCsv } from "@/lib/csv";
import { bulkDeleteCompanies, bulkUpdateCompaniesIndustry } from "./actions";

type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  tax_id: string | null;
  fiscal_address: string | null;
  created_at: string;
};

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CompaniesTable({
  companies,
  detailFields,
  emptyTitle,
  emptyBody,
}: {
  companies: Company[];
  detailFields: DetailField[];
  emptyTitle: string;
  emptyBody: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkIndustry, setBulkIndustry] = useState("");
  const [busy, setBusy] = useState(false);

  const allSelected = companies.length > 0 && selected.size === companies.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(companies.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportSelection() {
    const rows = companies.filter((c) => selected.has(c.id));
    const csv = toCsv(
      ["Nombre", "Sitio web", "Industria"],
      rows.map((c) => [c.name, c.website ?? "", c.industry ?? ""]),
    );
    downloadCsv("empresas_seleccion.csv", csv);
  }

  async function applyBulkIndustry() {
    setBusy(true);
    await bulkUpdateCompaniesIndustry(Array.from(selected), bulkIndustry || null);
    setBusy(false);
  }

  async function deleteSelection() {
    if (!window.confirm(`¿Eliminar ${selected.size} empresa(s)? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await bulkDeleteCompanies(Array.from(selected));
    setSelected(new Set());
    setBusy(false);
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border-strong bg-sunken p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-sm font-medium text-ink">{selected.size} seleccionado(s)</span>
          <button type="button" onClick={exportSelection} className="rounded-md border border-border bg-raised px-3 py-1 text-sm text-ink-soft hover:text-ink">
            Exportar selección
          </button>
          <div className="flex items-center gap-1">
            <input
              value={bulkIndustry}
              onChange={(e) => setBulkIndustry(e.target.value)}
              placeholder="Nueva industria"
              className="w-40 rounded-md border border-border bg-raised px-2 py-1 text-sm"
            />
            <button type="button" disabled={busy} onClick={applyBulkIndustry} className="rounded-md border border-border bg-raised px-3 py-1 text-sm text-ink-soft hover:text-ink disabled:opacity-50">
              Cambiar industria
            </button>
          </div>
          <button type="button" disabled={busy} onClick={deleteSelection} className="rounded-md border border-border bg-raised px-3 py-1 text-sm text-danger hover:border-danger disabled:opacity-50">
            Eliminar seleccionados
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm" style={{ tableLayout: "fixed" }}>
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <th className="px-4 py-2.5" style={{ width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Seleccionar todos" />
              </th>
              <ResizableTh tableId="empresas" columnKey="name" defaultWidth={220}>Nombre</ResizableTh>
              <ResizableTh tableId="empresas" columnKey="website" defaultWidth={220}>Sitio web</ResizableTh>
              <ResizableTh tableId="empresas" columnKey="industry" defaultWidth={180}>Industria</ResizableTh>
              <th className="sticky right-0 border-l border-border bg-sunken px-4 py-2.5" style={{ width: 96 }} />
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <CompanyRow
                key={company.id}
                company={company}
                detailFields={detailFields}
                selected={selected.has(company.id)}
                onToggleSelect={() => toggleOne(company.id)}
              />
            ))}
            {companies.length === 0 && <EmptyStateRow colSpan={5} title={emptyTitle} body={emptyBody} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}
