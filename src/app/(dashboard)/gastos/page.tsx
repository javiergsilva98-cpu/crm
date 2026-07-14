import { createClient } from "@/lib/supabase/server";
import { createExpense } from "./actions";
import { ExpenseRow } from "./expense-row";
import { AddDisclosure } from "@/components/add-disclosure";
import { EmptyStateRow } from "@/components/empty-state";
import { EXPENSE_CATEGORIES as CATEGORIES, EXPENSE_CATEGORY_LABELS as CATEGORY_LABELS } from "@/lib/expenses";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string; categoria?: string }>;
}) {
  const { empresa, categoria } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select("id, description, category, amount, tax_rate, expense_date, company_id, companies!company_id(name)")
    .order("expense_date", { ascending: false });

  if (empresa) query = query.eq("company_id", empresa);
  if (categoria) query = query.eq("category", categoria);

  const [{ data: expenses, error: expensesError }, { data: companies }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
  ]);

  const totals = (expenses ?? []).reduce(
    (acc, e) => {
      const base = Number(e.amount);
      const tax = base * (Number(e.tax_rate) / 100);
      acc.base += base;
      acc.tax += tax;
      acc.total += base + tax;
      return acc;
    },
    { base: 0, tax: 0, total: 0 },
  );

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl font-semibold text-ink">Gastos</h1>
      <p className="mb-8 text-sm text-ink-mute">Lo que te gastas en el negocio, con el IVA soportado.</p>

      <AddDisclosure label="Agregar gasto">
        <form action={createExpense} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input name="description" placeholder="Concepto" required className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
          <select name="category" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input name="amount" type="number" step="0.01" placeholder="Importe (sin IVA)" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-36" />
          <input name="tax_rate" type="number" step="0.01" defaultValue={21} placeholder="IVA %" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-24" />
          <input name="expense_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto" />
          <select name="company_id" className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto">
            <option value="">Sin empresa</option>
            {companies?.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <button type="submit" className="w-full rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover sm:w-auto">
            Agregar
          </button>
        </form>
      </AddDisclosure>

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row">
        <select name="empresa" defaultValue={empresa ?? ""} className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft sm:w-auto">
          <option value="">Todas las empresas</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <select name="categoria" defaultValue={categoria ?? ""} className="w-full rounded-full border-none bg-sunken px-4 py-1.5 text-sm text-ink-soft sm:w-auto">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button type="submit" className="w-full rounded-full bg-sunken px-4 py-1.5 text-sm text-ink-soft hover:text-ink sm:w-auto">
          Filtrar
        </button>
      </form>

      {expensesError && (
        <div className="mb-6 rounded-lg border border-danger bg-raised p-4 text-sm text-danger">
          Error al cargar los gastos: {expensesError.message}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-raised p-4">
          <p className="text-sm text-ink-mute">Base imponible</p>
          <p className="mt-1 text-xl font-semibold text-ink">{totals.base.toFixed(2)}€</p>
        </div>
        <div className="rounded-lg border border-border bg-raised p-4">
          <p className="text-sm text-ink-mute">IVA soportado</p>
          <p className="mt-1 text-xl font-semibold text-ink">{totals.tax.toFixed(2)}€</p>
        </div>
        <div className="rounded-lg border border-border bg-raised p-4">
          <p className="text-sm text-ink-mute">Total</p>
          <p className="mt-1 text-xl font-semibold text-ink">{totals.total.toFixed(2)}€</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Concepto</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Categoría</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Empresa</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Fecha</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Total</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {expenses?.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={{
                  ...expense,
                  companies: (expense.companies as unknown as { name: string } | null) ?? null,
                }}
                companies={companies ?? []}
              />
            ))}
            {expenses?.length === 0 &&
              (empresa || categoria ? (
                <EmptyStateRow colSpan={6} title="Sin resultados" body="Ningún gasto coincide con este filtro." />
              ) : (
                <EmptyStateRow colSpan={6} title="Todavía no tienes gastos" body="Añade el primero con el botón + de arriba." />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
