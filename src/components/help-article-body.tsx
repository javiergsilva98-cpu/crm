function renderInline(text: string) {
  // Solo soporta **negrita** y [texto](url), para no arrastrar un parser de markdown completo.
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer" className="underline">
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function HelpArticleBody({ body }: { body: string }) {
  const blocks = body.trim().split(/\n\s*\n/);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        if (lines[0].startsWith("## ")) {
          return (
            <h3 key={i} className="mt-2 font-heading text-base font-semibold text-ink">
              {lines[0].slice(3)}
            </h3>
          );
        }

        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-sm text-ink-soft">
            {renderInline(lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}
