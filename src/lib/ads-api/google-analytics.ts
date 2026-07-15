import type { Channel } from "@/lib/channels";

export type GoogleAnalyticsCredentials = {
  property_id: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
};

async function getAccessToken(credentials: GoogleAnalyticsCredentials): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: credentials.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error_description ?? "No se pudo renovar el token de Google.");
  return body.access_token as string;
}

// GA no tiene canales fijos como los nuestros: cada "sessionSource" es texto
// libre (google, instagram, tiktok, (direct), t.co...). Lo mapeamos por
// coincidencia de texto a nuestro enum; lo que no reconoce cae en "otro".
function mapSourceToChannel(source: string): Channel {
  const s = source.toLowerCase();
  if (s.includes("instagram")) return "instagram";
  if (s.includes("tiktok")) return "tiktok";
  if (s.includes("whatsapp")) return "whatsapp";
  if (s.includes("google")) return "google";
  if (s === "(direct)" || s.includes("referral")) return "referido";
  return "otro";
}

/**
 * Suma las sesiones del mes actual por canal desde la Google Analytics Data
 * API (GA4). https://developers.google.com/analytics/devguides/reporting/data/v1
 *
 * Nota: sin probar contra una propiedad real. El agrupamiento por
 * "sessionSource" no coincide 1:1 con nuestros canales — es una
 * aproximación por texto, revisable una vez haya datos reales que comparar
 * con Canales.
 */
export async function fetchGoogleAnalyticsSessions(
  credentials: GoogleAnalyticsCredentials,
): Promise<Record<Channel, number>> {
  const { property_id } = credentials;
  if (!property_id || !credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
    throw new Error("Faltan credenciales de Google Analytics.");
  }

  const accessToken = await getAccessToken(credentials);
  const propertyId = property_id.replace(/^properties\//, "");

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: "thismonth", endDate: "today" }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Google Analytics respondió ${res.status}`);
  }

  const rows = (body.rows ?? []) as { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];

  const totals: Record<Channel, number> = { instagram: 0, google: 0, whatsapp: 0, referido: 0, tiktok: 0, otro: 0 };
  for (const row of rows) {
    const source = row.dimensionValues?.[0]?.value ?? "";
    const sessions = Number(row.metricValues?.[0]?.value ?? 0);
    const channel = mapSourceToChannel(source);
    totals[channel] += sessions;
  }
  return totals;
}
