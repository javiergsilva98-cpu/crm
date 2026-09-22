"use client";

import { useRef, useState } from "react";
import { createMemberAccount } from "./actions";
import { CLUB_ROLES, CLUB_ROLE_LABELS, type ClubRole } from "@/lib/demo-role";
import { generatePassword } from "@/lib/generate-password";

const MEMBER_ROLES = CLUB_ROLES.filter((r): r is ClubRole => r !== "admin");

function buildInviteMessage({
  memberName,
  inviterName,
  email,
  password,
}: {
  memberName: string;
  inviterName: string;
  email: string;
  password: string;
}) {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  return `Bienvenido al club ${memberName},

${inviterName} te invita a acceder a la App de gestión del Club. Para acceder podrás entrar en ${url} con tu usuario: ${email} y tu contraseña: ${password}.

Ten en cuenta que la contraseña es temporal y tendrás que cambiarla en tu primer inicio de sesión.

Gracias y bienvenido!`;
}

export function MemberForm({
  suggestedKeyNumber,
  inviterName,
}: {
  suggestedKeyNumber: string;
  inviterName: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ fullName: string; email: string; password: string } | null>(null);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCopyInvite() {
    if (!created) return;
    const message = buildInviteMessage({ memberName: created.fullName, inviterName, email: created.email, password: created.password });
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (created) {
    return (
      <div className="rounded-[18px] border border-success-soft bg-success-soft/40 p-4 text-sm">
        <p className="font-bold text-foreground">Cuenta creada</p>
        <p className="mt-1 text-foreground">
          Usuario: <span className="font-mono">{created.email}</span>
        </p>
        <p className="text-foreground">
          Contraseña: <span className="font-mono">{created.password}</span>
        </p>
        <p className="mt-1.5 text-muted">
          Entrégaselas ahora — no se volverán a mostrar. Al entrar, tendrá que cambiar la contraseña
          antes de poder usar el resto de la app.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {copied ? "Copiado" : "Copiar invitación"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setPassword("");
            }}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent"
          >
            Dar de alta a otro socio
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-[18px] border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await createMemberAccount(formData);
        setPending(false);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        if (result && "password" in result) {
          setCreated({
            fullName: formData.get("full_name") as string,
            email: formData.get("email") as string,
            password: result.password,
          });
          formRef.current?.reset();
        }
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-muted">Nombre completo</label>
        <input
          name="full_name"
          required
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Correo electrónico</label>
        <input
          name="email"
          type="email"
          required
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Rol</label>
        <select
          name="club_role"
          defaultValue="socio"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          {MEMBER_ROLES.map((role) => (
            <option key={role} value={role}>
              {CLUB_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Nº de socio</label>
        <input
          name="key_number"
          defaultValue={suggestedKeyNumber}
          className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Contraseña provisional</label>
        <div className="flex gap-1.5">
          <input
            name="password"
            type="text"
            required
            minLength={8}
            placeholder="Genera una →"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-36 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            aria-label="Generar contraseña"
            className="rounded-xl border border-border px-2.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
          >
            ↻ Generar
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Dando de alta..." : "Dar de alta"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
