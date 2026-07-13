"use client";

import { updatePaidAt } from "../actions";

export function PaidAtInput({ id, paidAt }: { id: string; paidAt: string | null }) {
  return (
    <form
      action={updatePaidAt}
      className="flex items-center justify-end gap-2 print:hidden"
    >
      <input type="hidden" name="id" value={id} />
      <label className="text-xs text-ink-mute">Pagada el</label>
      <input
        name="paid_at"
        type="date"
        defaultValue={paidAt ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-border bg-base px-2 py-1 text-sm text-ink"
      />
    </form>
  );
}
