"use client";

import { useState } from "react";
import Link from "next/link";
import { updateForm } from "../actions";
import { buildEmbedHtml } from "../embed";
import { HelpButton } from "@/components/help-button";
import {
  FIELD_TYPE_LABELS,
  FIXED_FIELD_TYPES,
  slugify,
  uniqueKey,
  type FieldType,
  type FormField,
} from "../types";

type Form = {
  id: string;
  name: string;
  fields: FormField[];
  meta_pixel_id: string | null;
  google_ads_conversion_id: string | null;
  google_ads_conversion_label: string | null;
};

export function FormEditor({
  form,
  supabaseUrl,
  supabaseAnonKey,
}: {
  form: Form;
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [name, setName] = useState(form.name);
  const [fields, setFields] = useState<FormField[]>(form.fields);
  const [metaPixelId, setMetaPixelId] = useState(form.meta_pixel_id ?? "");
  const [googleAdsConversionId, setGoogleAdsConversionId] = useState(form.google_ads_conversion_id ?? "");
  const [googleAdsConversionLabel, setGoogleAdsConversionLabel] = useState(form.google_ads_conversion_label ?? "");
  const [saved, setSaved] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);

  const usedFixedTypes = new Set(fields.filter((f) => f.type !== "text").map((f) => f.type));
  const availableFixedTypes = FIXED_FIELD_TYPES.filter((t) => !usedFixedTypes.has(t));

  function addFixedField(type: FieldType) {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, key: type, label: FIELD_TYPE_LABELS[type], required: type === "full_name" },
    ]);
    setSaved(false);
  }

  function addTextField() {
    const label = "Campo nuevo";
    const key = uniqueKey(slugify(label), fields.map((f) => f.key));
    setFields((prev) => [...prev, { id: crypto.randomUUID(), type: "text", key, label, required: false }]);
    setSaved(false);
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    setSaved(false);
  }

  function renameTextField(id: string, label: string) {
    setFields((prev) => {
      const others = prev.filter((f) => f.id !== id).map((f) => f.key);
      const key = uniqueKey(slugify(label), others);
      return prev.map((f) => (f.id === id ? { ...f, label, key } : f));
    });
    setSaved(false);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSaved(false);
  }

  function moveField(id: string, dir: -1 | 1) {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      const target = index + dir;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  const embedHtml = buildEmbedHtml({
    formId: form.id,
    fields,
    supabaseUrl,
    supabaseAnonKey,
    metaPixelId: metaPixelId.trim() || null,
    googleAdsConversionId: googleAdsConversionId.trim() || null,
    googleAdsConversionLabel: googleAdsConversionLabel.trim() || null,
  });

  async function copyEmbed() {
    await navigator.clipboard.writeText(embedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/formularios" className="inline-block text-sm text-ink-soft hover:text-ink hover:underline">
          ← Formularios
        </Link>
        <HelpButton slug="formularios-embed" label="Formularios" />
      </div>

      <form
        action={async (formData) => {
          await updateForm(formData);
          setSaved(true);
        }}
        className="flex flex-col gap-6"
      >
        <input type="hidden" name="id" value={form.id} />
        <input type="hidden" name="fields" value={JSON.stringify(fields)} />

        <div>
          <label className="mb-1 block text-sm text-ink-soft">Nombre del formulario</label>
          <input
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            required
            className="w-full max-w-md rounded-md border border-border bg-base px-3 py-2 text-sm text-ink"
          />
        </div>

        <div className="rounded-lg border border-border bg-raised p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Campos</h2>
          <div className="flex flex-col gap-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-base p-2">
                <span className="w-32 shrink-0 text-xs text-ink-mute">{FIELD_TYPE_LABELS[field.type]}</span>
                {field.type === "text" ? (
                  <input
                    value={field.label}
                    onChange={(e) => renameTextField(field.id, e.target.value)}
                    className="flex-1 rounded-md border border-border px-2 py-1 text-sm"
                  />
                ) : (
                  <span className="flex-1 text-sm text-ink">{field.label}</span>
                )}
                <label className="flex items-center gap-1 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  />
                  Obligatorio
                </label>
                <button type="button" onClick={() => moveField(field.id, -1)} disabled={i === 0} className="text-ink-soft hover:text-ink disabled:opacity-30">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveField(field.id, 1)}
                  disabled={i === fields.length - 1}
                  className="text-ink-soft hover:text-ink disabled:opacity-30"
                >
                  ↓
                </button>
                <button type="button" onClick={() => removeField(field.id)} className="text-sm text-danger hover:underline">
                  Quitar
                </button>
              </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-ink-mute">Añade al menos un campo.</p>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {availableFixedTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addFixedField(type)}
                className="rounded-md border border-border px-3 py-1 text-xs text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
              >
                + {FIELD_TYPE_LABELS[type]}
              </button>
            ))}
            <button
              type="button"
              onClick={addTextField}
              className="rounded-md border border-border px-3 py-1 text-xs text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
            >
              + Campo de texto libre
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-raised p-4">
          <h2 className="mb-1 text-sm font-semibold text-ink">Seguimiento de conversiones</h2>
          <p className="mb-3 text-xs text-ink-mute">
            Opcional. Pega aquí los IDs de tus cuentas de Meta Ads / Google Ads para que el formulario registre la conversión al enviarse.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
              name="meta_pixel_id"
              value={metaPixelId}
              onChange={(e) => {
                setMetaPixelId(e.target.value);
                setSaved(false);
              }}
              placeholder="Meta Pixel ID"
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
            />
            <input
              name="google_ads_conversion_id"
              value={googleAdsConversionId}
              onChange={(e) => {
                setGoogleAdsConversionId(e.target.value);
                setSaved(false);
              }}
              placeholder="Google Ads Conversion ID (AW-XXXXXXX)"
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
            />
            <input
              name="google_ads_conversion_label"
              value={googleAdsConversionLabel}
              onChange={(e) => {
                setGoogleAdsConversionLabel(e.target.value);
                setSaved(false);
              }}
              placeholder="Conversion Label (opcional)"
              className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover">
            Guardar cambios
          </button>
          {saved && <span className="text-sm text-ink-mute">Guardado.</span>}
        </div>
      </form>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => setShowEmbed((v) => !v)}
          className="rounded-md border border-border bg-raised px-4 py-2 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
        >
          {showEmbed ? "Ocultar HTML" : "Generar HTML"}
        </button>

        {showEmbed && (
          <div className="mt-3">
            <p className="mb-2 text-xs text-ink-mute">
              Pega este código en tu web, donde quieras que aparezca el formulario. Guarda los cambios primero para que el HTML incluya la última versión de los campos.
            </p>
            <textarea
              readOnly
              value={embedHtml}
              rows={12}
              className="w-full max-h-[60vh] resize-y rounded-md border border-border bg-sunken p-3 font-mono text-xs text-ink"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={copyEmbed}
              className="mt-2 rounded-md border border-border px-3 py-1 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
            >
              {copied ? "¡Copiado!" : "Copiar HTML"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
