"use client";

import { useRef } from "react";
import { updateStage } from "./actions";
import { STAGES, STAGE_LABELS } from "@/lib/stages";

export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateStage}>
      <input type="hidden" name="id" value={id} />
      <select
        name="stage"
        defaultValue={stage}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-border px-2 py-1 text-sm"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
