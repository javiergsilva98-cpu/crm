"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/profile";
import { providerConfig, type Provider } from "@/lib/marketing-providers";
import { currentMonthKey } from "@/lib/month";
import { fetchMetaAdsSpend } from "@/lib/ads-api/meta";
import { fetchGoogleAdsSpend } from "@/lib/ads-api/google";

function parseProvider(value: FormDataEntryValue | null): Provider | null {
  const v = String(value ?? "");
  return v === "meta_ads" || v === "google_ads" ? v : null;
}

export async function saveIntegration(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const provider = parseProvider(formData.get("provider"));
  const config = provider ? providerConfig(provider) : null;
  if (!provider || !config) return;

  const { data: existing } = await supabase
    .from("marketing_integrations")
    .select("credentials")
    .eq("owner_id", user.id)
    .eq("provider", provider)
    .maybeSingle();

  const previousCredentials = (existing?.credentials as Record<string, string>) ?? {};
  const credentials: Record<string, string> = { ...previousCredentials };

  // Los campos vacíos no sobrescriben un valor ya guardado, para no tener
  // que volver a pegar todas las claves solo para cambiar una.
  for (const field of config.fields) {
    const value = String(formData.get(field.key) ?? "").trim();
    if (value) credentials[field.key] = value;
  }

  await supabase.from("marketing_integrations").upsert(
    { owner_id: user.id, provider, credentials, connected_at: new Date().toISOString() },
    { onConflict: "owner_id,provider" },
  );

  revalidatePath("/configuracion");
}

export async function disconnectIntegration(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const provider = parseProvider(formData.get("provider"));
  if (!provider) return;

  await supabase.from("marketing_integrations").delete().eq("owner_id", user.id).eq("provider", provider);
  revalidatePath("/configuracion");
}

export async function syncIntegration(formData: FormData) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const provider = parseProvider(formData.get("provider"));
  const config = provider ? providerConfig(provider) : null;
  if (!provider || !config) return;

  const { data: integration } = await supabase
    .from("marketing_integrations")
    .select("credentials")
    .eq("owner_id", user.id)
    .eq("provider", provider)
    .maybeSingle();

  if (!integration) return;

  try {
    const amount =
      provider === "meta_ads"
        ? await fetchMetaAdsSpend(integration.credentials as never)
        : await fetchGoogleAdsSpend(integration.credentials as never);

    await supabase.from("channel_spend").upsert(
      { owner_id: user.id, channel: config.channel, month: currentMonthKey(), amount, source_type: "api" },
      { onConflict: "owner_id,channel,month" },
    );

    await supabase
      .from("marketing_integrations")
      .update({ last_synced_at: new Date().toISOString(), last_sync_error: null })
      .eq("owner_id", user.id)
      .eq("provider", provider);
  } catch (error) {
    await supabase
      .from("marketing_integrations")
      .update({ last_sync_error: error instanceof Error ? error.message : "Error desconocido al sincronizar." })
      .eq("owner_id", user.id)
      .eq("provider", provider);
  }

  revalidatePath("/configuracion");
  revalidatePath("/canales");
}
