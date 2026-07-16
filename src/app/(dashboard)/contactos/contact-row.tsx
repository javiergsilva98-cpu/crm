"use client";

import { useState, type MouseEvent } from "react";
import { updateContact, deleteContact } from "./actions";
import { CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/channels";
import { ExpandableDetail } from "@/components/expandable-detail";
import type { DetailField } from "@/lib/detail-fields";
import { formatDateTime } from "@/lib/format";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

function ignoreInteractiveClick(e: MouseEvent<HTMLTableRowElement>) {
  return (e.target as HTMLElement).closest("a, button, input, select, form") !== null;
}

type Contact = {
  id: string;
  nombre: string;
  apellido: string | null;
  full_name: string;
  correo_electronico: string | null;
  numero_telefono: string | null;
  phone_prefix: string | null;
  phone_country: string | null;
  empresa_principal_asociada: string | null;
  fuente_trafico_original: Channel | null;
  desglose_fuente_original_1: string | null;
  source_url: string | null;
  tax_id: string | null;
  fiscal_address: string | null;
  ultimo_contacto: string | null;
  last_activity_by: string | null;
  companies: { nombre_empresa: string } | null;
};

export function ContactRow({
  contact,
  companies,
  lastActivityByEmail,
  detailFields,
  selected,
  onToggleSelect,
}: {
  contact: Contact;
  companies: { id: string; nombre_empresa: string }[];
  lastActivityByEmail: string | null;
  detailFields: DetailField[];
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-border bg-sunken">
        <td className="px-4 py-2" colSpan={8}>
          <form
            action={async (formData) => {
              await updateContact(formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="id" value={contact.id} />
            <input
              name="first_name"
              defaultValue={contact.nombre}
              placeholder="Nombre"
              required
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="last_name"
              defaultValue={contact.apellido ?? ""}
              placeholder="Apellidos"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="email"
              type="email"
              defaultValue={contact.correo_electronico ?? ""}
              placeholder="Email"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="phone_prefix"
              defaultValue={contact.phone_prefix ?? ""}
              placeholder="Prefijo"
              className="w-20 rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="phone"
              defaultValue={contact.numero_telefono ?? ""}
              placeholder="Teléfono"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="phone_country"
              defaultValue={contact.phone_country ?? ""}
              placeholder="País"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <select
              name="company_id"
              defaultValue={contact.empresa_principal_asociada ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Sin empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_empresa}
                </option>
              ))}
            </select>
            <select
              name="source"
              defaultValue={contact.fuente_trafico_original ?? ""}
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
              defaultValue={contact.desglose_fuente_original_1 ?? ""}
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

  const phoneDisplay = contact.numero_telefono ? [contact.phone_prefix, contact.numero_telefono].filter(Boolean).join(" ") : null;

  const values: Record<string, string | null> = {
    correo_electronico: contact.correo_electronico,
    numero_telefono: phoneDisplay,
    phone_country: contact.phone_country,
    company: contact.companies?.nombre_empresa ?? null,
    fuente_trafico_original: contact.fuente_trafico_original ? CHANNEL_LABELS[contact.fuente_trafico_original] : null,
    desglose_fuente_original_1: contact.desglose_fuente_original_1,
    source_url: contact.source_url,
    tax_id: contact.tax_id,
    fiscal_address: contact.fiscal_address,
    ultimo_contacto: contact.ultimo_contacto
      ? `${formatDateTime(contact.ultimo_contacto)}${lastActivityByEmail ? ` · ${lastActivityByEmail}` : ""}`
      : null,
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
      <td className="px-4 py-2">
        <input type="checkbox" checked={selected} onChange={onToggleSelect} aria-label={`Seleccionar ${contact.full_name}`} />
      </td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">{contact.full_name}</td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">{contact.correo_electronico}</td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap" title={phoneDisplay ?? undefined}>
        {phoneDisplay}
      </td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">{contact.companies?.nombre_empresa}</td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">
        {contact.fuente_trafico_original ? (
          <span title={[contact.desglose_fuente_original_1, contact.source_url].filter(Boolean).join(" · ") || undefined}>
            {CHANNEL_LABELS[contact.fuente_trafico_original]}
          </span>
        ) : (
          <span className="text-ink-mute">—</span>
        )}
      </td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink-soft">
        {contact.ultimo_contacto ? (
          <span title={lastActivityByEmail ? `Por ${lastActivityByEmail}` : undefined}>
            {formatDateTime(contact.ultimo_contacto)}
            {lastActivityByEmail && <span className="text-ink-mute"> · {lastActivityByEmail}</span>}
          </span>
        ) : (
          <span className="text-ink-mute">—</span>
        )}
      </td>
      <td className="sticky right-0 border-l border-border bg-raised px-4 py-2 text-right">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-ink-soft hover:underline">
            Editar
          </button>
          <form action={deleteContact}>
            <input type="hidden" name="id" value={contact.id} />
            <ConfirmSubmitButton
              confirmMessage={`¿Eliminar a ${contact.full_name}? Esta acción no se puede deshacer.`}
              className="text-danger hover:underline"
            >
              Eliminar
            </ConfirmSubmitButton>
          </form>
        </div>
      </td>
    </tr>
    {expanded && (
      <ExpandableDetail
        colSpan={8}
        fields={detailFields.map((f) => ({ key: f.key, label: f.label, value: values[f.key] }))}
      />
    )}
    </>
  );
}
