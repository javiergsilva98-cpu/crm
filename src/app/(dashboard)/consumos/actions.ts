"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function createMenuItem(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as string;
  const price = Number(formData.get("price"));

  if (!name || !category || !price || price <= 0) {
    return { error: "Indica nombre, categoría y un precio válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert({ name, category, price });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/consumos");
}

export async function toggleMenuItemActive(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const nextActive = formData.get("next_active") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ active: nextActive }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/consumos");
}

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
