"use client";

import { useState } from "react";
import { OpportunityRow } from "./opportunity-row";
import { EmptyStateRow } from "@/components/empty-state";
import { ResizableTh } from "@/components/resizable-th";
import type { DetailField } from "@/lib/detail-fields";
import { STAGES, STAGE_LABELS } from "@/lib/stages";
import type { Channel } from "@/lib/channels";
import { toCsv } from "@/lib/csv";
import { bulkDeleteOpportunities, bulkUpdateOpportunitiesStage, bulkUpdateOpportunitiesCompany } from "./actions";

type Opportunity = {
  id: string;
  title: string;
  stage: string;
  amount: number;
  notes: string | null;
  created_at: string;
  company_id: string | null;
  contact_id: string | null;
  fecha_cierre: string | null;
  ultimo_contacto: string | null;
  fuente_trafico_original: Channel | null;
  desglose_fuente_original_1: string | null;
  desglose_fuente_original_2: string | null;
  esta_cerrado_ganado: boolean;
  esta_cerrado_perdido: boolean;
  fecha_ultima_modificacion: string | null;
  tipo_negocio: string | null;
  siguiente_paso: string | null;
  fuente_registro: string | null;
  probabilidad_negocio: number;
  valor_ponderado: number;
  motivo_cierre_perdido: string | null;
  motivo_cierre_ganado: string | null;
  ultima_fuente_trafico: Channel | null;
  desglose_ultima_fuente_1: string | null;
  desglose_ultima_fuente_2: string | null;
  descripcion_negocio: string | null;
  prioridad: string | null;
  categoria_prevision: string | null;
  ingresos_recurrentes_mensuales_mrr: number | null;
  companies: { name: string } | null;
  contacts: { full_name: string } | null;
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

export function OpportunitiesTable({
  opportunities,
  companies,
  detailFields,
  emptyTitle,
  emptyBody,
}: {
  opportunities: Opportunity[];
  companies: { id: string; name: string }[];
  detailFields: DetailField[];
  emptyTitle: string;
  emptyBody: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<string>(STAGES[0]);
  const [bulkCompany, setBulkCompany] = useState("");
  const [busy, setBusy] = useState(false);

  const allSelected = opportunities.length > 0 && selected.size === opportunities.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(opportunities.map((o) => o.id)));
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
    const rows = opportunities.filter((o) => selected.has(o.id));
    const csv = toCsv(
      ["Título", "Empresa", "Monto", "Etapa"],
      rows.map((o) => [o.title, o.companies?.name ?? "", o.amount, STAGE_LABELS[o.stage as keyof typeof STAGE_LABELS] ?? o.stage]),
    );
    downloadCsv("oportunidades_seleccion.csv", csv);
  }

  async function applyBulkStage() {
    setBusy(true);
    await bulkUpdateOpportunitiesStage(Array.from(selected), bulkStage);
    setBusy(false);
  }

  async function applyBulkCompany() {
    setBusy(true);
    await bulkUpdateOpportunitiesCompany(Array.from(selected), bulkCompany || null);
    setBusy(false);
  }

  async function deleteSelection() {
    if (!window.confirm(`¿Eliminar ${selected.size} oportunidad(es)? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await bulkDeleteOpportunities(Array.from(selected));
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
            <select value={bulkStage} onChange={(e) => setBulkStage(e.target.value)} className="rounded-md border border-border bg-raised px-2 py-1 text-sm">
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
            <button type="button" disabled={busy} onClick={applyBulkStage} className="rounded-md border border-border bg-raised px-3 py-1 text-sm text-ink-soft hover:text-ink disabled:opacity-50">
              Cambiar etapa
            </button>
          </div>
          <div className="flex items-center gap-1">
            <select value={bulkCompany} onChange={(e) => setBulkCompany(e.target.value)} className="rounded-md border border-border bg-raised px-2 py-1 text-sm">
              <option value="">Sin empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="button" disabled={busy} onClick={applyBulkCompany} className="rounded-md border border-border bg-raised px-3 py-1 text-sm text-ink-soft hover:text-ink disabled:opacity-50">
              Cambiar empresa
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
              <ResizableTh tableId="oportunidades" columnKey="title" defaultWidth={240}>Título</ResizableTh>
              <ResizableTh tableId="oportunidades" columnKey="company" defaultWidth={180}>Empresa</ResizableTh>
              <ResizableTh tableId="oportunidades" columnKey="amount" defaultWidth={110}>Monto</ResizableTh>
              <ResizableTh tableId="oportunidades" columnKey="stage" defaultWidth={160}>Etapa</ResizableTh>
              <th className="sticky right-0 border-l border-border bg-sunken px-4 py-2.5" style={{ width: 96 }} />
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => (
              <OpportunityRow
                key={opp.id}
                opportunity={opp}
                companies={companies}
                detailFields={detailFields}
                selected={selected.has(opp.id)}
                onToggleSelect={() => toggleOne(opp.id)}
              />
            ))}
            {opportunities.length === 0 && <EmptyStateRow colSpan={6} title={emptyTitle} body={emptyBody} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}
