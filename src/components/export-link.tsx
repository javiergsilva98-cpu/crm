import { DownloadIcon } from "@/components/icons";

export function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <DownloadIcon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
