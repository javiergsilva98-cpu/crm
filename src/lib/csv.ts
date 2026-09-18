// Genera CSV con BOM UTF-8 y separador ";" para que Excel en español lo
// abra directamente con acentos y columnas correctas (con "," como
// separador, Excel-ES interpreta el CSV como una sola columna).
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(";"));
  return "﻿" + lines.join("\n") + "\n";
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
