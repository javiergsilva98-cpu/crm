"use client";

import { useState } from "react";
import { updateContact, deleteContact } from "./actions";

type Contact = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  companies: { name: string } | null;
};

export function ContactRow({
  contact,
  companies,
}: {
  contact: Contact;
  companies: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <td className="px-4 py-2" colSpan={5}>
          <form
            action={async (formData) => {
              await updateContact(formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="id" value={contact.id} />
            <input
              name="full_name"
              defaultValue={contact.full_name}
              required
              className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
            />
            <input
              name="email"
              type="email"
              defaultValue={contact.email ?? ""}
              placeholder="Email"
              className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
            />
            <input
              name="phone"
              defaultValue={contact.phone ?? ""}
              placeholder="Teléfono"
              className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
            />
            <select
              name="company_id"
              defaultValue={contact.company_id ?? ""}
              className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
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
      <td className="px-4 py-2">{contact.full_name}</td>
      <td className="px-4 py-2">{contact.email}</td>
      <td className="px-4 py-2">{contact.phone}</td>
      <td className="px-4 py-2">{contact.companies?.name}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-gray-600 dark:text-gray-400 hover:underline">
            Editar
          </button>
          <form action={deleteContact}>
            <input type="hidden" name="id" value={contact.id} />
            <button type="submit" className="text-red-600 hover:underline">
              Eliminar
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
