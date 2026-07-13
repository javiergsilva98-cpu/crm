"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CHANNELS } from "@/lib/channels";
import { currentMonthKey } from "@/lib/month";

export async function saveChannelSpend(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const month = currentMonthKey();

  for (const channel of CHANNELS) {
    const raw = formData.get(`spend_${channel}`);
    if (raw === null) continue;
    const amount = Number(raw);
    if (!Number.isFinite(amount)) continue;

    await supabase
      .from("channel_spend")
      .upsert(
        { owner_id: user.id, channel, month, amount, source_type: "manual" },
        { onConflict: "owner_id,channel,month" },
      );
  }

  revalidatePath("/canales");
}
