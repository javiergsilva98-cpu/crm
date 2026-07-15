"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DETAIL_FIELD_CATALOG, type DetailTableName } from "@/lib/detail-fields";

export async function saveDetailFields(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const tableName = String(formData.get("table_name") ?? "") as DetailTableName;
  if (!(tableName in DETAIL_FIELD_CATALOG)) return;

  let fields: string[] = [];
  try {
    fields = JSON.parse(String(formData.get("fields") ?? "[]"));
  } catch {
    return;
  }

  const validKeys = new Set(DETAIL_FIELD_CATALOG[tableName].map((f) => f.key));
  fields = fields.filter((key) => typeof key === "string" && validKeys.has(key));

  await supabase
    .from("detail_view_settings")
    .upsert({ owner_id: user.id, table_name: tableName, fields }, { onConflict: "owner_id,table_name" });

  const path = tableName === "companies" ? "/empresas" : tableName === "contacts" ? "/contactos" : "/oportunidades";
  revalidatePath(path);
}
