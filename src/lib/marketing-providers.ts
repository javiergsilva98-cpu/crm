import type { Channel } from "@/lib/channels";

export type Provider = "meta_ads" | "google_ads";

export type ProviderField = { key: string; label: string; placeholder?: string };

export type ProviderConfig = {
  key: Provider;
  label: string;
  channel: Channel;
  helpUrl: string;
  fields: ProviderField[];
};

export const PROVIDERS: ProviderConfig[] = [
  {
    key: "meta_ads",
    label: "Meta Ads (Instagram / Facebook)",
    channel: "instagram",
    helpUrl: "https://developers.facebook.com/docs/marketing-apis/get-started",
    fields: [
      { key: "access_token", label: "Access Token de larga duración" },
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_1234567890" },
    ],
  },
  {
    key: "google_ads",
    label: "Google Ads",
    channel: "google",
    helpUrl: "https://developers.google.com/google-ads/api/docs/start",
    fields: [
      { key: "developer_token", label: "Developer Token" },
      { key: "client_id", label: "OAuth Client ID" },
      { key: "client_secret", label: "OAuth Client Secret" },
      { key: "refresh_token", label: "Refresh Token" },
      { key: "customer_id", label: "Customer ID", placeholder: "123-456-7890" },
    ],
  },
];

export function providerConfig(key: string): ProviderConfig | null {
  return PROVIDERS.find((p) => p.key === key) ?? null;
}
