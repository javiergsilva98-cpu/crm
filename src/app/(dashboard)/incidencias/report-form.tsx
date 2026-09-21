"use client";

import { useRef, useState } from "react";
import { reportIncidencia } from "./actions";

const CATEGORY_LABELS: Record<string, string> = {
  rotura: "Algo roto",
  falta_material: "Falta material",
  convivencia: "Convivencia",
  consumicion_incorrecta: "Consumición mal registrada",
  producto: "Producto de inventario",
  fichaje: "Fichaje / responsable de esa jornada",
  otro: "Otro",
};

export function ReportForm({
  memberId,
  consumptions,
  inventoryItems,
  events,
}: {
  memberId: string;
  consumptions: { id: string; label: string }[];
  inventoryItems: { id: string; name: string }[];
  events: { id: string; name: string }[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [categoria, setCategoria] = useState("otro");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4"
      action={async (formData) => {
        setPending(true);
        setError(null);
        setSaved(false);
        formData.set("member_id", memberId);
        const result = await reportIncidencia(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
        setCategoria("otro");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Categoría</label>
        <select
          name="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Descripción</label>
        <textarea
          name="descripcion"
          required
          rows={3}
          placeholder="Qué ha pasado, dónde, y cualquier detalle útil para investigarlo"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Fecha del hecho</label>
        <input
          name="fecha_incidencia"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>

      {categoria === "consumicion_incorrecta" && (
        <div>
          <label className="mb-1 block text-xs text-muted">Consumición relacionada (opcional)</label>
          <select
            name="referencia_consumicion_id"
            defaultValue=""
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">Sin vincular</option>
            {consumptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {categoria === "producto" && (
        <div>
          <label className="mb-1 block text-xs text-muted">Producto de inventario (opcional)</label>
          <select
            name="referencia_producto_id"
            defaultValue=""
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">Sin vincular</option>
            {inventoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {categoria === "fichaje" && (
        <div>
          <label className="mb-1 block text-xs text-muted">Jornada / evento relacionado (opcional)</label>
          <select
            name="referencia_evento_id"
            defaultValue=""
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">Sin vincular</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Reportar incidencia"}
      </button>
      {saved && <p className="text-sm text-success">Incidencia reportada.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
