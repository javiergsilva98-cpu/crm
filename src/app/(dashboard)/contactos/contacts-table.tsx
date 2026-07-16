"use client";

import { useState } from "react";
import { ContactRow } from "./contact-row";
import { EmptyStateRow } from "@/components/empty-state";
import { ResizableTh } from "@/components/resizable-th";
import type { DetailField } from "@/lib/detail-fields";
import { CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/channels";
import { toCsv } from "@/lib/csv";
import { bulkDeleteContacts, bulkUpdateContactsCompany, bulkUpdateContactsSource } from "./actions";

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

export function ContactsTable({
  contacts,
  companies,
  profileEmailById,
  detailFields,
  emptyTitle,
  emptyBody,
}: {
  contacts: Contact[];
  companies: { id: string; nombre_empresa: string }[];
  profileEmailById: Map<string, string>;
  detailFields: DetailField[];
  emptyTitle: string;
  emptyBody: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCompany, setBulkCompany] = useState("");
  const [bulkSource, setBulkSource] = useState("");
  const [busy, setBusy] = useState(false);

  const allSelected = contacts.length > 0 && selected.size === contacts.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(contacts.map((c) => c.id)));
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
    const rows = contacts.filter((c) => selected.has(c.id));
    const csv = toCsv(
      ["Nombre", "Apellidos", "Email", "Teléfono", "Empresa", "Canal"],
      rows.map((c) => [
        c.nombre,
        c.apellido ?? "",
        c.correo_electronico,
        [c.phone_prefix, c.numero_telefono].filter(Boolean).join(" "),
        c.companies?.nombre_empresa ?? "",
        c.fuente_trafico_original ? CHANNEL_LABELS[c.fuente_trafico_original] : "",
      ]),
    );
    downloadCsv("contactos_seleccion.csv", csv);
  }

  async function applyBulkCompany() {
    setBusy(true);
    await bulkUpdateContactsCompany(Array.from(selected), bulkCompany || null);
    setBusy(false);
  }

  async function applyBulkSource() {
    setBusy(true);
    await bulkUpdateContactsSource(Array.from(selected), bulkSource || null);
    setBusy(false);
  }

  async function deleteSelection() {
    if (!window.confirm(`¿Eliminar ${selected.size} contacto(s)? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await bulkDeleteContacts(Array.from(selected));
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
            <select value={bulkCompany} onChange={(e) => setBulkCompany(e.target.value)} className="rounded-md border border-border bg-raised px-2 py-1 text-sm">
              <option value="">Sin empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_empresa}
                </option>
              ))}
            </select>
            <button type="button" disabled={busy} onClick={applyBulkCompany} className="rounded-md border border-border bg-raised px-3 py-1 text-sm text-ink-soft hover:text-ink disabled:opacity-50">
              Cambiar empresa
            </button>
          </div>
          <div className="flex items-center gap-1">
            <select value={bulkSource} onChange={(e) => setBulkSource(e.target.value)} className="rounded-md border border-border bg-raised px-2 py-1 text-sm">
              <option value="">Sin canal</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
            <button type="button" disabled={busy} onClick={applyBulkSource} className="rounded-md border border-border bg-raised px-3 py-1 text-sm text-ink-soft hover:text-ink disabled:opacity-50">
              Cambiar canal
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
              <ResizableTh tableId="contactos" columnKey="full_name" defaultWidth={160}>Nombre</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="email" defaultWidth={200}>Email</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="phone" defaultWidth={130}>Teléfono</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="company" defaultWidth={160}>Empresa</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="source" defaultWidth={120}>Canal</ResizableTh>
              <ResizableTh tableId="contactos" columnKey="last_activity" defaultWidth={160}>Última actividad</ResizableTh>
              <th className="sticky right-0 border-l border-border bg-sunken px-4 py-2.5" style={{ width: 96 }} />
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                companies={companies}
                lastActivityByEmail={contact.last_activity_by ? (profileEmailById.get(contact.last_activity_by) ?? null) : null}
                detailFields={detailFields}
                selected={selected.has(contact.id)}
                onToggleSelect={() => toggleOne(contact.id)}
              />
            ))}
            {contacts.length === 0 && <EmptyStateRow colSpan={8} title={emptyTitle} body={emptyBody} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}
