"use client";

import { useState } from "react";
import { createReport } from "./actions";
import { colorAt } from "./colors";

export function CreateMarketingReportButton() {
  const [creating, setCreating] = useState(false);

  async function handleClick() {
    setCreating(true);
    const formData = new FormData();
    formData.set("name", "Informe de marketing");
    formData.set(
      "blocks",
      JSON.stringify([
        {
          id: "leads-por-canal",
          title: "Contactos por canal",
          chartType: "bar",
          series: [{ metric: "contacts_by_source", color: colorAt(0) }],
        },
        {
          id: "sesiones-por-canal",
          title: "Sesiones web por canal",
          chartType: "bar",
          series: [{ metric: "sessions_by_channel", color: colorAt(1) }],
        },
      ]),
    );
    await createReport(formData);
    setCreating(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={creating}
      className="rounded-md border border-border px-4 py-2 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink disabled:opacity-50"
    >
      {creating ? "Creando..." : "Usar plantilla: Informe de marketing"}
    </button>
  );
}
