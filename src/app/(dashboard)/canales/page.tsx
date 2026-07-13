import { createClient } from "@/lib/supabase/server";
import { CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/channels";
import { currentMonthRange, currentMonthKey } from "@/lib/month";
import { saveChannelSpend } from "./actions";

export default async function CanalesPage() {
  const supabase = await createClient();
  const { start, end } = currentMonthRange();
  const month = currentMonthKey();

  const [{ data: contacts }, { data: spend }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, source")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
    supabase.from("channel_spend").select("channel, amount").eq("month", month),
  ]);

  const countByChannel = new Map<Channel, number>();
  let withoutSource = 0;
  for (const c of contacts ?? []) {
    if (c.source && (CHANNELS as readonly string[]).includes(c.source)) {
      countByChannel.set(c.source as Channel, (countByChannel.get(c.source as Channel) ?? 0) + 1);
    } else {
      withoutSource++;
    }
  }
  const totalWithSource = [...countByChannel.values()].reduce((a, b) => a + b, 0);
  const totalContacts = totalWithSource + withoutSource;

  const spendByChannel = new Map<Channel, number>();
  for (const s of spend ?? []) {
    spendByChannel.set(s.channel as Channel, Number(s.amount));
  }

  const rows = CHANNELS.map((channel) => {
    const count = countByChannel.get(channel) ?? 0;
    const amount = spendByChannel.get(channel) ?? 0;
    const costPerContact = count > 0 ? amount / count : null;
    return { channel, count, amount, costPerContact };
  });

  const withCost = rows.filter((r) => r.costPerContact !== null && r.amount > 0);
  const cheapest = withCost.length > 0 ? withCost.reduce((a, b) => (a.costPerContact! < b.costPerContact! ? a : b)) : null;
  const priciest = withCost.length > 1 ? withCost.reduce((a, b) => (a.costPerContact! > b.costPerContact! ? a : b)) : null;

  const breakdownPhrase =
    totalWithSource > 0
      ? CHANNELS.filter((c) => (countByChannel.get(c) ?? 0) > 0)
          .sort((a, b) => (countByChannel.get(b) ?? 0) - (countByChannel.get(a) ?? 0))
          .map((c) => {
            const count = countByChannel.get(c) ?? 0;
            const outOfTen = Math.round((count / totalWithSource) * 10);
            return `${outOfTen} de ${CHANNEL_LABELS[c]}`;
          })
          .join(", ")
      : null;

  const hasInsight = breakdownPhrase !== null;

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl font-semibold text-ink">Canales</h1>
      <p className="mb-6 text-sm text-ink-mute">De dónde vienen tus contactos este mes y cuánto te cuesta cada uno.</p>

      <div
        className="mb-8 rounded-lg border p-6"
        style={
          hasInsight
            ? { borderColor: "var(--accent-signal)", background: "var(--accent-signal-wash)" }
            : { borderColor: "var(--border-subtle)", background: "var(--bg-raised)" }
        }
      >
        {breakdownPhrase ? (
          <p className="flex items-start gap-2 text-sm text-ink">
            <span className="mt-0.5 text-signal">✦</span>
            <span>
              De cada 10 contactos este mes, <strong>{breakdownPhrase}</strong>
              {withoutSource > 0 && ` (${withoutSource} sin canal indicado)`}.
            </span>
          </p>
        ) : (
          <p className="text-sm text-ink-mute">
            Todavía no hay contactos con canal de origen este mes. Indica de dónde vino cada contacto nuevo al crearlo y esta pantalla se rellenará sola.
          </p>
        )}
        {cheapest && priciest && cheapest.channel !== priciest.channel && (
          <p className="mt-2 pl-6 text-sm text-ink">
            Los contactos de <strong>{CHANNEL_LABELS[cheapest.channel]}</strong> te cuestan{" "}
            {priciest.costPerContact! / cheapest.costPerContact! >= 1.8 ? "menos de la mitad" : "menos"} que los de{" "}
            <strong>{CHANNEL_LABELS[priciest.channel]}</strong> este mes (
            {cheapest.costPerContact!.toFixed(2)}€ vs {priciest.costPerContact!.toFixed(2)}€ por contacto).
          </p>
        )}
        <p className="mt-3 pl-6 text-xs text-ink-mute">{totalContacts} contactos nuevos este mes en total.</p>
      </div>

      <form action={saveChannelSpend} className="overflow-hidden rounded-lg border border-border bg-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-strong bg-sunken">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Canal</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Contactos este mes</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Gasto este mes</th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Coste por contacto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.channel} className="border-t border-border">
                <td className="px-4 py-2 text-ink">{CHANNEL_LABELS[row.channel]}</td>
                <td className="px-4 py-2 text-ink-soft">{row.count}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span className="text-ink-mute">€</span>
                    <input
                      name={`spend_${row.channel}`}
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={row.amount || ""}
                      placeholder="0"
                      className="w-24 rounded-md border border-border bg-base px-2 py-1 text-sm text-ink"
                    />
                  </div>
                </td>
                <td className="px-4 py-2 text-ink">
                  {row.costPerContact !== null ? `${row.costPerContact.toFixed(2)}€` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-border p-4">
          <button type="submit" className="rounded-md bg-calm px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-calm-hover">
            Guardar gasto del mes
          </button>
        </div>
      </form>
    </div>
  );
}
