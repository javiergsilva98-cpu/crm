import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base px-4 text-center">
      <svg width="40" height="40" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-ink-mute">
        <path d="M3 9.5 10 3l7 6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 8.5V16a1 1 0 0 0 1 1h3v-4.5h2V17h3a1 1 0 0 0 1-1V8.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <p className="font-heading text-2xl font-semibold text-ink">Página no encontrada</p>
        <p className="mt-1 text-sm text-ink-mute">Lo que buscas no existe o se ha movido.</p>
      </div>
      <Link href="/" className="rounded-md bg-calm px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-calm-hover">
        Volver al inicio
      </Link>
    </div>
  );
}
