import { LangProvider } from "@/lib/lang-context";
import { AppShell } from "@/components/AppShell";
import { GuestProvider } from "@/lib/guest-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <GuestProvider>
        <AppShell>{children}</AppShell>
      </GuestProvider>
    </LangProvider>
  );
}
