export const COMPANY_TYPES = ["prospecto", "partner", "revendedor", "proveedor", "otro"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  prospecto: "Prospecto",
  partner: "Partner",
  revendedor: "Revendedor",
  proveedor: "Proveedor",
  otro: "Otro",
};
