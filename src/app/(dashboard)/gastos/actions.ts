"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";

export async function createExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida. Vuelve a iniciar sesión." };

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "El concepto es obligatorio." };

  const category = String(formData.get("category") ?? "otros");

  const { error } = await supabase.from("expenses").insert({
    owner_id: user.id,
    description,
    category: (EXPENSE_CATEGORIES as readonly string[]).includes(category) ? category : "otros",
    amount: Number(formData.get("amount") ?? 0) || 0,
    tax_rate: Number(formData.get("tax_rate") ?? 21) || 0,
    expense_date: String(formData.get("expense_date") ?? "").trim() || new Date().toISOString().slice(0, 10),
    company_id: String(formData.get("company_id") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) return { error: "No se pudo guardar el gasto. Inténtalo de nuevo." };

  revalidatePath("/gastos");
}

export async function updateExpense(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;

  const category = String(formData.get("category") ?? "otros");

  await supabase
    .from("expenses")
    .update({
      description,
      category: (EXPENSE_CATEGORIES as readonly string[]).includes(category) ? category : "otros",
      amount: Number(formData.get("amount") ?? 0) || 0,
      tax_rate: Number(formData.get("tax_rate") ?? 21) || 0,
      expense_date: String(formData.get("expense_date") ?? "").trim() || new Date().toISOString().slice(0, 10),
      company_id: String(formData.get("company_id") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);

  revalidatePath("/gastos");
}

export async function deleteExpense(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/gastos");
}
