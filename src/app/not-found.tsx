import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="mb-1 text-lg font-semibold tracking-tight text-foreground">Página no encontrada</h1>
        <p className="mb-6 text-sm text-muted">Esta pantalla no existe o se ha movido.</p>
        <Link
          href="/"
          className="inline-block w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
