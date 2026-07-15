import { createClient } from "@/lib/supabase/server";
import { aggregateMetric } from "../informes/aggregate";
import { fetchRawData } from "../informes/raw-data";
import { HelpButton } from "@/components/help-button";

function formatAmount(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default async function PnlPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const dateFrom = from ?? null;
  const dateTo = to ?? null;

  const supabase = await createClient();
  const raw = await fetchRawData(supabase);

  const income = aggregateMetric(raw, "invoices_by_month", dateFrom, dateTo);
  const expenses = aggregateMetric(raw, "expenses_by_month", dateFrom, dateTo);
  const expensesByCategory = aggregateMetric(raw, "expenses_by_category", dateFrom, dateTo);
  const ivaDevengado = aggregateMetric(raw, "iva_devengado_by_month", dateFrom, dateTo);
  const ivaSoportado = aggregateMetric(raw, "iva_soportado_by_month", dateFrom, dateTo);

  const months = Array.from(new Set([...income.map((r) => r.sortKey), ...expenses.map((r) => r.sortKey)])).sort();

  const rows = months.map((key) => {
    const incomeRow = income.find((r) => r.sortKey === key);
    const expenseRow = expenses.find((r) => r.sortKey === key);
    const incomeAmount = Number(incomeRow?.amount ?? 0);
    const expenseAmount = Number(expenseRow?.amount ?? 0);
    return {
      key,
      label: incomeRow?.label ?? expenseRow?.label ?? key,
      income: incomeAmount,
      expense: expenseAmount,
      profit: incomeAmount - expenseAmount,
    };
  });

  const totalIncome = rows.reduce((sum, r) => sum + r.income, 0);
  const totalExpense = rows.reduce((sum, r) => sum + r.expense, 0);
  const totalProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : null;

  const ivaMonths = Array.from(new Set([...ivaDevengado.map((r) => r.sortKey), ...ivaSoportado.map((r) => r.sortKey)])).sort();
  const ivaRows = ivaMonths.map((key) => {
    const devengadoRow = ivaDevengado.find((r) => r.sortKey === key);
    const soportadoRow = ivaSoportado.find((r) => r.sortKey === key);
    const devengado = Number(devengadoRow?.amount ?? 0);
    const soportado = Number(soportadoRow?.amount ?? 0);
    return {
      key,
      label: devengadoRow?.label ?? soportadoRow?.label ?? key,
      devengado,
      soportado,
      diff: devengado - soportado,
    };
  });
  const totalIvaDevengado = ivaRows.reduce((sum, r) => sum + r.devengado, 0);
  const totalIvaSoportado = ivaRows.reduce((sum, r) => sum + r.soportado, 0);
  const ivaLiquidacion = totalIvaDevengado - totalIvaSoportado;

  return (
    <div>
      <h1 className="mb-1 flex items-center gap-2 font-heading text-3xl font-semibold text-ink">
        Cuenta de resultados (P&amp;L)
        <HelpButton slug="pnl-que-cuenta" label="Qué cuenta en el P&L" />
      </h1>
      <p className="mb-8 text-sm text-ink-mute">
        Ingresos (base imponible de facturas emitidas o pagadas, sin IVA) menos gastos, mes a mes. El IVA no es ingreso ni
        gasto del negocio — se lleva aparte, en las cajas de IVA de más abajo.
      </p>

      <form method="get" className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          type="date"
          name="from"
          defaultValue={from ?? ""}
          className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
        />
        <input
          type="date"
          name="to"
          defaultValue={to ?? ""}
          className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-ink sm:w-auto"
        />
        <button type="submit" className="w-full rounded-full bg-sunken px-4 py-1.5 text-sm text-ink-soft hover:text-ink sm:w-auto">
          Filtrar
        </button>
        {(from || to) && (
          <a href="/pnl" className="w-full rounded-full px-4 py-1.5 text-sm text-ink-mute hover:text-ink sm:w-auto">
            Limpiar
          </a>
        )}
      </form>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-raised p-6">
          <p className="text-sm text-ink-mute">Ingresos</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatAmount(totalIncome)}</p>
        </div>
        <div className="rounded-lg border border-border bg-raised p-6">
          <p className="text-sm text-ink-mute">Gastos</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatAmount(totalExpense)}</p>
        </div>
        <div className="rounded-lg border border-border bg-raised p-6">
          <p className="text-sm text-ink-mute">Beneficio neto</p>
          <p className={`mt-2 text-2xl font-semibold ${totalProfit >= 0 ? "text-ink" : "text-danger"}`}>
            {formatAmount(totalProfit)}
            {margin !== null && <span className="ml-2 text-sm font-normal text-ink-mute">({Math.round(margin)}% margen)</span>}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mb-8 rounded-lg border border-border bg-raised p-6 text-center">
          <p className="font-heading text-base text-ink">Todavía no hay datos para este periodo</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">Emite alguna factura o registra algún gasto para ver la cuenta de resultados.</p>
        </div>
      ) : (
        <div className="mb-8 overflow-x-auto rounded-lg border border-border bg-raised">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-strong bg-sunken">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Mes</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Ingresos</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Gastos</th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Beneficio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="px-4 py-2 text-ink-soft">{row.label}</td>
                  <td className="px-4 py-2 text-ink">{formatAmount(row.income)}</td>
                  <td className="px-4 py-2 text-ink">{formatAmount(row.expense)}</td>
                  <td className={`px-4 py-2 font-medium ${row.profit >= 0 ? "text-ink" : "text-danger"}`}>
                    {formatAmount(row.profit)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border-strong font-medium">
                <td className="px-4 py-2 text-ink">Total</td>
                <td className="px-4 py-2 text-ink">{formatAmount(totalIncome)}</td>
                <td className="px-4 py-2 text-ink">{formatAmount(totalExpense)}</td>
                <td className={`px-4 py-2 ${totalProfit >= 0 ? "text-ink" : "text-danger"}`}>{formatAmount(totalProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Cajas de IVA</h2>
        <p className="mb-4 text-sm text-ink-mute">
          El IVA que cobras en tus facturas no es tuyo: lo retienes para Hacienda. Aquí se compara con el IVA que tú
          pagas en tus gastos, para saber cuánto tocaría liquidar.
        </p>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-raised p-6">
            <p className="text-sm text-ink-mute">IVA devengado (repercutido)</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{formatAmount(totalIvaDevengado)}</p>
            <p className="mt-1 text-xs text-ink-mute">Cobrado en facturas emitidas</p>
          </div>
          <div className="rounded-lg border border-border bg-raised p-6">
            <p className="text-sm text-ink-mute">IVA soportado (deducible)</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{formatAmount(totalIvaSoportado)}</p>
            <p className="mt-1 text-xs text-ink-mute">Pagado en gastos</p>
          </div>
          <div className="rounded-lg border border-border bg-raised p-6">
            <p className="text-sm text-ink-mute">Liquidación de IVA</p>
            <p className={`mt-2 text-2xl font-semibold ${ivaLiquidacion >= 0 ? "text-ink" : "text-danger"}`}>
              {formatAmount(ivaLiquidacion)}
            </p>
            <p className="mt-1 text-xs text-ink-mute">
              {ivaLiquidacion >= 0 ? "A ingresar en Hacienda" : "A compensar / devolver"}
            </p>
          </div>
        </div>

        {ivaRows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border bg-raised">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-strong bg-sunken">
                <tr>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Mes</th>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">IVA devengado</th>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">IVA soportado</th>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {ivaRows.map((row) => (
                  <tr key={row.key} className="border-t border-border">
                    <td className="px-4 py-2 text-ink-soft">{row.label}</td>
                    <td className="px-4 py-2 text-ink">{formatAmount(row.devengado)}</td>
                    <td className="px-4 py-2 text-ink">{formatAmount(row.soportado)}</td>
                    <td className={`px-4 py-2 font-medium ${row.diff >= 0 ? "text-ink" : "text-danger"}`}>
                      {formatAmount(row.diff)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border-strong font-medium">
                  <td className="px-4 py-2 text-ink">Total</td>
                  <td className="px-4 py-2 text-ink">{formatAmount(totalIvaDevengado)}</td>
                  <td className="px-4 py-2 text-ink">{formatAmount(totalIvaSoportado)}</td>
                  <td className={`px-4 py-2 ${ivaLiquidacion >= 0 ? "text-ink" : "text-danger"}`}>{formatAmount(ivaLiquidacion)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {expensesByCategory.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Gastos por categoría</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-raised">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-strong bg-sunken">
                <tr>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Categoría</th>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Importe</th>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">% del gasto</th>
                </tr>
              </thead>
              <tbody>
                {expensesByCategory.map((row) => (
                  <tr key={row.sortKey} className="border-t border-border">
                    <td className="px-4 py-2 text-ink-soft">{row.label}</td>
                    <td className="px-4 py-2 text-ink">{formatAmount(Number(row.amount ?? 0))}</td>
                    <td className="px-4 py-2 text-ink-mute">
                      {totalExpense > 0 ? `${Math.round(((Number(row.amount ?? 0)) / totalExpense) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
