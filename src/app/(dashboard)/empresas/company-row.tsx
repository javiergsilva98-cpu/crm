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
      <tr className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
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
              className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
            />
            <input
              name="website"
              defaultValue={company.website ?? ""}
              placeholder="Sitio web"
              className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
            />
            <input
              name="industry"
              defaultValue={company.industry ?? ""}
              placeholder="Industria"
              className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
            />
            <button type="submit" className="rounded-md bg-gray-900 px-3 py-1 text-sm text-white">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-gray-600 dark:text-gray-400 underline"
            >
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100 dark:border-gray-800">
      <td className="px-4 py-2">
        <Link href={`/empresas/${company.id}`} className="text-gray-900 dark:text-gray-100 hover:underline">
          {company.name}
        </Link>
      </td>
      <td className="px-4 py-2">{company.website}</td>
      <td className="px-4 py-2">{company.industry}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-gray-600 dark:text-gray-400 hover:underline">
            Editar
          </button>
          <form action={deleteCompany}>
            <input type="hidden" name="id" value={company.id} />
            <button type="submit" className="text-red-600 hover:underline">
              Eliminar
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
