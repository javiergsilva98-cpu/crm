import Link from "next/link";
import { helpArticlesByCategory } from "@/lib/help-articles";

export default function AyudaPage() {
  const groups = helpArticlesByCategory();

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Ayuda</h1>
      <p className="mb-8 text-sm text-ink-mute">Guías rápidas sobre cómo funciona cada parte del CRM.</p>

      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <div key={group.category}>
            <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-soft uppercase">{group.category}</h2>
            <div className="flex flex-col gap-2">
              {group.articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/ayuda/${article.slug}`}
                  className="rounded-lg border border-border bg-raised p-4 transition-colors hover:border-border-strong"
                >
                  <p className="text-sm font-medium text-ink">{article.title}</p>
                  <p className="mt-1 text-sm text-ink-mute">{article.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
