"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { helpArticlesByCategory } from "@/lib/help-articles";

export function HelpSidebar() {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/ayuda/") ? pathname.slice("/ayuda/".length) : null;
  const groups = helpArticlesByCategory();
  const activeCategory = groups.find((g) => g.articles.some((a) => a.slug === activeSlug))?.category;

  const [open, setOpen] = useState<Set<string>>(
    new Set(activeCategory ? [activeCategory] : groups[0] ? [groups[0].category] : []),
  );

  function toggle(category: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <nav className="shrink-0 md:w-56">
      <Link href="/ayuda" className="mb-3 block text-sm font-semibold text-ink hover:underline">
        Ayuda
      </Link>
      <div className="flex flex-col gap-1">
        {groups.map((group) => {
          const isOpen = open.has(group.category);
          return (
            <div key={group.category}>
              <button
                type="button"
                onClick={() => toggle(group.category)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-semibold tracking-wide text-ink-soft uppercase transition-colors hover:bg-sunken hover:text-ink"
              >
                {group.category}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                >
                  <path d="M3 1.5 7 5 3 8.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && (
                <div className="mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-border pl-2">
                  {group.articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/ayuda/${article.slug}`}
                      className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                        article.slug === activeSlug
                          ? "bg-sunken font-medium text-ink"
                          : "text-ink-soft hover:bg-sunken hover:text-ink"
                      }`}
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
