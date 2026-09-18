"use client";

import { useRef, useState } from "react";
import { createUserAccount } from "./actions";
import { CLUB_ROLES, CLUB_ROLE_LABELS } from "@/lib/demo-role";

export function UserForm({ members }: { members: { id: string; full_name: string }[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      action={async (formData) => {
        setPending(true);
        setError(null);
        setDone(false);
        const result = await createUserAccount(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
        setDone(true);
        setTimeout(() => setDone(false), 4000);
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Email</label>
        <input
          name="email"
          type="email"
          required
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Contraseña inicial</label>
        <input
          name="password"
          type="text"
          minLength={6}
          required
          placeholder="Mínimo 6 caracteres"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Rol</label>
        <select
          name="role"
          defaultValue="socio"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          {CLUB_ROLES.map((role) => (
            <option key={role} value={role}>
              {CLUB_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Vincular a socio (opcional)</label>
        <select
          name="member_id"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">Sin vincular</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear usuario"}
      </button>
      {done && <p className="w-full text-sm text-success">Cuenta creada. Comparte el email y la contraseña con esa persona.</p>}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
