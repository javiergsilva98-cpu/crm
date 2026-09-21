"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function createMenuItem(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as string;
  const inventoryItemId = formData.get("inventory_item_id") as string;
  const stockMode = (formData.get("stock_mode") as string) || "unit";

  if (!name || !category || !inventoryItemId) {
    return { error: "Indica nombre, categoría y el artículo de bodega vinculado (el precio se calcula solo)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .insert({ name, category, price: 0, inventory_item_id: inventoryItemId, stock_mode: stockMode })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear el artículo." };
  }

  const { error: priceError } = await supabase.rpc("set_menu_item_price_from_cost", { p_menu_item_id: data.id });
  if (priceError) {
    return { error: priceError.message };
  }

  revalidatePath("/consumos");
  revalidatePath("/inventario");
}

export async function updateMenuItem(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as string;
  const inventoryItemId = formData.get("inventory_item_id") as string;
  const stockMode = (formData.get("stock_mode") as string) || "unit";

  if (!id || !name || !category || !inventoryItemId) {
    return { error: "Indica nombre, categoría y el artículo de bodega vinculado (el precio se calcula solo)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ name, category, inventory_item_id: inventoryItemId, stock_mode: stockMode })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  const { error: priceError } = await supabase.rpc("set_menu_item_price_from_cost", { p_menu_item_id: id });
  if (priceError) {
    return { error: priceError.message };
  }

  revalidatePath("/consumos");
  revalidatePath("/inventario");
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

// El precio se busca en el servidor a partir del artículo y de si el
// consumo es para socio o invitado (Fase 6) en vez de confiar en un
// precio que llegue del cliente, para que no se pueda manipular.
export async function markConsumption(formData: FormData): Promise<ActionResult> {
  const memberId = formData.get("member_id") as string;
  const menuItemId = formData.get("menu_item_id") as string;
  const isGuest = formData.get("is_guest") === "true";

  if (!memberId || !menuItemId) {
    return { error: "Falta indicar el socio o el artículo." };
  }

  const supabase = await createClient();
  const { data: menuItem, error: menuItemError } = await supabase
    .from("menu_items")
    .select("price, guest_price, active")
    .eq("id", menuItemId)
    .single();

  if (menuItemError || !menuItem || !menuItem.active) {
    return { error: "Artículo no disponible." };
  }

  const { error } = await supabase.from("consumptions").insert({
    member_id: memberId,
    menu_item_id: menuItemId,
    quantity: 1,
    unit_price: isGuest ? menuItem.guest_price : menuItem.price,
    is_guest: isGuest,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/consumos");
}

// Reporta un pedido ya confirmado como incorrecto (p.ej. no reconoce el
// consumo). No modifica ni borra la consumición — esta queda inmutable
// una vez registrada — solo deja constancia para que la directiva lo
// revise (la gestión del estado llega con la Fase 6 de incidencias).
export async function reportIncident(formData: FormData): Promise<ActionResult> {
  const consumptionId = formData.get("consumption_id") as string;
  const memberId = formData.get("member_id") as string;

  if (!consumptionId || !memberId) {
    return { error: "Falta información para reportar la incidencia." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("incidencias").insert({
    tipo: "consumicion_incorrecta",
    referencia_id: consumptionId,
    reportado_por_member_id: memberId,
  });

  if (error) {
    return { error: error.message };
  }
}

// Reparte un artículo "compartido" (una botella) entre varios socios: el
// coste se divide a partes iguales y se descuenta un solo artículo de
// bodega, todo dentro de una función de base de datos para que quede
// como una sola operación consistente.
export async function markSharedConsumption(formData: FormData): Promise<ActionResult> {
  const menuItemId = formData.get("menu_item_id") as string;
  const memberIds = formData.getAll("member_ids") as string[];
  const isGuest = formData.get("is_guest") === "true";

  if (!menuItemId || memberIds.length < 2) {
    return { error: "Elige el artículo y al menos dos socios para repartir." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_shared_consumption", {
    p_menu_item_id: menuItemId,
    p_member_ids: memberIds,
    p_is_guest: isGuest,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/consumos");
}
