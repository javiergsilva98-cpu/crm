"use client";

import { useState } from "react";
import { updateContact, deleteContact } from "./actions";
import { CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/channels";

type Contact = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  source: Channel | null;
  source_detail: string | null;
  source_url: string | null;
  tax_id: string | null;
  fiscal_address: string | null;
  last_activity_at: string | null;
  last_activity_by: string | null;
  companies: { name: string } | null;
};

export function ContactRow({
  contact,
  companies,
  lastActivityByEmail,
}: {
  contact: Contact;
  companies: { id: string; name: string }[];
  lastActivityByEmail: string | null;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-border bg-sunken">
        <td className="px-4 py-2" colSpan={7}>
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
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="email"
              type="email"
              defaultValue={contact.email ?? ""}
              placeholder="Email"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="phone"
              defaultValue={contact.phone ?? ""}
              placeholder="Teléfono"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <select
              name="company_id"
              defaultValue={contact.company_id ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Sin empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              name="source"
              defaultValue={contact.source ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">¿De dónde vino?</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              name="source_detail"
              defaultValue={contact.source_detail ?? ""}
              placeholder="Detalle del canal"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="source_url"
              type="url"
              defaultValue={contact.source_url ?? ""}
              placeholder="URL de origen"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="tax_id"
              defaultValue={contact.tax_id ?? ""}
              placeholder="NIF (si es autónomo)"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="fiscal_address"
              defaultValue={contact.fiscal_address ?? ""}
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

  return (
    <tr className="border-t border-border transition-colors hover:bg-sunken">
      <td className="px-4 py-2">{contact.full_name}</td>
      <td className="px-4 py-2">{contact.email}</td>
      <td className="px-4 py-2">{contact.phone}</td>
      <td className="px-4 py-2">{contact.companies?.name}</td>
      <td className="px-4 py-2">
        {contact.source ? (
          <span title={[contact.source_detail, contact.source_url].filter(Boolean).join(" · ") || undefined}>
            {CHANNEL_LABELS[contact.source]}
          </span>
        ) : (
          <span className="text-ink-mute">—</span>
        )}
      </td>
      <td className="px-4 py-2 text-ink-soft">
        {contact.last_activity_at ? (
          <span title={lastActivityByEmail ? `Por ${lastActivityByEmail}` : undefined}>
            {new Date(contact.last_activity_at).toLocaleDateString("es-ES")}
            {lastActivityByEmail && <span className="text-ink-mute"> · {lastActivityByEmail}</span>}
          </span>
        ) : (
          <span className="text-ink-mute">—</span>
        )}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-ink-soft hover:underline">
            Editar
          </button>
          <form action={deleteContact}>
            <input type="hidden" name="id" value={contact.id} />
            <button type="submit" className="text-danger hover:underline">
              Eliminar
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
