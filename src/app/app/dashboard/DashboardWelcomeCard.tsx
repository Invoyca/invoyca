"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Hoş geldin kartı — ürün değerini tekrar söyler, kullanıcıyı ilk faturaya/şirket ayarına yönlendirir.
export function DashboardWelcomeCard({ name, companyComplete, t }: { name: string; companyComplete: boolean; t: (s: string) => string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-7 sm:p-8 text-white shadow-sm">
      {/* Sağda hafif fatura çizimi (dekoratif, çok opak değil) */}
      <div className="pointer-events-none absolute -right-6 -top-6 hidden sm:block opacity-[0.12]" aria-hidden="true">
        <svg width="220" height="260" viewBox="0 0 220 260" fill="none">
          <rect x="20" y="14" width="180" height="232" rx="12" fill="white" />
          <rect x="40" y="40" width="70" height="10" rx="5" fill="#1d4ed8" />
          <rect x="40" y="64" width="120" height="6" rx="3" fill="#93c5fd" />
          <rect x="40" y="78" width="100" height="6" rx="3" fill="#bfdbfe" />
          <rect x="40" y="118" width="140" height="6" rx="3" fill="#dbeafe" />
          <rect x="40" y="134" width="140" height="6" rx="3" fill="#dbeafe" />
          <rect x="40" y="150" width="90" height="6" rx="3" fill="#dbeafe" />
          <rect x="110" y="196" width="70" height="10" rx="5" fill="#1d4ed8" />
        </svg>
      </div>

      <div className="relative max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("Hoş geldin")}{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
          {t("Uluslararası müşterilerine gönderebileceğin ilk PDF faturanı birkaç dakika içinde oluştur.")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/app/invoices/new"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
            {t("Yeni Fatura Oluştur")} <ArrowRight className="h-4 w-4" />
          </Link>
          {!companyComplete && (
            <Link href="/app/settings?tab=company"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
              {t("Şirket Bilgilerini Tamamla")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
