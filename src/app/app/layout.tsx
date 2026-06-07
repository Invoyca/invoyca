import { LangProvider } from "@/lib/lang-context";
import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AppShell>{children}</AppShell>
    </LangProvider>
  );
}
