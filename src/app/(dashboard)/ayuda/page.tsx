import Link from "next/link";
import { helpArticle } from "@/lib/help-articles";

export default function AyudaPage() {
  const primerosPasos = helpArticle("primeros-pasos");

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Ayuda</h1>
      <p className="mb-6 text-sm text-ink-mute">
        Guías rápidas sobre cómo funciona cada parte del CRM. Elige una categoría en el menú de la izquierda.
      </p>

      {primerosPasos && (
        <Link
          href={`/ayuda/${primerosPasos.slug}`}
          className="block max-w-md rounded-lg border border-border bg-raised p-4 transition-colors hover:border-border-strong"
        >
          <p className="text-sm font-medium text-ink">¿Primera vez por aquí? Empieza por {primerosPasos.title}</p>
          <p className="mt-1 text-sm text-ink-mute">{primerosPasos.summary}</p>
        </Link>
      )}
    </div>
  );
}
