import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "./change-password-form";

export default async function CambiarPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold tracking-tight text-foreground">Cambia tu contraseña</h1>
        <p className="mb-6 text-sm text-muted">
          Es la primera vez que entras (o te han restablecido el acceso). Elige una contraseña nueva
          para continuar.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
