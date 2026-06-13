"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { useToast } from "@/lib/toast-context";
import { StatusBadge } from "@/components/ui";
import { updateInvoiceStatus } from "../actions";
import { ArrowLeft, Download, Mail, Pencil, CheckCircle2, FileText, Send, Ban } from "lucide-react";

const CUR_SYM: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", TRY: "₺" };

// İşlem geçmişi kodlarını insan-okunur metne çevir
function historyText(action: string, detail: string | null, t: (s: string) => string): string {
  switch (action) {
    case "invoice.created": return t("Fatura oluşturuldu");
    case "invoice.updated": return t("Fatura güncellendi");
    case "invoice.emailed": return t("E-posta gönderildi") + (detail ? ` · ${detail}` : "");
    case "invoice.status_changed": return t("Durum değişti") + (detail ? ` · ${detail}` : "");
    case "invoice.cancelled": return t("Fatura iptal edildi");
    case "invoice.deleted": return t("Fatura silindi");
    default: return action;
  }
}

function historyIcon(action: string) {
  if (action === "invoice.emailed") return Send;
  if (action === "invoice.status_changed") return CheckCircle2;
  if (action === "invoice.cancelled" || action === "invoice.deleted") return Ban;
  return FileText;
}

export default function InvoiceDetailClient({ invoice, history }: { invoice: any; history: any[] }) {
  const { lang } = useLang();
  const t = (s: string) => appT(lang, s);
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<string>(invoice.status);
  const [busy, setBusy] = useState("");
  const [events, setEvents] = useState<any[]>(history || []);

  const cur = invoice.currency || "EUR";
  const sym = CUR_SYM[cur] || "€";
  const fmt = (n: number) => sym + Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";

  const statusLabel = (s: string) => ({ PAID: t("Ödendi"), SENT: t("Gönderildi"), OVERDUE: t("Gecikmiş"), DRAFT: t("Taslak"), CANCELLED: t("İptal") }[s] || s);
  const badgeStatus = (s: string) => ({ PAID: "paid", SENT: "sent", OVERDUE: "overdue", DRAFT: "draft", CANCELLED: "draft" }[s] || "draft");

  const items: any[] = invoice.items || [];

  // PDF indir (güvenli: invoiceId ile DB'den üretilir)
  const downloadPdf = async () => {
    setBusy("pdf");
    try {
      const res = await fetch("/api/invoice-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${invoice.number}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success(t("PDF indirildi"));
    } catch {
      toast.error(t("PDF hazırlanırken bir sorun oluştu. Birkaç saniye sonra tekrar dene."));
    } finally { setBusy(""); }
  };

  // Ödendi işaretle (bugünün tarihiyle)
  const markPaid = async () => {
    setBusy("paid");
    const today = new Date().toISOString().slice(0, 10);
    const res = await updateInvoiceStatus(invoice.id, "PAID", today);
    if (res.ok) {
      setStatus("PAID");
      toast.success(t("Ödeme alındı olarak işaretlendi"));
      router.refresh();
    } else {
      toast.error(res.error || t("Bir hata oluştu. Lütfen tekrar dene."));
    }
    setBusy("");
  };

  const docTypeLabel = String(invoice.type).toUpperCase() === "QUOTE" ? t("Teklif") : t("Fatura");

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Üst gezinme */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <Link href="/app/invoices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> {t("Faturalar")}
        </Link>
        <Link href={`/app/invoices/new?id=${invoice.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-3.5 py-2 hover:bg-slate-50">
          <Pencil className="h-4 w-4" /> {t("Düzenle")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: fatura özeti + geçmiş */}
        <div className="lg:col-span-2 space-y-6">
          {/* Başlık kartı */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-semibold text-slate-900">{invoice.number}</h1>
                  <StatusBadge status={badgeStatus(status)} label={statusLabel(status)} />
                </div>
                <p className="text-sm text-slate-400 mt-1">{docTypeLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{fmt(invoice.total)}</p>
                {status === "PAID" && invoice.paidAt && (
                  <p className="text-xs text-emerald-600 mt-0.5">{fmtDate(invoice.paidAt)} {t("ödendi")}</p>
                )}
              </div>
            </div>

            {/* Müşteri + tarihler */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{t("Müşteri")}</p>
                <p className="font-medium text-slate-800">{invoice.client?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{t("Düzenlenme")}</p>
                <p className="text-slate-700">{fmtDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{t("Vade")}</p>
                <p className="text-slate-700">{fmtDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{t("Para birimi")}</p>
                <p className="text-slate-700">{cur}</p>
              </div>
            </div>
          </div>

          {/* Kalemler */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900 mb-4">{t("Kalemler")}</h2>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-slate-400">{t("Kalem yok.")}</p>
              ) : items.map((it, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 truncate">{it.description || "—"}</p>
                    <p className="text-xs text-slate-400">{Number(it.quantity)} × {fmt(it.unitPrice)}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-900 whitespace-nowrap">{fmt(Number(it.quantity) * Number(it.unitPrice))}</span>
                </div>
              ))}
            </div>
            {/* Toplam */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500"><span>{t("Ara toplam")}</span><span>{fmt(invoice.subtotal)}</span></div>
              {Number(invoice.vatTotal) > 0 && <div className="flex justify-between text-slate-500"><span>{t("KDV")}</span><span>{fmt(invoice.vatTotal)}</span></div>}
              <div className="flex justify-between font-semibold text-slate-900 text-base pt-1"><span>{t("Toplam")}</span><span>{fmt(invoice.total)}</span></div>
            </div>
          </div>

          {/* İşlem geçmişi */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900 mb-4">{t("Geçmiş")}</h2>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">{t("Henüz işlem kaydı yok.")}</p>
            ) : (
              <ul className="space-y-3">
                {events.map((ev, i) => {
                  const Icon = historyIcon(ev.action);
                  return (
                    <li key={ev.id || i} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 mt-0.5">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700">{historyText(ev.action, ev.detail, t)}</p>
                        <p className="text-xs text-slate-400">{new Date(ev.createdAt).toLocaleString("tr-TR")}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* SAĞ: işlemler */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">{t("İşlemler")}</h2>
            <div className="space-y-2">
              <button onClick={downloadPdf} disabled={busy === "pdf"}
                className="w-full inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-700 disabled:opacity-60">
                <Download className="h-4 w-4" /> {busy === "pdf" ? t("PDF hazırlanıyor...") : t("PDF Olarak İndir")}
              </button>
              <Link href={`/app/invoices/new?id=${invoice.id}`}
                className="w-full inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2.5 hover:bg-slate-50">
                <Mail className="h-4 w-4" /> {t("Müşteriye Gönder")}
              </Link>
              {status !== "PAID" && status !== "CANCELLED" && (
                <button onClick={markPaid} disabled={busy === "paid"}
                  className="w-full inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2.5 hover:bg-emerald-100 disabled:opacity-60">
                  <CheckCircle2 className="h-4 w-4" /> {t("Ödendi İşaretle")}
                </button>
              )}
              <Link href={`/app/invoices/new?id=${invoice.id}`}
                className="w-full inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2.5 hover:bg-slate-50">
                <Pencil className="h-4 w-4" /> {t("Düzenle")}
              </Link>
            </div>
          </div>

          {/* Müşteri kısa bilgi */}
          {invoice.client && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">{t("Müşteri")}</h2>
              <p className="font-medium text-slate-800">{invoice.client.name}</p>
              {invoice.client.email && <p className="text-slate-500 mt-0.5">{invoice.client.email}</p>}
              {invoice.client.country && <p className="text-slate-400 mt-0.5">{invoice.client.country}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
