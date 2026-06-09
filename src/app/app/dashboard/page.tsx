"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { createClient } from "@/lib/supabase/client";
import { listInvoices } from "../invoices/actions";
import { FileText, Clock, CheckCircle2, TrendingUp, Users, Plus } from "lucide-react";

export default function DashboardPage() {
  const { lang } = useLang();
  const t = (s: string) => appT(lang, s);
  const [name, setName] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    // getSession() yereldir, anında döner (getUser ağ beklemesi yapar → yavaş)
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (!u) {
        setIsGuest(true);
        setName("");
      } else {
        const full = u.user_metadata?.name || (u.email ? u.email.split("@")[0] : "");
        const firstName = full.split(" ")[0];
        setName(firstName);
      }
    });

    // Gerçek faturaları çek
    listInvoices().then((res) => {
      if (res.ok) setInvoices(res.invoices || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Saate göre selamlama
  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? t("İyi geceler") :
    hour < 12 ? t("Günaydın") :
    hour < 18 ? t("İyi günler") :
    t("İyi akşamlar");

  // Para birimi simgeleri
  const curSym: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", TRY: "₺" };

  // Faturaları para birimine göre grupla
  const byCurrency: Record<string, { total: number; paid: number; pending: number; count: number }> = {};
  for (const inv of invoices) {
    const cur = inv.currency || "EUR";
    if (!byCurrency[cur]) byCurrency[cur] = { total: 0, paid: 0, pending: 0, count: 0 };
    const amt = Number(inv.total || 0);
    byCurrency[cur].total += amt;
    byCurrency[cur].count += 1;
    if (inv.status === "PAID") byCurrency[cur].paid += amt;
    else byCurrency[cur].pending += amt;
  }
  const currencies = Object.keys(byCurrency);
  // Ana para birimi = en çok faturası olan
  const mainCur = currencies.sort((a, b) => byCurrency[b].count - byCurrency[a].count)[0] || "EUR";
  const multiCurrency = currencies.length > 1;

  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const pendingInvoices = invoices.filter((i) => i.status !== "PAID");
  const clientCount = new Set(invoices.map((i) => i.clientId).filter(Boolean)).size;

  const fmt = (n: number, cur: string) => (curSym[cur] || "€") + n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const m = byCurrency[mainCur] || { total: 0, paid: 0, pending: 0, count: 0 };
  const metrics = [
    { key: "total", label: t("Toplam Gelir"), value: fmt(m.total, mainCur), sub: `${invoices.length} ${t("fatura")}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { key: "pending", label: t("Bekleyen"), value: fmt(m.pending, mainCur), sub: `${pendingInvoices.length} ${t("fatura")}`, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { key: "paid", label: t("Ödenen"), value: fmt(m.paid, mainCur), sub: `${paidInvoices.length} ${t("fatura")}`, icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
    { key: "clients", label: t("Müşteriler"), value: String(clientCount), sub: "", icon: Users, color: "text-violet-600 bg-violet-50" },
  ];

  const recent = invoices.slice(0, 5);
  const hasData = invoices.length > 0;

  return (
    <div>
      {/* Karşılama */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white mb-6">
        <h1 className="text-xl font-semibold">
          {isGuest ? t("Hoş geldiniz") : `${greeting}${name ? `, ${name}` : ""}`}
        </h1>
        <p className="text-blue-100 text-sm mt-1">
          {isGuest
            ? t("Invoyca'yı keşfediyorsun. Kendi faturalarını oluşturmak için üye ol.")
            : loading
              ? "\u00A0"
              : hasData
                ? t("İşte güncel durumun.")
                : t("Başlamak için ilk faturanı oluştur.")}
        </p>
      </div>

      {/* Metrikler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div key={m.key} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500 mt-3">{m.label}</p>
            <p className="text-2xl font-semibold tracking-tight mt-0.5">{m.value}</p>
            {m.sub && <p className="text-xs text-slate-400 mt-1">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Çoklu para birimi uyarısı */}
      {multiCurrency && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-6 text-sm text-amber-800">
          {t("Birden fazla para birimi kullanıyorsun. Yukarıdaki tutarlar yalnızca")} {mainCur} {t("faturalarını gösterir.")}
          {" "}
          {currencies.filter((c) => c !== mainCur).map((c) => `${curSym[c] || c}${byCurrency[c].total.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`).join(" · ")} {t("diğer para birimlerinde mevcut.")}
        </div>
      )}

      {/* Son faturalar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("Son Faturalar")}</h2>
          {hasData && <Link href="/app/invoices" className="text-sm text-blue-600 hover:underline">{t("Tümünü gör")}</Link>}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">...</p>
        ) : hasData ? (
          <div className="space-y-2">
            {recent.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50">
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.client?.name || t("Müşteri")}</p>
                  <p className="text-xs text-slate-400">{inv.number}</p>
                </div>
                <span className="text-sm font-medium">{fmt(Number(inv.total || 0), inv.currency || "EUR")}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  inv.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {inv.status === "PAID" ? t("Ödendi") : t("Bekliyor")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          // Boş durum
          <div className="py-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mb-3">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-4">{t("Henüz faturan yok.")}</p>
            {!isGuest && (
              <Link href="/app/invoices/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
                <Plus className="h-4 w-4" /> {t("İlk Faturanı Oluştur")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
