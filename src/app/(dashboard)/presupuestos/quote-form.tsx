"use client";

import { useState } from "react";
import { calculateTotals, type InvoiceItem } from "@/lib/invoice";

type Option = { id: string; label: string };
type Service = { id: string; name: string; description: string | null; unit_price: number };
type Template = { id: string; name: string };

export function QuoteForm({
  action,
  quoteId,
  companies,
  contacts,
  opportunities,
  templates,
  services,
  initial,
}: {
  action: (formData: FormData) => void;
  quoteId?: string;
  companies: Option[];
  contacts: Option[];
  opportunities: Option[];
  templates: Template[];
  services?: Service[];
  initial?: {
    company_id: string | null;
    contact_id: string | null;
    opportunity_id: string | null;
    template_id: string | null;
    issue_date: string;
    valid_until: string | null;
    tax_rate: number;
    notes: string | null;
    items: InvoiceItem[];
  };
}) {
  const [items, setItems] = useState<InvoiceItem[]>(
    initial?.items?.length ? initial.items : [{ description: "", quantity: 1, unit_price: 0 }],
  );
  const [taxRate, setTaxRate] = useState(initial?.tax_rate ?? 21);

  const { subtotal, taxAmount, total } = calculateTotals(items, taxRate);

  function updateItem(index: number, patch: Partial<InvoiceItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <form action={action} className="rounded-lg border border-border bg-raised p-6">
      {quoteId && <input type="hidden" name="id" value={quoteId} />}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-ink-soft">Empresa</label>
          <select
            name="company_id"
            required
            defaultValue={initial?.company_id ?? ""}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
          >
            <option value="">Selecciona una empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink-soft">Contacto (opcional)</label>
          <select
            name="contact_id"
            defaultValue={initial?.contact_id ?? ""}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
          >
            <option value="">Sin contacto</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink-soft">Oportunidad (opcional)</label>
          <select
            name="opportunity_id"
            defaultValue={initial?.opportunity_id ?? ""}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
          >
            <option value="">Sin oportunidad</option>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink-soft">Plantilla (opcional)</label>
          <select
            name="template_id"
            defaultValue={initial?.template_id ?? ""}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
          >
            <option value="">Plantilla por defecto</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink-soft">Fecha de emisión</label>
          <input
            name="issue_date"
            type="date"
            defaultValue={initial?.issue_date ?? new Date().toISOString().slice(0, 10)}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink-soft">Válido hasta</label>
          <input
            name="valid_until"
            type="date"
            defaultValue={initial?.valid_until ?? ""}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-ink">Conceptos</h2>
      <div className="mb-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center">
            {services && services.length > 0 && (
              <select
                aria-label="Rellenar desde un servicio"
                defaultValue=""
                onChange={(e) => {
                  const service = services.find((s) => s.id === e.target.value);
                  if (service) {
                    updateItem(i, { description: service.description || service.name, unit_price: service.unit_price });
                  }
                }}
                className="w-full rounded-md border border-border bg-base px-2 py-2 text-sm text-ink-soft sm:w-40"
              >
                <option value="">Desde servicio…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            <input
              name={`item_description_${i}`}
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              placeholder="Concepto"
              required
              className="w-full flex-1 rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
            />
            <input
              name={`item_quantity_${i}`}
              type="number"
              step="0.01"
              min="0"
              value={item.quantity}
              onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
              placeholder="Cantidad"
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-24"
            />
            <input
              name={`item_unit_price_${i}`}
              type="number"
              step="0.01"
              min="0"
              value={item.unit_price}
              onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
              placeholder="Precio"
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-28"
            />
            <span className="w-full text-sm text-ink-soft sm:w-24 sm:text-right">
              {(item.quantity * item.unit_price).toFixed(2)}€
            </span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-sm text-danger hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        ))}
        <input type="hidden" name="item_count" value={items.length} />
      </div>
      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }])}
        className="mb-6 text-sm text-ink-soft hover:text-ink hover:underline"
      >
        + Añadir concepto
      </button>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-ink-soft">Notas (opcional)</label>
          <textarea
            name="notes"
            defaultValue={initial?.notes ?? ""}
            rows={3}
            className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
          />
        </div>
        <div className="rounded-md border border-border bg-sunken p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-ink-soft">IVA (%)</label>
            <input
              name="tax_rate"
              type="number"
              step="0.01"
              min="0"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-20 rounded-md border border-border bg-base px-2 py-1 text-right text-sm text-ink"
            />
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Base imponible</span>
            <span>{subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>IVA</span>
            <span>{taxAmount.toFixed(2)}€</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-ink">
            <span>Total</span>
            <span>{total.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
        {quoteId ? "Guardar cambios" : "Crear presupuesto"}
      </button>
    </form>
  );
}
