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

export async function createInventoryItem(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim() || "ud";
  const category = formData.get("category") as string;
  const stockMode = (formData.get("stock_mode") as string) || "unit";
  const quantity = Number(formData.get("quantity"));
  const cost = Number(formData.get("cost") || 0);
  const lowStockThreshold = Number(formData.get("low_stock_threshold") || 5);
  const responsibleMemberId = (formData.get("responsible_member_id") as string) || null;

  if (!name || !category || !quantity || quantity <= 0 || !cost || cost <= 0) {
    return { error: "Indica nombre, categoría, cantidad inicial y coste del pedido válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_inventory_item", {
    p_name: name,
    p_unit: unit,
    p_category: category,
    p_stock_mode: stockMode,
    p_quantity: quantity,
    p_cost: cost,
    p_low_stock_threshold: lowStockThreshold,
    p_responsible_member_id: responsibleMemberId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventario");
  revalidatePath("/consumos");
}

export async function updateMarginSettings(formData: FormData): Promise<ActionResult> {
  const saleMargin = Number(formData.get("sale_margin_pct"));
  const guestMargin = Number(formData.get("guest_margin_pct"));
  const minMargin = Number(formData.get("min_margin_pct"));

  if (
    Number.isNaN(saleMargin) || saleMargin < 0 ||
    Number.isNaN(guestMargin) || guestMargin < 0 ||
    Number.isNaN(minMargin) || minMargin < 0
  ) {
    return { error: "Indica un margen de socio, un margen de invitado y un margen mínimo válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("club_settings")
    .update({ sale_margin_pct: saleMargin, guest_margin_pct: guestMargin, min_margin_pct: minMargin })
    .eq("id", true);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventario");
  revalidatePath("/consumos");
}

export async function updateLowStockThreshold(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const threshold = Number(formData.get("low_stock_threshold"));

  if (!id || Number.isNaN(threshold) || threshold < 0) {
    return { error: "Indica un umbral de aviso válido (0 o más)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").update({ low_stock_threshold: threshold }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventario");
}
