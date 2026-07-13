export const CHANNELS = ["instagram", "google", "whatsapp", "referido", "tiktok", "otro"] as const;

export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  instagram: "Instagram",
  google: "Google",
  whatsapp: "WhatsApp",
  referido: "Referido",
  tiktok: "TikTok",
  otro: "Otro",
};
