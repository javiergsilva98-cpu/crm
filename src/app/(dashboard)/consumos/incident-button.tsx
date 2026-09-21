"use client";

import { useState } from "react";
import { reportIncident } from "./actions";

export function IncidentButton({
  consumptionId,
  reporterMemberId,
}: {
  consumptionId: string;
  reporterMemberId: string;
}) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");

  async function handleClick() {
    if (!window.confirm("¿Reportar esta consumición como incorrecta? Un responsable la revisará.")) {
      return;
    }
    setState("pending");
    const fd = new FormData();
    fd.set("consumption_id", consumptionId);
    fd.set("member_id", reporterMemberId);
    const result = await reportIncident(fd);
    if (result && "error" in result && result.error) {
      setState("error");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return <span className="text-[10px] font-semibold text-muted">Reportada</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "pending"}
      className="text-[10px] font-semibold text-muted underline decoration-dotted underline-offset-2 transition-colors hover:text-warning disabled:opacity-50"
    >
      {state === "pending" ? "..." : state === "error" ? "Error, reintentar" : "Reportar incidencia"}
    </button>
  );
}
