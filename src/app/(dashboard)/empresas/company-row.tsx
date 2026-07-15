"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { updateCompany, deleteCompany } from "./actions";
import { ExpandableDetail } from "@/components/expandable-detail";
import type { DetailField } from "@/lib/detail-fields";

type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  tax_id: string | null;
  fiscal_address: string | null;
  created_at: string;
};

function ignoreInteractiveClick(e: MouseEvent<HTMLTableRowElement>) {
  return (e.target as HTMLElement).closest("a, button, input, select, form") !== null;
}

export function CompanyRow({ company, detailFields }: { company: Company; detailFields: DetailField[] }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-border bg-sunken">
        <td className="px-4 py-2" colSpan={4}>
          <form
            action={async (formData) => {
              await updateCompany(formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="id" value={company.id} />
            <input
              name="name"
              defaultValue={company.name}
              required
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="website"
              defaultValue={company.website ?? ""}
              placeholder="Sitio web"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="industry"
              defaultValue={company.industry ?? ""}
              placeholder="Industria"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="tax_id"
              defaultValue={company.tax_id ?? ""}
              placeholder="NIF / CIF"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="fiscal_address"
              defaultValue={company.fiscal_address ?? ""}
              placeholder="Dirección fiscal"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
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
    website: company.website,
    industry: company.industry,
    tax_id: company.tax_id,
    fiscal_address: company.fiscal_address,
    created_at: new Date(company.created_at).toLocaleDateString("es-ES"),
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
        <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">
          <Link href={`/empresas/${company.id}`} className="text-ink hover:underline">
            {company.name}
          </Link>
        </td>
        <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">{company.website}</td>
        <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">{company.industry}</td>
        <td className="px-4 py-2 text-right">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(true)} className="text-ink-soft hover:underline">
              Editar
            </button>
            <form action={deleteCompany}>
              <input type="hidden" name="id" value={company.id} />
              <button type="submit" className="text-danger hover:underline">
                Eliminar
              </button>
            </form>
          </div>
        </td>
      </tr>
      {expanded && (
        <ExpandableDetail
          colSpan={4}
          fields={detailFields.map((f) => ({ key: f.key, label: f.label, value: values[f.key] }))}
        />
      )}
    </>
  );
}
