"use client";

import { useRef, useState } from "react";
import { createUserAccount } from "./actions";
import { CLUB_ROLES, CLUB_ROLE_LABELS } from "@/lib/demo-role";

type LastCreated = { email: string; password: string; memberName: string | null };

function buildInviteMessage({
  memberName,
  inviterName,
  email,
  password,
}: {
  memberName: string | null;
  inviterName: string;
  email: string;
  password: string;
}) {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  return `Bienvenido al club ${memberName ?? ""},

${inviterName} te invita a acceder a la App de gestión del Club. Para acceder podrás entrar en ${url} con tu usuario: ${email} y tu contraseña: ${password}.

Ten en cuenta que la contraseña es temporal y tendrás que cambiarla en tu primer inicio de sesión.

Gracias y bienvenido!`;
}

export function UserForm({
  members,
  inviterName,
}: {
  members: { id: string; full_name: string }[];
  inviterName: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<LastCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCopyInvite() {
    if (!lastCreated) return;
    const message = buildInviteMessage({ ...lastCreated, inviterName });
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      action={async (formData) => {
        setPending(true);
        setError(null);
        setLastCreated(null);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const memberId = formData.get("member_id") as string;
        const memberName = members.find((m) => m.id === memberId)?.full_name ?? null;
        const result = await createUserAccount(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
        setLastCreated({ email, password, memberName });
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
      {lastCreated && (
        <div className="w-full rounded-xl border border-success-soft bg-success-soft/40 p-2.5 text-xs">
          <p className="font-semibold text-foreground">
            Cuenta creada: <span className="font-mono">{lastCreated.email}</span>
          </p>
          <p className="mt-0.5 text-muted">
            Cópiale el mensaje de invitación ya redactado y pégalo donde quieras enviárselo.
          </p>
          <button
            type="button"
            onClick={handleCopyInvite}
            className="mt-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {copied ? "Copiado" : "Copiar invitación"}
          </button>
        </div>
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
