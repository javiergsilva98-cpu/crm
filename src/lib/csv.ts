// Genera CSV con BOM UTF-8 y separador ";" para que Excel en español lo
// abra directamente con acentos y columnas correctas (con "," como
// separador, Excel-ES interpreta el CSV como una sola columna).
// Excel (y otras hojas de cálculo) interpretan una celda que empieza por
// =, +, -, @, tab o retorno de carro como una fórmula: un campo libre
// como una descripción o unas notas podría usarse para inyectar una.
// Se antepone un apóstrofo para forzarlo a texto plano.
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
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
