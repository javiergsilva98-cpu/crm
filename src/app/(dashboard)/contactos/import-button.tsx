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

const TEMPLATE_CSV =
  "Nombre,Email,Teléfono,Empresa,Canal\n" +
  'Ana García,ana@ejemplo.com,612345678,Acme S.L.,instagram\n' +
  'Juan Pérez,juan@ejemplo.com,655123456,,referido\n';

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_contactos.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-ink-soft hover:text-ink hover:underline"
      >
        Importar CSV
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border bg-raised p-4 shadow-lg shadow-black/10">
          <p className="mb-2 text-sm font-semibold text-ink">Cómo importar contactos</p>
          <ol className="mb-3 list-decimal space-y-1 pl-4 text-xs text-ink-soft">
            <li>Descarga la plantilla de abajo y rellénala (o adapta tu propio CSV a esas columnas).</li>
            <li>La columna &quot;Nombre&quot; es obligatoria; el resto son opcionales.</li>
            <li>En &quot;Canal&quot; usa uno de: instagram, google, whatsapp, referido, tiktok, otro.</li>
            <li>Sube el archivo con el botón de abajo.</li>
          </ol>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mb-3 w-full rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
          >
            Descargar plantilla CSV
          </button>
          <label className="block w-full cursor-pointer rounded-md bg-calm px-3 py-1.5 text-center text-sm font-medium text-base transition-colors hover:bg-calm-hover">
            {loading ? "Importando..." : "Elegir archivo CSV"}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              disabled={loading}
              className="hidden"
            />
          </label>
          {status && <p className="mt-2 text-xs text-ink-mute">{status}</p>}
        </div>
      )}
    </div>
  );
}
