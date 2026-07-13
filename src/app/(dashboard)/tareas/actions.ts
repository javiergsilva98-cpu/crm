"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const companyId = String(formData.get("company_id") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();

  await supabase.from("tasks").insert({
    owner_id: user.id,
    title,
    company_id: companyId || null,
    due_date: dueDate || null,
  });

  revalidatePath("/tareas");
}

export async function toggleTask(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const completed = formData.get("completed") === "true";
  await supabase.from("tasks").update({ completed: !completed }).eq("id", id);
  revalidatePath("/tareas");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/tareas");
}
