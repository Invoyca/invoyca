"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { StatusBadge } from "@/components/ui";
import { ArrowLeft, FileText, Plus, Mail, MapPin, Globe, Hash } from "lucide-react";

const CUR_SYM: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", TRY: "₺" };

export default function ClientDetailClient({ client, invoices }: { client: any; invoices: any[] }) {
  const { lang } = useLang();
  const t = (s: string) => appT(lang, s);

  const fmt = (n: number, cur: string) => (CUR_SYM[cur] || "€") + Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";

  const statusLabel = (s: string) => ({ PAID: t("Ödendi"), SENT: t("Gönderildi"), OVERDUE: t("Gecikmiş"), DRAFT: t("Taslak"), CANCELLED: t("İptal") }[s] || s);
  const badgeStatus = (s: string) => ({ PAID: "paid", SENT: "sent", OVERDUE: "overdue", DRAFT: "draft", CANCELLED: "draft" }[s] || "draft");

  // Para birimi bazında gelir (iptal hariç) + ödenen
  const byCur: Record<string, { total: number; paid: number; count: number }> = {};
  for (const inv of invoices) {
    if (inv.status === "CANCELLED") continue;
    const cur = inv.currency || "EUR";
    if (!byCur[cur]) byCur[cur] = { total: 0, paid: 0, count: 0 };
    const amt = Number(inv.total || 0);
    byCur[cur].total += amt;
    byCur[cur].count += 1;
    if (inv.status === "PAID") byCur[cur].paid += amt;
  }
  const currencies = Object.keys(byCur).sort((a, b) => byCur[b].count - byCur[a].count);
  const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");

  const addr = [client.address, client.city, client.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Üst gezinme */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <Link href="/app/clients" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> {t("Müşteriler")}
        </Link>
        <Link href={`/app/invoices/new?client=${client.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-3.5 py-2 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> {t("Bu Müşteriye Fatura")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: profil + gelir + faturalar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profil başlığı */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-lg font-semibold">
                  {(client.name || "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-slate-900 truncate">{client.name}</h1>
                  {client.email && <p className="text-sm text-slate-500 truncate">{client.email}</p>}
                </div>
              </div>
            </div>

            {/* Detay alanları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-100 text-sm">
              {addr && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-700">{addr}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-slate-700">{client.email}</span>
                </div>
              )}
              {client.vatId && (
                <div className="flex items-center gap-2.5">
                  <Hash className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-slate-700">{t("Vergi No")}: {client.vatId}</span>
                </div>
              )}
              {client.preferredLanguage && (
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-slate-700">{t("Tercih edilen dil")}: {String(client.preferredLanguage).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gelir özeti */}
          {currencies.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900 mb-4">{t("Gelir özeti")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currencies.map((cur) => (
                  <div key={cur} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">{cur}</span>
                      <span className="text-xs text-slate-400">{byCur[cur].count} {t("fatura")}</span>
                    </div>
                    <p className="text-xl font-semibold text-slate-900 mt-1">{fmt(byCur[cur].total, cur)}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{fmt(byCur[cur].paid, cur)} {t("ödendi")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Faturalar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900 mb-4">{t("Faturalar")}</h2>
            {activeInvoices.length === 0 ? (
              <div className="py-8 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 mb-4">{t("Bu müşteriye henüz fatura kesmedin.")}</p>
                <Link href={`/app/invoices/new?client=${client.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
                  <Plus className="h-4 w-4" /> {t("İlk Faturayı Oluştur")}
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <Link key={inv.id} href={`/app/invoices/${inv.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{inv.number}</p>
                      <p className="text-xs text-slate-400">{fmtDate(inv.issueDate)}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-900 whitespace-nowrap">{fmt(Number(inv.total || 0), inv.currency || "EUR")}</span>
                    <StatusBadge status={badgeStatus(inv.status)} label={statusLabel(inv.status)} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: hızlı özet */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">{t("Özet")}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">{t("Toplam fatura")}</span><span className="font-semibold text-slate-900">{activeInvoices.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">{t("Ödenen")}</span><span className="text-slate-700">{invoices.filter((i) => i.status === "PAID").length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">{t("Bekleyen")}</span><span className="text-slate-700">{invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
