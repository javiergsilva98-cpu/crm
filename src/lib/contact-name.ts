// Reparte un nombre completo en nombre + apellidos (primera palabra =
// nombre, resto = apellidos). Se usa como respaldo al importar CSVs
// antiguos que solo traían una columna de nombre.
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIdx), lastName: trimmed.slice(spaceIdx + 1).trim() };
}
