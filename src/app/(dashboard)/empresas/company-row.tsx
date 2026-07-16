"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { updateCompany, deleteCompany } from "./actions";
import { ExpandableDetail } from "@/components/expandable-detail";
import type { DetailField } from "@/lib/detail-fields";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS } from "@/lib/contact-lifecycle";
import { formatDateTime } from "@/lib/format";

type Company = {
  id: string;
  nombre_empresa: string;
  nombre_dominio_empresa: string | null;
  industry: string | null;
  numero_telefono: string | null;
  etapa_ciclo_vida: string | null;
  ultimo_contacto: string | null;
  tax_id: string | null;
  fiscal_address: string | null;
  fecha_creacion: string;
  fecha_ultima_modificacion: string | null;
};

function ignoreInteractiveClick(e: MouseEvent<HTMLTableRowElement>) {
  return (e.target as HTMLElement).closest("a, button, input, select, form") !== null;
}

export function CompanyRow({
  company,
  detailFields,
  selected,
  onToggleSelect,
}: {
  company: Company;
  detailFields: DetailField[];
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-border bg-sunken">
        <td className="px-4 py-2" colSpan={5}>
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
              defaultValue={company.nombre_empresa}
              required
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="website"
              defaultValue={company.nombre_dominio_empresa ?? ""}
              placeholder="Sitio web (ej. miempresa.com)"
              pattern="^(https?:\/\/)?[\w-]+(\.[\w-]+)+.*$"
              title="Escribe un dominio válido, ej. miempresa.com o https://miempresa.com"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="industry"
              defaultValue={company.industry ?? ""}
              placeholder="Industria"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="phone"
              defaultValue={company.numero_telefono ?? ""}
              placeholder="Número de teléfono"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <select
              name="lifecycle_stage"
              defaultValue={company.etapa_ciclo_vida ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Etapa del ciclo de vida</option>
              {LIFECYCLE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {LIFECYCLE_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
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
    nombre_dominio_empresa: company.nombre_dominio_empresa,
    industry: company.industry,
    numero_telefono: company.numero_telefono,
    etapa_ciclo_vida: company.etapa_ciclo_vida
      ? LIFECYCLE_STAGE_LABELS[company.etapa_ciclo_vida as keyof typeof LIFECYCLE_STAGE_LABELS]
      : null,
    ultimo_contacto: company.ultimo_contacto ? formatDateTime(company.ultimo_contacto) : null,
    tax_id: company.tax_id,
    fiscal_address: company.fiscal_address,
    fecha_creacion: new Date(company.fecha_creacion).toLocaleDateString("es-ES"),
    fecha_ultima_modificacion: company.fecha_ultima_modificacion ? formatDateTime(company.fecha_ultima_modificacion) : null,
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
          <input type="checkbox" checked={selected} onChange={onToggleSelect} aria-label={`Seleccionar ${company.nombre_empresa}`} />
        </td>
        <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">
          <Link href={`/empresas/${company.id}`} className="text-ink hover:underline">
            {company.nombre_empresa}
          </Link>
        </td>
        <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">{company.nombre_dominio_empresa}</td>
        <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap">{company.industry}</td>
        <td className="sticky right-0 border-l border-border bg-raised px-4 py-2 text-right">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(true)} className="text-ink-soft hover:underline">
              Editar
            </button>
            <form action={deleteCompany}>
              <input type="hidden" name="id" value={company.id} />
              <ConfirmSubmitButton
                confirmMessage={`¿Eliminar ${company.nombre_empresa}? Esta acción no se puede deshacer.`}
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
          colSpan={5}
          fields={detailFields.map((f) => ({ key: f.key, label: f.label, value: values[f.key] }))}
        />
      )}
    </>
  );
}
