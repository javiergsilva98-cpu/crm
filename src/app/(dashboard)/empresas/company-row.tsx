"use client";

import { useState } from "react";
import Link from "next/link";
import { updateCompany, deleteCompany } from "./actions";

type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
};

export function CompanyRow({ company }: { company: Company }) {
  const [editing, setEditing] = useState(false);

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
            <button type="submit" className="rounded-md bg-calm px-3 py-1 text-sm text-ink transition-colors hover:bg-calm-hover">
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

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2">
        <Link href={`/empresas/${company.id}`} className="text-ink hover:underline">
          {company.name}
        </Link>
      </td>
      <td className="px-4 py-2">{company.website}</td>
      <td className="px-4 py-2">{company.industry}</td>
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
  );
}
