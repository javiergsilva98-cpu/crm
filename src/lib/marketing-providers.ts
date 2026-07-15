import type { Channel } from "@/lib/channels";

export type Provider = "meta_ads" | "google_ads" | "google_analytics";

export type ProviderField = { key: string; label: string; placeholder?: string };

export type ProviderConfig = {
  key: Provider;
  label: string;
  // Meta/Google Ads sincronizan la inversión de un único canal fijo.
  // Analytics reparte sesiones entre varios canales, así que no aplica.
  channel: Channel | null;
  helpSlug: string;
  fields: ProviderField[];
};

export const PROVIDERS: ProviderConfig[] = [
  {
    key: "meta_ads",
    label: "Meta Ads (Instagram / Facebook)",
    channel: "instagram",
    helpSlug: "conectar-meta-ads",
    fields: [
      { key: "access_token", label: "Access Token de larga duración" },
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_1234567890" },
    ],
  },
  {
    key: "google_ads",
    label: "Google Ads",
    channel: "google",
    helpSlug: "conectar-google-ads",
    fields: [
      { key: "developer_token", label: "Developer Token" },
      { key: "client_id", label: "OAuth Client ID" },
      { key: "client_secret", label: "OAuth Client Secret" },
      { key: "refresh_token", label: "Refresh Token" },
      { key: "customer_id", label: "Customer ID", placeholder: "123-456-7890" },
    ],
  },
  {
    key: "google_analytics",
    label: "Google Analytics",
    channel: null,
    helpSlug: "conectar-google-analytics",
    fields: [
      { key: "property_id", label: "Property ID", placeholder: "properties/123456789" },
      { key: "client_id", label: "OAuth Client ID" },
      { key: "client_secret", label: "OAuth Client Secret" },
      { key: "refresh_token", label: "Refresh Token" },
    ],
  },
];

export function providerConfig(key: string): ProviderConfig | null {
  return PROVIDERS.find((p) => p.key === key) ?? null;
}
