"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { createClient } from "@/lib/supabase/client";
import { FileText, Clock, CheckCircle2, TrendingUp, Users, Plus, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function DashboardClient({ initialInvoices, clientCount = 0 }: { initialInvoices: any[]; clientCount?: number }) {
  const { lang } = useLang();
  const t = (s: string) => appT(lang, s);
  const [name, setName] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>(initialInvoices || []);
  const [curIndex, setCurIndex] = useState(0);   // çoklu para biriminde hangi para birimi gösteriliyor
  const [openDetail, setOpenDetail] = useState<string | null>(null);   // tıklanan kartın detayı

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
    if (inv.status === "CANCELLED") continue;   // iptal edilenler hiçbir toplama girmez
    const cur = inv.currency || "EUR";
    if (!byCurrency[cur]) byCurrency[cur] = { total: 0, paid: 0, pending: 0, count: 0 };
    const amt = Number(inv.total || 0);
    byCurrency[cur].total += amt;
    byCurrency[cur].count += 1;
    if (inv.status === "PAID") byCurrency[cur].paid += amt;
    else byCurrency[cur].pending += amt;
  }
  const currencies = Object.keys(byCurrency);
  // Para birimleri en çok faturası olandan aza doğru sıralı
  const sortedCurrencies = [...currencies].sort((a, b) => byCurrency[b].count - byCurrency[a].count);
  const multiCurrency = sortedCurrencies.length > 1;
  // Seçili para birimi (oklarla değişir). Index sınırın dışına çıkarsa ilkine dön.
  const activeCur = sortedCurrencies[curIndex] || sortedCurrencies[0] || "EUR";
  const mainCur = activeCur;

  // Gecikmiş faturalar: vadesi geçmiş ama ödenmemiş (veya OVERDUE durumlu)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdueInvoices = invoices.filter((i) => {
    if (i.status === "PAID" || i.status === "CANCELLED") return false;
    if (i.status === "OVERDUE") return true;
    if (!i.dueDate) return false;
    return new Date(i.dueDate) < today;
  });
  // Müşteri sayısı artık gerçek müşteri tablosundan geliyor (prop olarak), faturalardan değil.

  const fmt = (n: number, cur: string) => (curSym[cur] || "€") + n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const m = byCurrency[mainCur] || { total: 0, paid: 0, pending: 0, count: 0 };
  // Seçili para birimindeki fatura sayıları (alt yazılar için)
  const curPaidCount = invoices.filter((i) => i.status === "PAID" && (i.currency || "EUR") === mainCur).length;
  const curPendingCount = invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED" && (i.currency || "EUR") === mainCur).length;
  const metrics = [
    { key: "total", label: t("Toplam Gelir"), value: fmt(m.total, mainCur), sub: `${m.count} ${t("fatura")}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50", money: true },
    { key: "pending", label: t("Bekleyen"), value: fmt(m.pending, mainCur), sub: `${curPendingCount} ${t("fatura")}`, icon: Clock, color: "text-amber-600 bg-amber-50", money: true },
    { key: "paid", label: t("Ödenen"), value: fmt(m.paid, mainCur), sub: `${curPaidCount} ${t("fatura")}`, icon: CheckCircle2, color: "text-blue-600 bg-blue-50", money: true },
    { key: "clients", label: t("Müşteriler"), value: String(clientCount), sub: "", icon: Users, color: "text-violet-600 bg-violet-50", money: false },
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
        {metrics.map((mt) => (
          <div key={mt.key} onClick={() => setOpenDetail(mt.key)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300">
            <div className="flex items-start justify-between">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${mt.color} transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3`}>
                <mt.icon className="h-5 w-5" />
              </div>
              {/* Çoklu para birimi geçişi — sadece para kartlarında ve birden fazla para birimi varsa */}
              {mt.money && multiCurrency && (
                <div className="flex items-center gap-1 text-slate-400" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setCurIndex((i) => (i - 1 + sortedCurrencies.length) % sortedCurrencies.length)}
                    className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-slate-100 hover:text-slate-600" aria-label="prev">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-500 min-w-[28px] text-center">{mainCur}</span>
                  <button onClick={() => setCurIndex((i) => (i + 1) % sortedCurrencies.length)}
                    className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-slate-100 hover:text-slate-600" aria-label="next">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-3 transition-colors group-hover:text-slate-700">{mt.label}</p>
            <p className="text-2xl font-semibold tracking-tight mt-0.5">{mt.value}</p>
            {mt.sub && <p className="text-xs text-slate-400 mt-1">{mt.sub}</p>}
          </div>
        ))}
      </div>

      {/* Gecikmiş fatura uyarısı */}
      {overdueInvoices.length > 0 && (
        <Link href="/app/invoices?status=OVERDUE" className="block rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 mb-4 text-sm text-rose-800 hover:bg-rose-100 transition-colors">
          <span className="font-semibold">{overdueInvoices.length} {t("fatura")}</span> {t("vadesi geçti ve hâlâ ödenmedi.")} {t("Görüntüle →")}
        </Link>
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

      {/* Metrik detay penceresi — kartlara tıklayınca açılır */}
      {openDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in" onClick={() => setOpenDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const meta = metrics.find((x) => x.key === openDetail)!;
              // Toplam Gelir / Bekleyen / Ödenen → para birimi kırılımı
              const isMoney = meta.money;
              const statusFilter = openDetail === "paid" ? (i: any) => i.status === "PAID"
                : openDetail === "pending" ? (i: any) => i.status !== "PAID" && i.status !== "CANCELLED"
                : () => true;
              const relevant = invoices.filter((i) => i.status !== "CANCELLED" && statusFilter(i));
              // Para birimi başına toplam
              const breakdown: Record<string, { sum: number; count: number }> = {};
              for (const i of relevant) {
                const c = i.currency || "EUR";
                if (!breakdown[c]) breakdown[c] = { sum: 0, count: 0 };
                breakdown[c].sum += Number(i.total || 0);
                breakdown[c].count += 1;
              }
              return (
                <>
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${meta.color}`}><meta.icon className="h-5 w-5" /></div>
                      <div>
                        <h2 className="font-semibold text-lg text-slate-900">{meta.label}</h2>
                        <p className="text-xs text-slate-400">{openDetail === "clients" ? `${clientCount} ${t("müşteri")}` : `${relevant.length} ${t("fatura")}`}</p>
                      </div>
                    </div>
                    <button onClick={() => setOpenDetail(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                  </div>

                  {openDetail === "clients" ? (
                    // MÜŞTERİLER detayı
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-4"><span className="text-slate-400">{t("Toplam müşteri")}</span><span className="text-slate-900 font-semibold">{clientCount}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-400">{t("Faturası olan müşteri")}</span><span className="text-slate-700">{new Set(invoices.map((i) => i.clientId).filter(Boolean)).size}</span></div>
                      <Link href="/app/clients" className="block mt-4 text-center rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">{t("Müşterileri Yönet")}</Link>
                    </div>
                  ) : (
                    // PARA detayı: para birimi kırılımı + ilgili faturalar
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{t("Para birimine göre")}</p>
                        <div className="space-y-2">
                          {Object.keys(breakdown).length === 0 ? (
                            <p className="text-sm text-slate-400">{t("Henüz veri yok.")}</p>
                          ) : Object.entries(breakdown).sort((a, b) => b[1].count - a[1].count).map(([cur, d]) => (
                            <div key={cur} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                              <span className="text-sm text-slate-500">{cur} · {d.count} {t("fatura")}</span>
                              <span className="text-sm font-semibold text-slate-900">{fmt(d.sum, cur)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {relevant.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{t("Son faturalar")}</p>
                          <div className="space-y-1.5">
                            {relevant.slice(0, 5).map((inv) => (
                              <Link key={inv.id} href={`/app/invoices/new?id=${inv.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                                <span className="text-sm text-slate-600 truncate">{inv.number} · {inv.client?.name || t("Müşteri")}</span>
                                <span className="text-sm font-medium text-slate-900 whitespace-nowrap ml-2">{fmt(Number(inv.total || 0), inv.currency)}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      <Link href={openDetail === "paid" ? "/app/invoices?status=PAID" : openDetail === "pending" ? "/app/invoices" : "/app/invoices"}
                        className="block text-center rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">{t("Tümünü Gör")}</Link>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
