"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink print:hidden"
    >
      Imprimir / PDF
    </button>
  );
}
