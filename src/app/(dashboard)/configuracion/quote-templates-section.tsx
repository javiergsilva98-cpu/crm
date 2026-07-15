"use client";

import { useState } from "react";
import { createQuoteTemplate, updateQuoteTemplate, deleteQuoteTemplate } from "./quote-templates-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type Template = {
  id: string;
  name: string;
  logo_path: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  header_text: string | null;
  footer_text: string | null;
};

const MAX_TEMPLATES = 3;

function TemplateForm({
  template,
  onDone,
}: {
  template?: Template;
  onDone?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <form
      action={async (formData) => {
        setSaving(true);
        setError(null);
        const action = template ? updateQuoteTemplate : createQuoteTemplate;
        if (template) formData.set("id", template.id);
        const result = await action(formData);
        setSaving(false);
        if (result.error) setError(result.error);
        else onDone?.();
      }}
      className="flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="name"
          defaultValue={template?.name ?? ""}
          placeholder="Nombre de la plantilla"
          required
          className="rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
        />
        <div>
          <label className="mb-1 block text-xs text-ink-soft">
            Logo {template?.logo_url && "(déjalo en blanco para no cambiarlo)"} — PNG/JPG/WEBP/SVG, máx. 2 MB
          </label>
          <input
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="w-full text-sm text-ink-soft"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-soft">Color principal</label>
          <input name="primary_color" type="color" defaultValue={template?.primary_color ?? "#4A5B33"} className="h-9 w-full rounded-md border border-border bg-base" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-soft">Color secundario</label>
          <input name="secondary_color" type="color" defaultValue={template?.secondary_color ?? "#C1653F"} className="h-9 w-full rounded-md border border-border bg-base" />
        </div>
        <input
          name="header_text"
          defaultValue={template?.header_text ?? ""}
          placeholder="Texto de cabecera (opcional, ej. tu eslogan)"
          className="rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:col-span-2"
        />
        <textarea
          name="footer_text"
          defaultValue={template?.footer_text ?? ""}
          placeholder="Texto de pie (opcional, ej. condiciones)"
          rows={2}
          className="rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:col-span-2"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover disabled:opacity-50">
          {saving ? "Guardando..." : template ? "Guardar cambios" : "Crear plantilla"}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className="text-sm text-ink-soft hover:underline">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-lg border border-border bg-raised p-4">
        <TemplateForm template={template} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-raised p-4">
      <div className="flex items-center gap-3">
        {template.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={template.logo_url} alt="" className="h-10 w-10 rounded-md object-contain" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sunken text-xs text-ink-mute">Sin logo</div>
        )}
        <div>
          <p className="text-sm font-medium text-ink">{template.name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-border" style={{ background: template.primary_color }} />
            <span className="h-3 w-3 rounded-full border border-border" style={{ background: template.secondary_color }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-sm text-ink-soft hover:underline">
          Editar
        </button>
        <form action={deleteQuoteTemplate}>
          <input type="hidden" name="id" value={template.id} />
          <ConfirmSubmitButton confirmMessage={`¿Eliminar la plantilla "${template.name}"?`} className="text-sm text-danger hover:underline">
            Eliminar
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}

export function QuoteTemplatesSection({ templates }: { templates: Template[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <>
      <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Plantillas de presupuesto</h2>
      <p className="mb-6 text-sm text-ink-mute">
        Hasta {MAX_TEMPLATES} plantillas con tu logo, colores corporativos y textos propios, para elegir cuál usar al
        crear cada presupuesto. Los logos ocupan poco (máx. 2 MB, solo imágenes) para no llenar el almacenamiento.
      </p>

      <div className="mb-6 flex flex-col gap-3">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>

      {templates.length === 0 && !creating && (
        <div className="mb-6 rounded-lg border border-border bg-raised p-6 text-center">
          <p className="font-heading text-base text-ink">Todavía no tienes plantillas</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">
            Sin ninguna plantilla, los presupuestos se ven con el estilo por defecto del CRM.
          </p>
        </div>
      )}

      {creating ? (
        <div className="rounded-lg border border-border bg-raised p-4">
          <TemplateForm onDone={() => setCreating(false)} />
        </div>
      ) : (
        templates.length < MAX_TEMPLATES && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-md border border-border px-4 py-2 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
          >
            + Nueva plantilla
          </button>
        )
      )}
    </>
  );
}
