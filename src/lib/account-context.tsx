"use client";

// Hesap + şirket bilgisini (getAccountInfo) uygulama genelinde BİR KERE yükler ve cache'ler.
// Böylece her sayfa/sekme açılışında sunucuya tekrar gidilmez → lag olmaz.
// Sayfalar `useAccount()` ile anında veriye erişir; veri değişince `refresh()` çağrılır.

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getAccountInfo } from "@/app/app/data-actions";

type AccountInfo = any; // server action'dan dönen ham yapı (view-model değil, esnek)

type AccountContextType = {
  info: AccountInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AccountContext = createContext<AccountContextType>({
  info: null,
  loading: true,
  refresh: async () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await getAccountInfo();
      if (res && (res as any).ok) setInfo(res);
    } catch {
      // sessiz geç — info null kalır, sayfalar boş gösterir
    } finally {
      setLoading(false);
    }
  }, []);

  // Uygulama açılınca bir kere yükle
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AccountContext.Provider value={{ info, loading, refresh }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
