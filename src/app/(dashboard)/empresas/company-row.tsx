"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { updateCompany, deleteCompany } from "./actions";
import { ExpandableDetail } from "@/components/expandable-detail";
import type { DetailField } from "@/lib/detail-fields";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS, LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/contact-lifecycle";
import { COMPANY_TYPES, COMPANY_TYPE_LABELS } from "@/lib/company-fields";
import { CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/channels";
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
  direccion: string | null;
  direccion_2: string | null;
  ciudad: string | null;
  estado_region: string | null;
  codigo_postal: string | null;
  pais_region: string | null;
  descripcion: string | null;
  industria: string | null;
  ingresos_anuales: number | null;
  numero_empleados: number | null;
  pagina_empresa_linkedin: string | null;
  tipo: string | null;
  fuente_registro: string | null;
  estado_oportunidad_venta: string | null;
  fecha_cierre_se_hizo_cliente: string | null;
  fuente_trafico_original: Channel | null;
  ultima_fuente_trafico: Channel | null;
  desglose_fuente_original_1: string | null;
  desglose_fuente_original_2: string | null;
  datos_ultima_fuente_1: string | null;
  datos_ultima_fuente_2: string | null;
  fecha_ultima_fuente_trafico: string | null;
  primera_conversion: string | null;
  fecha_primera_conversion: string | null;
  conversion_reciente: string | null;
  fecha_conversion_reciente: string | null;
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
            <input
              name="address"
              defaultValue={company.direccion ?? ""}
              placeholder="Dirección"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="address2"
              defaultValue={company.direccion_2 ?? ""}
              placeholder="Dirección 2"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="city"
              defaultValue={company.ciudad ?? ""}
              placeholder="Ciudad"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="state"
              defaultValue={company.estado_region ?? ""}
              placeholder="Provincia/CCAA"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="zip"
              defaultValue={company.codigo_postal ?? ""}
              placeholder="Código postal"
              className="w-28 rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="country"
              defaultValue={company.pais_region ?? ""}
              placeholder="País"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="description"
              defaultValue={company.descripcion ?? ""}
              placeholder="Descripción"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="company_industry_text"
              defaultValue={company.industria ?? ""}
              placeholder="Industria (CNAE/texto libre)"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="annual_revenue"
              type="number"
              step="0.01"
              defaultValue={company.ingresos_anuales ?? ""}
              placeholder="Ingresos anuales"
              className="w-32 rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="num_employees"
              type="number"
              defaultValue={company.numero_empleados ?? ""}
              placeholder="Nº empleados"
              className="w-28 rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="linkedin_page"
              type="url"
              defaultValue={company.pagina_empresa_linkedin ?? ""}
              placeholder="Página de LinkedIn"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <select
              name="company_type"
              defaultValue={company.tipo ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Tipo</option>
              {COMPANY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {COMPANY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              name="lead_status"
              defaultValue={company.estado_oportunidad_venta ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Estado de la oportunidad de venta</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              name="source"
              defaultValue={company.fuente_trafico_original ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Fuente de tráfico original</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
            <select
              name="latest_source"
              defaultValue={company.ultima_fuente_trafico ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Última fuente de tráfico</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
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
    direccion: company.direccion,
    direccion_2: company.direccion_2,
    ciudad: company.ciudad,
    estado_region: company.estado_region,
    codigo_postal: company.codigo_postal,
    pais_region: company.pais_region,
    descripcion: company.descripcion,
    industria: company.industria,
    ingresos_anuales: company.ingresos_anuales !== null ? `${company.ingresos_anuales.toLocaleString("es-ES")}€` : null,
    numero_empleados: company.numero_empleados !== null ? String(company.numero_empleados) : null,
    pagina_empresa_linkedin: company.pagina_empresa_linkedin,
    tipo: company.tipo ? COMPANY_TYPE_LABELS[company.tipo as keyof typeof COMPANY_TYPE_LABELS] : null,
    fuente_registro: company.fuente_registro,
    estado_oportunidad_venta: company.estado_oportunidad_venta
      ? LEAD_STATUS_LABELS[company.estado_oportunidad_venta as keyof typeof LEAD_STATUS_LABELS]
      : null,
    fecha_cierre_se_hizo_cliente: company.fecha_cierre_se_hizo_cliente ? formatDateTime(company.fecha_cierre_se_hizo_cliente) : null,
    fuente_trafico_original: company.fuente_trafico_original ? CHANNEL_LABELS[company.fuente_trafico_original] : null,
    ultima_fuente_trafico: company.ultima_fuente_trafico ? CHANNEL_LABELS[company.ultima_fuente_trafico] : null,
    desglose_fuente_original_1: company.desglose_fuente_original_1,
    desglose_fuente_original_2: company.desglose_fuente_original_2,
    datos_ultima_fuente_1: company.datos_ultima_fuente_1,
    datos_ultima_fuente_2: company.datos_ultima_fuente_2,
    fecha_ultima_fuente_trafico: company.fecha_ultima_fuente_trafico ? formatDateTime(company.fecha_ultima_fuente_trafico) : null,
    primera_conversion: company.primera_conversion,
    fecha_primera_conversion: company.fecha_primera_conversion ? formatDateTime(company.fecha_primera_conversion) : null,
    conversion_reciente: company.conversion_reciente,
    fecha_conversion_reciente: company.fecha_conversion_reciente ? formatDateTime(company.fecha_conversion_reciente) : null,
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
