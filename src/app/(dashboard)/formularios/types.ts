export type FieldType = "full_name" | "email" | "phone" | "company" | "text";

export type FormField = {
  id: string;
  type: FieldType;
  key: string;
  label: string;
  required: boolean;
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  full_name: "Nombre completo",
  email: "Email",
  phone: "Teléfono",
  company: "Empresa",
  text: "Campo de texto libre",
};

export const FIXED_FIELD_TYPES: FieldType[] = ["full_name", "email", "phone", "company"];

const DIACRITICS_RE = /[\u0300-\u036f]/g;

export function slugify(label: string) {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "campo";
}

export function uniqueKey(base: string, existing: string[]) {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}
