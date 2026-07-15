"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findCompanyByEmailDomain } from "@/lib/match-company";
import { CHANNELS } from "@/lib/channels";

function parseSource(value: FormDataEntryValue | null): string | null {
  const source = String(value ?? "").trim();
  return (CHANNELS as readonly string[]).includes(source) ? source : null;
}

export async function createContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return;

  const email = String(formData.get("email") ?? "").trim();
  let companyId = String(formData.get("company_id") ?? "").trim() || null;

  if (!companyId && email) {
    companyId = await findCompanyByEmailDomain(supabase, email);
  }

  await supabase.from("contacts").insert({
    owner_id: user.id,
    full_name: fullName,
    email: email || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    phone_prefix: String(formData.get("phone_prefix") ?? "").trim() || null,
    phone_country: String(formData.get("phone_country") ?? "").trim() || null,
    company_id: companyId,
    source: parseSource(formData.get("source")),
    source_detail: String(formData.get("source_detail") ?? "").trim() || null,
    source_url: String(formData.get("source_url") ?? "").trim() || null,
    tax_id: String(formData.get("tax_id") ?? "").trim() || null,
    fiscal_address: String(formData.get("fiscal_address") ?? "").trim() || null,
  });

  revalidatePath("/contactos");
}

export async function updateContact(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return;

  const email = String(formData.get("email") ?? "").trim();
  let companyId = String(formData.get("company_id") ?? "").trim() || null;

  if (!companyId && email) {
    companyId = await findCompanyByEmailDomain(supabase, email);
  }

  await supabase
    .from("contacts")
    .update({
      full_name: fullName,
      email: email || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      phone_prefix: String(formData.get("phone_prefix") ?? "").trim() || null,
      phone_country: String(formData.get("phone_country") ?? "").trim() || null,
      company_id: companyId,
      source: parseSource(formData.get("source")),
      source_detail: String(formData.get("source_detail") ?? "").trim() || null,
      source_url: String(formData.get("source_url") ?? "").trim() || null,
      tax_id: String(formData.get("tax_id") ?? "").trim() || null,
      fiscal_address: String(formData.get("fiscal_address") ?? "").trim() || null,
    })
    .eq("id", id);

  revalidatePath("/contactos");
}

export async function deleteContact(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("contacts").delete().eq("id", id);
  revalidatePath("/contactos");
}

type ImportRow = { full_name: string; email: string; phone: string; empresa: string; source: string };

function normalizeSource(value: string): string | null {
  const v = value.trim().toLowerCase();
  return (CHANNELS as readonly string[]).includes(v) ? v : null;
}

export async function importContacts(
  rows: ImportRow[],
): Promise<{ imported: number; skipped: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { imported: 0, skipped: rows.length };

  const { data: companies } = await supabase.from("companies").select("id, name, website");

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const fullName = row.full_name.trim();
    if (!fullName) {
      skipped++;
      continue;
    }

    const email = row.email.trim();
    let companyId: string | null = null;

    if (row.empresa.trim()) {
      const byName = companies?.find(
        (c) => c.name.toLowerCase() === row.empresa.trim().toLowerCase(),
      );
      companyId = byName?.id ?? null;
    }
    if (!companyId && email) {
      companyId = await findCompanyByEmailDomain(supabase, email);
    }

    const { error } = await supabase.from("contacts").insert({
      owner_id: user.id,
      full_name: fullName,
      email: email || null,
      phone: row.phone.trim() || null,
      company_id: companyId,
      source: normalizeSource(row.source),
    });

    if (error) {
      skipped++;
    } else {
      imported++;
    }
  }

  revalidatePath("/contactos");
  return { imported, skipped };
}
