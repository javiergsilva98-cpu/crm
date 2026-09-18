"use client";

import { useState } from "react";
import { ShieldIcon } from "@/components/icons";
import { type AuditRow, tableLabel, actionLabel, summaryLine } from "./summarize";

const ACTION_TONE: Record<string, string> = {
  insert: "bg-success-soft text-success",
  update: "bg-accent-soft text-accent",
  delete: "bg-warning-soft text-warning",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export function AuditEntryRow({ row, isLast }: { row: AuditRow; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const hasDetails = row.old_data || row.new_data;

  return (
    <div className={`px-3.5 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <button
        type="button"
        onClick={() => hasDetails && setOpen((v) => !v)}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft">
          <ShieldIcon className="h-4 w-4 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{tableLabel(row.table_name)}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ACTION_TONE[row.action] ?? ""}`}>
              {actionLabel(row.action)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{summaryLine(row)}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {row.actor_email ?? "Sistema"} · {formatDateTime(row.created_at)}
          </p>
        </div>
      </button>
      {open && hasDetails && (
        <pre className="mt-2 overflow-x-auto rounded-xl bg-background p-2.5 text-[10px] leading-relaxed text-muted">
          {JSON.stringify(row.new_data ?? row.old_data, null, 2)}
        </pre>
      )}
    </div>
  );
}
