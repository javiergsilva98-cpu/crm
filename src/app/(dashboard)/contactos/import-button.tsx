"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseCsv } from "@/lib/parse-csv";
import { importContacts } from "./actions";

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setStatus("El archivo no tiene filas de datos.");
      setLoading(false);
      return;
    }

    const [header, ...dataRows] = rows;
    const nameIdx = findColumn(header, ["nombre", "full_name", "name"]);
    const emailIdx = findColumn(header, ["email", "correo"]);
    const phoneIdx = findColumn(header, ["teléfono", "telefono", "phone"]);
    const companyIdx = findColumn(header, ["empresa", "company"]);
    const sourceIdx = findColumn(header, ["canal", "source", "origen"]);

    if (nameIdx === -1) {
      setStatus('No se encontró una columna "Nombre" en el CSV.');
      setLoading(false);
      return;
    }

    const parsedRows = dataRows.map((r) => ({
      full_name: r[nameIdx] ?? "",
      email: emailIdx !== -1 ? (r[emailIdx] ?? "") : "",
      phone: phoneIdx !== -1 ? (r[phoneIdx] ?? "") : "",
      empresa: companyIdx !== -1 ? (r[companyIdx] ?? "") : "",
      source: sourceIdx !== -1 ? (r[sourceIdx] ?? "") : "",
    }));

    const result = await importContacts(parsedRows);
    setStatus(`Importados ${result.imported}. Omitidos ${result.skipped}.`);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer text-sm text-ink-soft hover:underline">
        {loading ? "Importando..." : "Importar CSV"}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          disabled={loading}
          className="hidden"
        />
      </label>
      {status && <span className="text-xs text-ink-mute">{status}</span>}
    </div>
  );
}
