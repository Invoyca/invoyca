import { LangProvider } from "@/lib/lang-context";
import { AppShell } from "@/components/AppShell";
import { GuestProvider } from "@/lib/guest-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { ToastProvider } from "@/lib/toast-context";
import { AccountProvider } from "@/lib/account-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <GuestProvider>
        <ConfirmProvider>
          <ToastProvider>
            <AccountProvider>
              <AppShell>{children}</AppShell>
            </AccountProvider>
          </ToastProvider>
        </ConfirmProvider>
      </GuestProvider>
    </LangProvider>
  );
}
