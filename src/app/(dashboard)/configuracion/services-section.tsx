"use client";

import { useState } from "react";
import { createService, updateService, deleteService } from "./services-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type Service = {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  tax_rate: number;
};

function ServiceRow({ service }: { service: Service }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-border bg-sunken">
        <td className="px-4 py-2" colSpan={5}>
          <form
            action={async (formData) => {
              await updateService(formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="id" value={service.id} />
            <input name="name" defaultValue={service.name} required className="rounded-md border border-border px-2 py-1 text-sm" />
            <input name="description" defaultValue={service.description ?? ""} placeholder="Descripción" className="rounded-md border border-border px-2 py-1 text-sm" />
            <input name="unit_price" type="number" step="0.01" defaultValue={service.unit_price} className="w-24 rounded-md border border-border px-2 py-1 text-sm" />
            <input name="tax_rate" type="number" step="0.01" defaultValue={service.tax_rate} className="w-20 rounded-md border border-border px-2 py-1 text-sm" />
            <button type="submit" className="rounded-md bg-calm px-3 py-1 text-sm text-base transition-colors hover:bg-calm-hover">
              Guardar
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-ink-soft underline">
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border transition-colors hover:bg-sunken">
      <td className="px-4 py-2 text-ink">{service.name}</td>
      <td className="px-4 py-2 text-ink-soft">{service.description}</td>
      <td className="px-4 py-2 text-ink">{service.unit_price.toLocaleString("es-ES")}€</td>
      <td className="px-4 py-2 text-ink-soft">{service.tax_rate}%</td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-ink-soft hover:underline">
            Editar
          </button>
          <form action={deleteService}>
            <input type="hidden" name="id" value={service.id} />
            <ConfirmSubmitButton confirmMessage={`¿Eliminar el servicio "${service.name}"?`} className="text-danger hover:underline">
              Eliminar
            </ConfirmSubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}

export function ServicesSection({ services }: { services: Service[] }) {
  return (
    <>
      <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Servicios</h2>
      <p className="mb-6 text-sm text-ink-mute">
        Tu catálogo de servicios habituales. Al crear una factura podrás elegir uno para rellenar el concepto y el
        precio automáticamente, en vez de escribirlos a mano cada vez.
      </p>

      <form action={createService} className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-raised p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <input name="name" placeholder="Nombre del servicio" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
        <input name="description" placeholder="Descripción (opcional)" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto sm:flex-1" />
        <input name="unit_price" type="number" step="0.01" placeholder="Precio" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-28" />
        <input name="tax_rate" type="number" step="0.01" defaultValue={21} placeholder="IVA %" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-24" />
        <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
          Agregar
        </button>
      </form>

      {services.length === 0 ? (
        <div className="rounded-lg border border-border bg-raised p-6 text-center">
          <p className="font-heading text-base text-ink">Todavía no tienes servicios</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">Añade el primero arriba.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-strong bg-sunken">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Nombre</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Descripción</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Precio</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">IVA</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
