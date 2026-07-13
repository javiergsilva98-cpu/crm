"use client";

import { useRef } from "react";
import { updateStage } from "./actions";

const STAGES = ["nuevo", "calificado", "propuesta", "negociacion", "ganado", "perdido"];

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
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
