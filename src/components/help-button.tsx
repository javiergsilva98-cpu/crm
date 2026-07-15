import Link from "next/link";
import { helpArticle } from "@/lib/help-articles";

export function HelpButton({ slug, label }: { slug: string; label?: string }) {
  const article = helpArticle(slug);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label ? `Ayuda: ${label}` : "Ayuda"}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs text-ink-mute transition-colors hover:border-border-strong hover:text-ink"
      >
        ?
      </button>
      {article && (
        <span className="pointer-events-none absolute top-full left-1/2 z-20 w-64 -translate-x-1/2 pt-2 opacity-0 transition-opacity delay-300 duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:delay-0">
          <span className="block rounded-lg border border-border bg-raised p-3 text-left shadow-lg shadow-black/10">
            <span className="block text-sm font-normal text-ink-soft">{article.summary}</span>
            <Link href={`/ayuda/${slug}`} target="_blank" className="mt-2 inline-block text-sm font-medium text-ink underline">
              Más información →
            </Link>
          </span>
        </span>
      )}
    </span>
  );
}
