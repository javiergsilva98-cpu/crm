// Formato español consistente en toda la app: punto para miles, coma para
// decimales, y horas en huso de Madrid (el negocio opera desde España,
// independientemente de en qué región esté desplegado el servidor).

export function formatNumber(n: number): string {
  return n.toLocaleString("es-ES");
}

export function formatAmount(n: number, maximumFractionDigits = 0): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
