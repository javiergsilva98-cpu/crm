"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos.",
  "User already registered": "Ya existe una cuenta con ese email.",
  "Email not confirmed": "Debes confirmar tu email antes de iniciar sesión.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
  "Unable to validate email address: invalid format": "El formato del email no es válido.",
  "Email rate limit exceeded": "Se enviaron demasiadas solicitudes. Inténtalo de nuevo en unos minutos.",
};

function translateAuthError(message: string): string {
  return AUTH_ERROR_MESSAGES[message] ?? message;
}

function LoginForm() {
  const inviteId = useSearchParams().get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(translateAuthError(error.message));
      } else {
        window.location.href = "/";
      }
    } else {
      const redirectUrl = new URL("/auth/callback", window.location.origin);
      redirectUrl.searchParams.set("next", "/");
      if (inviteId) redirectUrl.searchParams.set("invite", inviteId);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl.toString() },
      });

      if (error) {
        setMessage(translateAuthError(error.message));
      } else {
        // Si la confirmación de email está desactivada, ya hay sesión activa:
        // consumimos la invitación ahora mismo en vez de esperar al callback.
        if (data.session && inviteId) {
          await supabase.rpc("consume_invite", { invite_id: inviteId });
        }
        setMessage("Cuenta creada. Revisa tu correo para confirmar el registro.");
      }
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-raised p-8 shadow-sm">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-ink">
        {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
      </h1>
      {inviteId && (
        <p className="mb-4 rounded-md border border-border bg-sunken px-3 py-2 text-xs text-ink-soft">
          Te han invitado a este CRM. Crea tu cuenta para unirte.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm text-ink tracking-widest"
          />
        </div>
        {message && <p className="text-sm text-danger">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-calm px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-calm-hover disabled:opacity-50"
        >
          {loading ? "Cargando..." : mode === "signin" ? "Entrar" : "Registrarme"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 text-sm text-ink-soft underline"
      >
        {mode === "signin" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sunken px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
