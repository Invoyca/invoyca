"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export type OnboardingState = {
  companyComplete: boolean;
  hasClient: boolean;
  hasProduct: boolean;
  hasInvoice: boolean;
};

// Başlangıç adımları — gerçek duruma göre tamamlanan adımları işaretler, kullanıcıyı yönlendirir.
export function OnboardingChecklist({ state, t }: { state: OnboardingState; t: (s: string) => string }) {
  const steps = [
    { done: true, label: t("Hesap oluşturuldu"), href: null },
    { done: state.companyComplete, label: t("Şirket bilgilerini tamamla"), href: "/app/settings" },
    { done: state.hasClient, label: t("İlk müşterini ekle"), href: "/app/clients" },
    { done: state.hasProduct, label: t("İlk ürün veya hizmetini ekle"), href: "/app/products" },
    { done: state.hasInvoice, label: t("İlk faturanı oluştur"), href: "/app/invoices/new" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-slate-900">{t("Başlangıç adımları")}</h2>
        <span className="text-sm font-medium text-slate-500">{doneCount}/{steps.length} {t("tamamlandı")}</span>
      </div>
      {/* İlerleme çubuğu */}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
        <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-2">
        {steps.map((step, i) => {
          const inner = (
            <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${step.href && !step.done ? "hover:bg-slate-50 cursor-pointer" : ""}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${step.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}>
                {step.done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </span>
              <span className={`text-sm ${step.done ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>{step.label}</span>
            </div>
          );
          return (
            <li key={i}>
              {step.href && !step.done ? <Link href={step.href}>{inner}</Link> : inner}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
