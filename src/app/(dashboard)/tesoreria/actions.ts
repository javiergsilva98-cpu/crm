"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string } | void;

export async function createTreasuryMovement(formData: FormData): Promise<ActionResult> {
  const movementType = formData.get("movement_type") as string;
  const amount = Number(formData.get("amount"));
  const movementDate = (formData.get("movement_date") as string) || undefined;
  const description = (formData.get("description") as string) || null;
  const memberId = (formData.get("member_id") as string) || null;

  if (!movementType || !amount || amount <= 0) {
    return { error: "Indica tipo e importe válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("treasury_movements").insert({
    movement_type: movementType,
    amount,
    movement_date: movementDate,
    description,
    member_id: memberId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tesoreria");
}
