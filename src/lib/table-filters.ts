export type FilterOp = "contains" | "not_contains" | "exact" | "not_exact";

export type TableFilter = { field: string; op: FilterOp; value: string };

export const FILTER_OP_LABELS: Record<FilterOp, string> = {
  contains: "contiene",
  not_contains: "no contiene",
  exact: "coincide exactamente",
  not_exact: "no coincide exactamente",
};

export function parseFilters(raw: string | undefined): TableFilter[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (f): f is TableFilter =>
        f &&
        typeof f.field === "string" &&
        typeof f.value === "string" &&
        f.value.trim() !== "" &&
        (["contains", "not_contains", "exact", "not_exact"] as const).includes(f.op),
    );
  } catch {
    return [];
  }
}

// Query mínimamente tipado: solo necesitamos ilike/not, que existen en
// cualquier PostgrestFilterBuilder de supabase-js.
type FilterableQuery = {
  ilike: (column: string, pattern: string) => FilterableQuery;
  not: (column: string, operator: string, pattern: string) => FilterableQuery;
};

export function applyFilters<T extends FilterableQuery>(query: T, filters: TableFilter[]): T {
  let q = query;
  for (const f of filters) {
    const escaped = f.value.replace(/[%_]/g, "\\$&");
    if (f.op === "contains") q = q.ilike(f.field, `%${escaped}%`) as T;
    else if (f.op === "not_contains") q = q.not(f.field, "ilike", `%${escaped}%`) as T;
    else if (f.op === "exact") q = q.ilike(f.field, escaped) as T;
    else q = q.not(f.field, "ilike", escaped) as T;
  }
  return q;
}
