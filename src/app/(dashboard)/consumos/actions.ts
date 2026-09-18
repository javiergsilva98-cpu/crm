"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function createMenuItem(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as string;
  const price = Number(formData.get("price"));
  const inventoryItemId = (formData.get("inventory_item_id") as string) || null;
  const stockMode = (formData.get("stock_mode") as string) || "unit";

  if (!name || !category || !price || price <= 0) {
    return { error: "Indica nombre, categoría y un precio válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .insert({ name, category, price, inventory_item_id: inventoryItemId, stock_mode: stockMode });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/consumos");
}

export async function updateMenuItem(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as string;
  const price = Number(formData.get("price"));
  const inventoryItemId = (formData.get("inventory_item_id") as string) || null;
  const stockMode = (formData.get("stock_mode") as string) || "unit";

  if (!id || !name || !category || !price || price <= 0) {
    return { error: "Indica nombre, categoría y un precio válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ name, category, price, inventory_item_id: inventoryItemId, stock_mode: stockMode })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/consumos");
}

export async function deleteMenuItem(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    return { error: "No se puede eliminar: ya tiene consumiciones registradas. Desactívalo en su lugar." };
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

export async function markConsumption(formData: FormData): Promise<ActionResult> {
  const memberId = formData.get("member_id") as string;
  const menuItemId = formData.get("menu_item_id") as string;
  const unitPrice = Number(formData.get("unit_price"));

  if (!memberId || !menuItemId) {
    return { error: "Falta indicar el socio o el artículo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("consumptions").insert({
    member_id: memberId,
    menu_item_id: menuItemId,
    quantity: 1,
    unit_price: unitPrice,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/consumos");
}

// Reparte un artículo "compartido" (una botella) entre varios socios: el
// coste se divide a partes iguales y se descuenta un solo artículo de
// bodega, todo dentro de una función de base de datos para que quede
// como una sola operación consistente.
export async function markSharedConsumption(formData: FormData): Promise<ActionResult> {
  const menuItemId = formData.get("menu_item_id") as string;
  const memberIds = formData.getAll("member_ids") as string[];

  if (!menuItemId || memberIds.length < 2) {
    return { error: "Elige el artículo y al menos dos socios para repartir." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_shared_consumption", {
    p_menu_item_id: menuItemId,
    p_member_ids: memberIds,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/consumos");
}
