"use client";

import { useState } from "react";
import { updateExpense, deleteExpense } from "./actions";
import { EXPENSE_CATEGORIES as CATEGORIES, EXPENSE_CATEGORY_LABELS as CATEGORY_LABELS } from "@/lib/expenses";

type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  tax_rate: number;
  expense_date: string;
  company_id: string | null;
  companies: { name: string } | null;
};

export function ExpenseRow({
  expense,
  companies,
}: {
  expense: Expense;
  companies: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const total = Number(expense.amount) * (1 + Number(expense.tax_rate) / 100);

  if (editing) {
    return (
      <tr className="border-t border-border bg-sunken">
        <td className="px-4 py-2" colSpan={6}>
          <form
            action={async (formData) => {
              await updateExpense(formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="id" value={expense.id} />
            <input
              name="description"
              defaultValue={expense.description}
              required
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <select name="category" defaultValue={expense.category} className="rounded-md border border-border px-2 py-1 text-sm">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              step="0.01"
              defaultValue={expense.amount}
              className="w-24 rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="tax_rate"
              type="number"
              step="0.01"
              defaultValue={expense.tax_rate}
              className="w-20 rounded-md border border-border px-2 py-1 text-sm"
            />
            <input
              name="expense_date"
              type="date"
              defaultValue={expense.expense_date}
              className="rounded-md border border-border px-2 py-1 text-sm"
            />
            <select name="company_id" defaultValue={expense.company_id ?? ""} className="rounded-md border border-border px-2 py-1 text-sm">
              <option value="">Sin empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md bg-calm px-3 py-1 text-sm text-base transition-colors hover:bg-calm-hover">
              Guardar
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-ink-soft underline">
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border transition-colors hover:bg-sunken">
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink">{expense.description}</td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink-soft">
        {CATEGORY_LABELS[expense.category as keyof typeof CATEGORY_LABELS] ?? expense.category}
      </td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink-soft">{expense.companies?.name ?? "—"}</td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink-soft">
        {new Date(expense.expense_date + "T00:00:00").toLocaleDateString("es-ES")}
      </td>
      <td className="overflow-hidden px-4 py-2 overflow-ellipsis whitespace-nowrap text-ink">{total.toFixed(2)}€</td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-ink-soft hover:underline">
            Editar
          </button>
          <form action={deleteExpense}>
            <input type="hidden" name="id" value={expense.id} />
            <button type="submit" className="text-danger hover:underline">
              Eliminar
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
