"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Plus, LogOut, Settings as SettingsIcon, UserPlus } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { LangSwitcher } from "./LangSwitcher";
import { useGuest } from "@/lib/guest-context";
import { createClient } from "@/lib/supabase/client";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useLang();
  const router = useRouter();
  const { isGuest, requireAuth } = useGuest();
  const [menuOpen, setMenuOpen] = useState(false);
  const [initials, setInitials] = useState("");
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Aramayı faturalar sayfasına taşı (orada arama kutusu çalışıyor)
    router.push(`/app/invoices?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Kullanıcının baş harflerini hesapla
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (!u) { setInitials(""); return; }
      const full = (u.user_metadata?.name || "").trim();
      if (full) {
        const parts = full.split(" ").filter(Boolean);
        const ini = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]) : full.slice(0, 2);
        setInitials(ini.toUpperCase());
      } else if (u.email) {
        // İsim yoksa e-postadan iki harf
        setInitials(u.email.slice(0, 2).toUpperCase());
      }
    });
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-20">
      <button className="lg:hidden text-slate-500" onClick={onMenu} aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={doSearch} className="relative hidden md:block flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
      </form>

      <div className="ml-auto flex items-center gap-3">
        {isGuest ? (
          // Ziyaretçi: üye ol çağrısı
          <Link href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-3.5 py-2 hover:bg-blue-700">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("signup_cta")}</span>
          </Link>
        ) : (
          <Link href="/app/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-3.5 py-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("new_invoice")}</span>
          </Link>
        )}
        <LangSwitcher />

        {isGuest ? (
          // Ziyaretçi avatarı: misafir simgesi, tıklayınca üye ol
          <button onClick={() => requireAuth()}
            className="h-8 w-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-semibold pl-2 border-l border-slate-200">
            ?
          </button>
        ) : (
          <div className="relative pl-2 border-l border-slate-200" ref={ref}>
            <button onClick={() => setMenuOpen((v) => !v)}
              className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
              {initials || "•"}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-xl py-1 z-50">
                <Link href="/app/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <SettingsIcon className="h-4 w-4" /> {t("nav_settings")}
                </Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left">
                    <LogOut className="h-4 w-4" /> {t("logout")}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
