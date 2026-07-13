"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveBusinessSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const field = (name: string) => String(formData.get(name) ?? "").trim() || null;

  await supabase.from("business_settings").upsert(
    {
      owner_id: user.id,
      legal_name: field("legal_name"),
      tax_id: field("tax_id"),
      address: field("address"),
      postal_code: field("postal_code"),
      city: field("city"),
      province: field("province"),
      country: field("country") ?? "España",
      email: field("email"),
      phone: field("phone"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );

  revalidatePath("/configuracion");
}
