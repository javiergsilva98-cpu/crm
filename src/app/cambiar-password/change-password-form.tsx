"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("La contraseña tiene que tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("Las dos contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setMessage(updateError.message);
      setLoading(false);
      return;
    }

    if (userData.user) {
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", userData.user.id);
    }

    window.location.href = "/";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Nueva contraseña</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Repite la contraseña</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
