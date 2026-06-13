"use client";

import Link from "next/link";
import { FilePlus, UserPlus, PackagePlus, Eye } from "lucide-react";

// Hızlı işlemler — kullanıcının en çok yapacağı işlemler kart olarak.
export function QuickActions({ t, onSample }: { t: (s: string) => string; onSample?: () => void }) {
  const actions = [
    { icon: FilePlus, title: t("Yeni Fatura"), desc: t("Müşteriye hazır PDF fatura oluştur."), href: "/app/invoices/new" },
    { icon: UserPlus, title: t("Müşteri Ekle"), desc: t("Bir kez kaydet, sonraki faturalarında tekrar kullan."), href: "/app/clients" },
    { icon: PackagePlus, title: t("Ürün / Hizmet Ekle"), desc: t("Sık kullandığın hizmetleri kaydet."), href: "/app/products" },
    { icon: Eye, title: t("Örnek Fatura Gör"), desc: t("PDF kalitesini oluşturmadan önce gör."), href: "/app/templates" },
  ];
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">{t("Hızlı işlemler")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((a, i) => (
          <Link key={i} href={a.href}
            className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <a.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{a.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
