import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormEditor } from "./form-editor";
import type { FormField } from "../types";

export default async function FormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: form } = await supabase
    .from("forms")
    .select("id, name, fields, meta_pixel_id, google_ads_conversion_id, google_ads_conversion_label")
    .eq("id", id)
    .maybeSingle();

  if (!form) notFound();

  return (
    <FormEditor
      form={{ ...form, fields: (form.fields as FormField[]) ?? [] }}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
      supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}
    />
  );
}
