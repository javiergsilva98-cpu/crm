"use client";

import { useState, type MouseEvent } from "react";
import { updateOpportunity, deleteOpportunity } from "./actions";
import { StageSelect } from "./stage-select";
import { ExpandableDetail } from "@/components/expandable-detail";
import type { DetailField } from "@/lib/detail-fields";

type Opportunity = {
  id: string;
  title: string;
  stage: string;
  amount: number;
  notes: string | null;
  created_at: string;
  company_id: string | null;
  contact_id: string | null;
  companies: { name: string } | null;
  contacts: { full_name: string } | null;
};

function ignoreInteractiveClick(e: MouseEvent<HTMLTableRowElement>) {
  return (e.target as HTMLElement).closest("a, button, input, select, form") !== null;
}

export function OpportunityRow({
  opportunity,
  companies,
  detailFields,
}: {
  opportunity: Opportunity;
  companies: { id: string; name: string }[];
  detailFields: DetailField[];
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-border bg-sunken">
        <td className="px-4 py-2" colSpan={5}>
          <form
            action={async (formData) => {
              await updateOpportunity(formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="id" value={opportunity.id} />
            <input
              name="title"
              defaultValue={opportunity.title}
              required
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              defaultValue={opportunity.amount}
              className="w-28 rounded-md border border-border px-2 py-1 text-sm"
            />
            <select
              name="company_id"
              defaultValue={opportunity.company_id ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Sin empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md bg-calm px-3 py-1 text-sm text-base transition-colors hover:bg-calm-hover">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-ink-soft underline"
            >
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  const values: Record<string, string | null> = {
    company: opportunity.companies?.name ?? null,
    contact: opportunity.contacts?.full_name ?? null,
    amount: `$${Number(opportunity.amount).toLocaleString()}`,
    notes: opportunity.notes,
    created_at: new Date(opportunity.created_at).toLocaleDateString("es-ES"),
  };

  return (
    <>
      <tr
        className="cursor-pointer border-t border-border transition-colors hover:bg-sunken"
        onClick={(e) => {
          if (ignoreInteractiveClick(e)) return;
          setExpanded((v) => !v);
        }}
      >
        <td className="px-4 py-2">{opportunity.title}</td>
        <td className="px-4 py-2">{opportunity.companies?.name}</td>
        <td className="px-4 py-2">${Number(opportunity.amount).toLocaleString()}</td>
        <td className="px-4 py-2">
          <StageSelect id={opportunity.id} stage={opportunity.stage} />
        </td>
        <td className="px-4 py-2 text-right">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(true)} className="text-ink-soft hover:underline">
              Editar
            </button>
            <form action={deleteOpportunity}>
              <input type="hidden" name="id" value={opportunity.id} />
              <button type="submit" className="text-danger hover:underline">
                Eliminar
              </button>
            </form>
          </div>
        </td>
      </tr>
      {expanded && (
        <ExpandableDetail
          colSpan={5}
          fields={detailFields.map((f) => ({ key: f.key, label: f.label, value: values[f.key] }))}
        />
      )}
    </>
  );
}
