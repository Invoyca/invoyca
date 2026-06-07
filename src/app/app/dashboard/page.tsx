"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { createClient } from "@/lib/supabase/client";
import { FileText, Clock, CheckCircle2, TrendingUp, Users } from "lucide-react";

const METRICS = [
  { key: "total", label: "Toplam Gelir", value: "€12.450", sub: "+12%", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
  { key: "pending", label: "Bekleyen", value: "€3.200", sub: "4 fatura", icon: Clock, color: "text-amber-600 bg-amber-50" },
  { key: "paid", label: "Ödenen", value: "€9.250", sub: "18 fatura", icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
  { key: "clients", label: "Müşteriler", value: "24", sub: "+3 bu ay", icon: Users, color: "text-violet-600 bg-violet-50" },
];

export default function DashboardPage() {
  const { lang } = useLang();
  const t = (s: string) => appT(lang, s);
  const [name, setName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const display = u.user_metadata?.name || (u.email ? u.email.split("@")[0] : "");
      setName(display);
    });
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? t("İyi geceler") :
    hour < 12 ? t("Günaydın") :
    hour < 18 ? t("İyi günler") :
    t("İyi akşamlar");

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white mb-6">
        <h1 className="text-xl font-semibold">
          {greeting}{name ? `, ${name}` : ""}
        </h1>
        <p className="text-blue-100 text-sm mt-1">
          {t("Bu ay 3 fatura kestin ve €9.250 tahsil ettin. 4 fatura ödeme bekliyor.")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {METRICS.map((m) => (
          <div key={m.key} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500 mt-3">{t(m.label)}</p>
            <p className="text-2xl font-semibold tracking-tight mt-0.5">{m.value}</p>
            <p className="text-xs text-slate-400 mt-1">{t(m.sub)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("Son Faturalar")}</h2>
          <button className="text-sm text-blue-600 hover:underline">{t("Tümünü gör")}</button>
        </div>
        <div className="space-y-2">
          {[
            { no: "2026-0042", client: "Bright Sample Company", amount: "€3.540", status: "paid" },
            { no: "2026-0041", client: "Example Trading Co.", amount: "€1.200", status: "pending" },
            { no: "2026-0040", client: "Demo Industries", amount: "€890", status: "paid" },
          ].map((inv) => (
            <div key={inv.no} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50">
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{inv.client}</p>
                <p className="text-xs text-slate-400">{inv.no}</p>
              </div>
              <span className="text-sm font-medium">{inv.amount}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                {inv.status === "paid" ? t("Ödendi") : t("Bekliyor")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
