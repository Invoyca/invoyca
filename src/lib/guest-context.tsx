"use client";

// Ziyaretçi (üyeliksiz) modu yönetimi.
// - Giriş yapılmamışsa isGuest = true
// - Ziyaretçi bir "aksiyon" (kaydet/oluştur) denerse requireAuth() çağrılır,
//   bu da arka planı flu yapıp "üye ol" modalını açar (login'e fırlatmaz).

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { Sparkles, X } from "lucide-react";

type GuestCtx = {
  isGuest: boolean;
  loading: boolean;
  requireAuth: () => boolean; // true => izin var (üye); false => engellendi (ziyaretçi, modal açıldı)
};

const Ctx = createContext<GuestCtx>({ isGuest: false, loading: true, requireAuth: () => true });

export function useGuest() {
  return useContext(Ctx);
}

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { lang } = useLang();
  const L = (tr: string) => appT(lang, tr);

  useEffect(() => {
    const supabase = createClient();
    // getSession() yerel/anında; getUser() ağ beklemesi yapar (yavaş)
    supabase.auth.getSession().then(({ data }) => {
      setIsGuest(!data.session?.user);
      setLoading(false);
    });
  }, []);

  const requireAuth = () => {
    if (isGuest) {
      setShowModal(true);
      return false;
    }
    return true;
  };

  return (
    <Ctx.Provider value={{ isGuest, loading, requireAuth }}>
      {children}

      {/* Üye ol modalı — arka plan flu */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Flu arka plan */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          {/* Kart */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center border border-slate-100">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">{L("Üye olman gerekiyor")}</h2>
            <p className="text-sm text-slate-500 mb-6">
              {L("Kaydetmek, fatura kesmek ve verilerini saklamak için ücretsiz bir hesap oluştur. 2026 boyunca tamamen ücretsiz.")}
            </p>
            <div className="space-y-2">
              <Link href="/signup" className="block w-full rounded-lg bg-blue-600 text-white font-semibold py-2.5 hover:bg-blue-700">
                {L("Ücretsiz Üye Ol")}
              </Link>
              <Link href="/login" className="block w-full rounded-lg border border-slate-300 text-slate-700 font-medium py-2.5 hover:bg-slate-50">
                {L("Giriş Yap")}
              </Link>
            </div>
            <button onClick={() => setShowModal(false)} className="text-xs text-slate-400 hover:text-slate-600 mt-4">
              {L("Gezinmeye devam et")}
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
