import type { SupabaseClient } from "@supabase/supabase-js";

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "protonmail.com",
]);

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/** Busca una empresa cuyo sitio web coincida con el dominio del email dado. */
export async function findCompanyByEmailDomain(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const domain = normalizeDomain(email.split("@")[1] ?? "");
  if (!domain || PUBLIC_EMAIL_DOMAINS.has(domain)) return null;

  const { data: companies } = await supabase.from("companies").select("id, website:nombre_dominio_empresa");

  const match = companies?.find(
    (company) => company.website && normalizeDomain(company.website) === domain,
  );

  return match?.id ?? null;
}
