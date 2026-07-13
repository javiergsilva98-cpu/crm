/** Devuelve el primer y último instante del mes que contiene `date` (por defecto, hoy). */
export function currentMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

/** Primer día del mes en formato YYYY-MM-DD, para guardar en una columna `date`. */
export function currentMonthKey(date: Date = new Date()): string {
  const { start } = currentMonthRange(date);
  return start.toISOString().slice(0, 10);
}
