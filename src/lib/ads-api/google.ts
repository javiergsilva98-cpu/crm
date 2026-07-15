export type GoogleAdsCredentials = {
  developer_token: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  customer_id: string;
};

async function getAccessToken(credentials: GoogleAdsCredentials): Promise<string> {
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

/**
 * Suma el gasto del mes actual desde la Google Ads API (REST).
 * https://developers.google.com/google-ads/api/rest/overview
 *
 * Nota: la Google Ads API cambia de versión con frecuencia y exige que el
 * developer token esté aprobado para el nivel de acceso adecuado. Esta
 * implementación sigue la forma documentada de la API a fecha de escritura,
 * pero no ha podido probarse contra una cuenta real — si Google responde con
 * un error de versión o de formato, lo más probable es que haya que ajustar
 * la ruta ("v17") o el cuerpo de la consulta GAQL.
 */
export async function fetchGoogleAdsSpend(credentials: GoogleAdsCredentials): Promise<number> {
  const { developer_token, customer_id } = credentials;
  if (!developer_token || !customer_id || !credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
    throw new Error("Faltan credenciales de Google Ads.");
  }

  const accessToken = await getAccessToken(credentials);
  const customerId = customer_id.replace(/-/g, "");

  const res = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developer_token,
      "login-customer-id": customerId,
    },
    body: JSON.stringify({
      query: "SELECT metrics.cost_micros FROM customer WHERE segments.date DURING THIS_MONTH",
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    const message = Array.isArray(body) ? body[0]?.error?.message : body?.error?.message;
    throw new Error(message ?? `Google Ads respondió ${res.status}`);
  }

  const results = (body.results ?? []) as { metrics?: { costMicros?: string } }[];
  const totalMicros = results.reduce((sum, r) => sum + Number(r.metrics?.costMicros ?? 0), 0);
  return totalMicros / 1_000_000;
}
