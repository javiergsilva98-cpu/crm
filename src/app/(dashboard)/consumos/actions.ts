"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markConsumption(formData: FormData) {
  const memberId = formData.get("member_id") as string;
  const menuItemId = formData.get("menu_item_id") as string;
  const unitPrice = Number(formData.get("unit_price"));

  if (!memberId || !menuItemId) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("consumptions").insert({
    member_id: memberId,
    menu_item_id: menuItemId,
    quantity: 1,
    unit_price: unitPrice,
  });

  revalidatePath("/consumos");
}
