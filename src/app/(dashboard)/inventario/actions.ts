"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function registerRestock(formData: FormData): Promise<ActionResult> {
  const inventoryItemId = formData.get("inventory_item_id") as string;
  const quantity = Number(formData.get("quantity"));
  const cost = Number(formData.get("cost") || 0);
  const responsibleMemberId = (formData.get("responsible_member_id") as string) || null;

  if (!inventoryItemId || !quantity || quantity <= 0) {
    return { error: "Indica un artículo y una cantidad válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_restocks").insert({
    inventory_item_id: inventoryItemId,
    quantity,
    cost,
    responsible_member_id: responsibleMemberId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventario");
}
