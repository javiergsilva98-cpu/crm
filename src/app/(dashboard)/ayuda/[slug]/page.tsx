import { notFound } from "next/navigation";
import { helpArticle } from "@/lib/help-articles";
import { HelpArticleBody } from "@/components/help-article-body";

export default async function AyudaArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = helpArticle(slug);
  if (!article) notFound();

  return (
    <div className="max-w-2xl">
      <p className="mb-1 text-xs font-semibold tracking-wide text-ink-mute uppercase">{article.category}</p>
      <h1 className="mb-6 font-heading text-2xl font-semibold text-ink">{article.title}</h1>
      <HelpArticleBody body={article.body} />
    </div>
  );
}
