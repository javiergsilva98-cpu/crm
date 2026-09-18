"use client";

import { useRef, useState } from "react";
import { castVote } from "./actions";

export function CastForm({
  voteId,
  memberId,
  options,
}: {
  voteId: string;
  memberId: string;
  options: { id: string; label: string }[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="mt-3 flex flex-col gap-2"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await castVote(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
        }
      }}
    >
      <input type="hidden" name="vote_id" value={voteId} />
      <input type="hidden" name="member_id" value={memberId} />
      {options.map((o) => (
        <label
          key={o.id}
          className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <input type="radio" name="option_id" value={o.id} required className="h-4 w-4 accent-accent" />
          {o.label}
        </label>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Votar"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
