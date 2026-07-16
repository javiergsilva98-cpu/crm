"use client";

import { useState, type MouseEvent } from "react";
import { updateContact, deleteContact } from "./actions";
import { CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/channels";
import { ExpandableDetail } from "@/components/expandable-detail";
import type { DetailField } from "@/lib/detail-fields";
import { formatDateTime } from "@/lib/format";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEGAL_BASES,
  LEGAL_BASIS_LABELS,
} from "@/lib/contact-lifecycle";

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
  numero_telefono_movil: string | null;
  phone_prefix: string | null;
  phone_country: string | null;
  empresa_principal_asociada: string | null;
  nombre_empresa: string | null;
  fuente_trafico_original: Channel | null;
  ultima_fuente_trafico: Channel | null;
  desglose_fuente_original_1: string | null;
  desglose_fuente_original_2: string | null;
  source_url: string | null;
  id_clic_google_ads_gclid: string | null;
  id_clic_facebook_fbclid: string | null;
  etapa_ciclo_vida: string | null;
  estado_lead: string | null;
  cancelacion_suscripcion_todos_correos: boolean;
  tax_id: string | null;
  fiscal_address: string | null;
  ultimo_contacto: string | null;
  fecha_ultima_modificacion: string | null;
  last_activity_by: string | null;
  ciudad: string | null;
  estado_region: string | null;
  codigo_postal: string | null;
  pais_region: string | null;
  direccion: string | null;
  cargo: string | null;
  industria: string | null;
  url_sitio_web: string | null;
  url_linkedin: string | null;
  mensaje: string | null;
  correos_electronicos_adicionales: string | null;
  contacto_sin_gestionar: boolean;
  fuente_registro: string | null;
  base_juridica_tratamiento_datos: string | null;
  desglose_ultima_fuente_1: string | null;
  desglose_ultima_fuente_2: string | null;
  fecha_ultima_fuente_trafico: string | null;
  primera_conversion: string | null;
  fecha_primera_conversion: string | null;
  conversion_reciente: string | null;
  fecha_conversion_reciente: string | null;
  fecha_siguiente_actividad: string | null;
  direccion_correo_no_valida: boolean;
  fecha_cierre_se_hizo_cliente: string | null;
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
            <input
              name="mobile_phone"
              defaultValue={contact.numero_telefono_movil ?? ""}
              placeholder="Teléfono móvil"
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
            <input
              name="company_name"
              defaultValue={contact.nombre_empresa ?? ""}
              placeholder="Nombre de empresa (texto libre)"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
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
            <select
              name="latest_source"
              defaultValue={contact.ultima_fuente_trafico ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Última fuente de tráfico</option>
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
              name="source_detail_2"
              defaultValue={contact.desglose_fuente_original_2 ?? ""}
              placeholder="Detalle del canal 2"
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
              name="gclid"
              defaultValue={contact.id_clic_google_ads_gclid ?? ""}
              placeholder="GCLID (Google Ads)"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="fbclid"
              defaultValue={contact.id_clic_facebook_fbclid ?? ""}
              placeholder="FBCLID (Meta)"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <select
              name="lifecycle_stage"
              defaultValue={contact.etapa_ciclo_vida ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Etapa del ciclo de vida</option>
              {LIFECYCLE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {LIFECYCLE_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              name="lead_status"
              defaultValue={contact.estado_lead ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Estado del lead</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-ink-soft">
              <input type="checkbox" name="email_optout" defaultChecked={contact.cancelacion_suscripcion_todos_correos} />
              Cancelar suscripción a todos los correos
            </label>
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
            <input
              name="address"
              defaultValue={contact.direccion ?? ""}
              placeholder="Dirección"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="city"
              defaultValue={contact.ciudad ?? ""}
              placeholder="Ciudad"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="state"
              defaultValue={contact.estado_region ?? ""}
              placeholder="Provincia/CCAA"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="zip"
              defaultValue={contact.codigo_postal ?? ""}
              placeholder="Código postal"
              className="w-28 rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="country"
              defaultValue={contact.pais_region ?? ""}
              placeholder="País"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="jobtitle"
              defaultValue={contact.cargo ?? ""}
              placeholder="Cargo"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="contact_industry"
              defaultValue={contact.industria ?? ""}
              placeholder="Industria"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="contact_website"
              type="url"
              defaultValue={contact.url_sitio_web ?? ""}
              placeholder="URL del sitio web"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="linkedin_url"
              type="url"
              defaultValue={contact.url_linkedin ?? ""}
              placeholder="URL de LinkedIn"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="additional_emails"
              defaultValue={contact.correos_electronicos_adicionales ?? ""}
              placeholder="Correos adicionales"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="message"
              defaultValue={contact.mensaje ?? ""}
              placeholder="Mensaje"
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <select
              name="legal_basis"
              defaultValue={contact.base_juridica_tratamiento_datos ?? ""}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="">Base jurídica (RGPD)</option>
              {LEGAL_BASES.map((b) => (
                <option key={b} value={b}>
                  {LEGAL_BASIS_LABELS[b]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-sm text-ink-soft">
              Siguiente actividad
              <input
                name="next_activity_date"
                type="date"
                defaultValue={contact.fecha_siguiente_actividad ? contact.fecha_siguiente_actividad.slice(0, 10) : ""}
                className="rounded-md border border-border px-2 py-1 text-sm"
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-ink-soft">
              <input type="checkbox" name="bad_email" defaultChecked={contact.direccion_correo_no_valida} />
              Correo no válido
            </label>
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
    numero_telefono_movil: contact.numero_telefono_movil,
    phone_country: contact.phone_country,
    company: contact.companies?.nombre_empresa ?? null,
    nombre_empresa: contact.nombre_empresa,
    fuente_trafico_original: contact.fuente_trafico_original ? CHANNEL_LABELS[contact.fuente_trafico_original] : null,
    ultima_fuente_trafico: contact.ultima_fuente_trafico ? CHANNEL_LABELS[contact.ultima_fuente_trafico] : null,
    desglose_fuente_original_1: contact.desglose_fuente_original_1,
    desglose_fuente_original_2: contact.desglose_fuente_original_2,
    source_url: contact.source_url,
    id_clic_google_ads_gclid: contact.id_clic_google_ads_gclid,
    id_clic_facebook_fbclid: contact.id_clic_facebook_fbclid,
    etapa_ciclo_vida: contact.etapa_ciclo_vida ? LIFECYCLE_STAGE_LABELS[contact.etapa_ciclo_vida as keyof typeof LIFECYCLE_STAGE_LABELS] : null,
    estado_lead: contact.estado_lead ? LEAD_STATUS_LABELS[contact.estado_lead as keyof typeof LEAD_STATUS_LABELS] : null,
    cancelacion_suscripcion_todos_correos: contact.cancelacion_suscripcion_todos_correos ? "Sí" : "No",
    tax_id: contact.tax_id,
    fiscal_address: contact.fiscal_address,
    ultimo_contacto: contact.ultimo_contacto
      ? `${formatDateTime(contact.ultimo_contacto)}${lastActivityByEmail ? ` · ${lastActivityByEmail}` : ""}`
      : null,
    fecha_ultima_modificacion: contact.fecha_ultima_modificacion ? formatDateTime(contact.fecha_ultima_modificacion) : null,
    ciudad: contact.ciudad,
    estado_region: contact.estado_region,
    codigo_postal: contact.codigo_postal,
    pais_region: contact.pais_region,
    direccion: contact.direccion,
    cargo: contact.cargo,
    industria: contact.industria,
    url_sitio_web: contact.url_sitio_web,
    url_linkedin: contact.url_linkedin,
    mensaje: contact.mensaje,
    correos_electronicos_adicionales: contact.correos_electronicos_adicionales,
    contacto_sin_gestionar: contact.contacto_sin_gestionar ? "Sí" : "No",
    fuente_registro: contact.fuente_registro,
    base_juridica_tratamiento_datos: contact.base_juridica_tratamiento_datos
      ? LEGAL_BASIS_LABELS[contact.base_juridica_tratamiento_datos as keyof typeof LEGAL_BASIS_LABELS]
      : null,
    desglose_ultima_fuente_1: contact.desglose_ultima_fuente_1,
    desglose_ultima_fuente_2: contact.desglose_ultima_fuente_2,
    fecha_ultima_fuente_trafico: contact.fecha_ultima_fuente_trafico ? formatDateTime(contact.fecha_ultima_fuente_trafico) : null,
    primera_conversion: contact.primera_conversion,
    fecha_primera_conversion: contact.fecha_primera_conversion ? formatDateTime(contact.fecha_primera_conversion) : null,
    conversion_reciente: contact.conversion_reciente,
    fecha_conversion_reciente: contact.fecha_conversion_reciente ? formatDateTime(contact.fecha_conversion_reciente) : null,
    fecha_siguiente_actividad: contact.fecha_siguiente_actividad ? new Date(contact.fecha_siguiente_actividad).toLocaleDateString("es-ES") : null,
    direccion_correo_no_valida: contact.direccion_correo_no_valida ? "Sí" : "No",
    fecha_cierre_se_hizo_cliente: contact.fecha_cierre_se_hizo_cliente ? formatDateTime(contact.fecha_cierre_se_hizo_cliente) : null,
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
