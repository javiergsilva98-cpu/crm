"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function submitInventoryCount(formData: FormData): Promise<ActionResult> {
  const countedByMemberId = (formData.get("counted_by_member_id") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const itemIds = formData.getAll("item_id") as string[];
  const actuals = formData.getAll("actual_stock") as string[];
  const expecteds = formData.getAll("expected_stock") as string[];

  const lines = itemIds
    .map((id, i) => ({
      inventory_item_id: id,
      actual_stock: Number(actuals[i]),
      expected_stock: Number(expecteds[i]),
      raw: actuals[i],
    }))
    .filter((l) => l.raw !== "" && l.raw !== undefined && !Number.isNaN(l.actual_stock));

  if (lines.length === 0) {
    return { error: "Introduce al menos una cantidad contada." };
  }

  const supabase = await createClient();
  const { data: countRow, error: countError } = await supabase
    .from("inventory_counts")
    .insert({ counted_by_member_id: countedByMemberId, notes })
    .select("id")
    .single();

  if (countError || !countRow) {
    return { error: countError?.message ?? "No se pudo registrar el conteo." };
  }

  const { error: linesError } = await supabase.from("inventory_count_lines").insert(
    lines.map((l) => ({
      count_id: countRow.id,
      inventory_item_id: l.inventory_item_id,
      expected_stock: l.expected_stock,
      actual_stock: l.actual_stock,
    })),
  );

  if (linesError) {
    return { error: linesError.message };
  }

  revalidatePath("/inventario");
  revalidatePath("/inventario/conteo");
}
