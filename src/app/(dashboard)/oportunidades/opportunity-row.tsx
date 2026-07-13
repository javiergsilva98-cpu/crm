"use client";

import { useState } from "react";
import { updateOpportunity, deleteOpportunity } from "./actions";
import { StageSelect } from "./stage-select";

type Opportunity = {
  id: string;
  title: string;
  stage: string;
  amount: number;
  company_id: string | null;
  companies: { name: string } | null;
};

export function OpportunityRow({
  opportunity,
  companies,
}: {
  opportunity: Opportunity;
  companies: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-gray-100 bg-gray-50">
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
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              defaultValue={opportunity.amount}
              className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <select
              name="company_id"
              defaultValue={opportunity.company_id ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">Sin empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md bg-gray-900 px-3 py-1 text-sm text-white">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-gray-600 underline"
            >
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-2">{opportunity.title}</td>
      <td className="px-4 py-2">{opportunity.companies?.name}</td>
      <td className="px-4 py-2">${Number(opportunity.amount).toLocaleString()}</td>
      <td className="px-4 py-2">
        <StageSelect id={opportunity.id} stage={opportunity.stage} />
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-gray-600 hover:underline">
            Editar
          </button>
          <form action={deleteOpportunity}>
            <input type="hidden" name="id" value={opportunity.id} />
            <button type="submit" className="text-red-600 hover:underline">
              Eliminar
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
