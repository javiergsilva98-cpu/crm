"use client";

import { useState } from "react";

export function InviteLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/login?invite=${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-border px-3 py-1 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
    >
      {copied ? "¡Copiado!" : "Copiar enlace"}
    </button>
  );
}
