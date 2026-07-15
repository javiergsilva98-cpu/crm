import { currentMonthRange } from "@/lib/month";

export type MetaAdsCredentials = { access_token: string; ad_account_id: string };

/**
 * Suma el gasto del mes actual desde la Marketing API de Meta.
 * https://developers.facebook.com/docs/marketing-api/insights
 *
 * El ad_account_id debe incluir el prefijo "act_" (ej. act_1234567890).
 */
export async function fetchMetaAdsSpend(credentials: MetaAdsCredentials): Promise<number> {
  const { access_token, ad_account_id } = credentials;
  if (!access_token || !ad_account_id) throw new Error("Faltan credenciales de Meta Ads.");

  const { start, end } = currentMonthRange();
  const since = start.toISOString().slice(0, 10);
  const until = end.toISOString().slice(0, 10);

  const url = new URL(`https://graph.facebook.com/v19.0/${ad_account_id}/insights`);
  url.searchParams.set("fields", "spend");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));
  url.searchParams.set("access_token", access_token);

  const res = await fetch(url.toString());
  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Meta Ads respondió ${res.status}`);
  }

  const rows = body.data as { spend?: string }[] | undefined;
  return (rows ?? []).reduce((sum, row) => sum + Number(row.spend ?? 0), 0);
}
