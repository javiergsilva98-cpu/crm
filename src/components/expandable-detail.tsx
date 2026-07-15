import type { ReactNode } from "react";

export function ExpandableDetail({
  colSpan,
  fields,
}: {
  colSpan: number;
  fields: { key: string; label: string; value: ReactNode }[];
}) {
  return (
    <tr className="border-t border-border bg-sunken">
      <td className="px-4 py-3" colSpan={colSpan}>
        {fields.length === 0 ? (
          <p className="text-sm text-ink-mute">No hay campos seleccionados para esta vista. Usa &quot;Personalizar&quot; para elegir cuáles mostrar.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <div key={field.key}>
                <dt className="text-xs font-semibold tracking-wide text-ink-mute uppercase">{field.label}</dt>
                <dd className="mt-0.5 text-sm text-ink">{field.value || <span className="text-ink-mute">—</span>}</dd>
              </div>
            ))}
          </dl>
        )}
      </td>
    </tr>
  );
}
