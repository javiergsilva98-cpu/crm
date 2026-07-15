import { HelpSidebar } from "@/components/help-sidebar";

export default function AyudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <HelpSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
