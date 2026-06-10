"use client";
import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { Plus, FileText, ArrowRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { listInvoices, convertQuoteToInvoice, deleteInvoice } from "../invoices/actions";
import { useGuest } from "@/lib/guest-context";
import { useConfirm } from "@/lib/confirm-context";

export default function QuotesClient({ initialQuotes }: { initialQuotes: any[] }) {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const { requireAuth } = useGuest();
  const confirm = useConfirm();
  const [quotes, setQuotes] = useState<any[]>(initialQuotes || []);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  const load = () => {
    listInvoices("QUOTE").then((res) => {
      if (res.ok) setQuotes(res.invoices || []);
    }).catch(() => {});
  };

  const curSym: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", TRY: "₺" };
  const fmt = (n: number, cur?: string) => (curSym[cur || "EUR"] || "€") + Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";
  const sl = (s: string) => ({ SENT: L("Gönderildi", "Sent"), DRAFT: L("Taslak", "Draft"), PAID: L("Kabul edildi", "Accepted"), OVERDUE: L("Süresi doldu", "Expired"), CANCELLED: L("İptal", "Cancelled") }[s] || s);
  const badge = (s: string) => ({ SENT: "sent", DRAFT: "draft", PAID: "paid", OVERDUE: "overdue", CANCELLED: "draft" }[s] || "draft");

  const convert = async (id: string) => {
    if (!requireAuth()) return;
    const ok = await confirm({
      title: L("Faturaya dönüştür", "Convert to invoice"),
      message: L("Bu teklifi faturaya dönüştürmek istiyor musun?", "Convert this quote to an invoice?"),
      confirmText: L("Dönüştür", "Convert"),
      cancelText: L("İptal", "Cancel"),
    });
    if (!ok) return;
    setConverting(id);
    const res = await convertQuoteToInvoice(id);
    setConverting(null);
    if (res.ok) { load(); }
    else alert(res.error || "Hata");
  };

  const delQuote = async (id: string, number: string) => {
    if (!requireAuth()) return;
    const ok = await confirm({
      title: L("Teklifi sil", "Delete quote"),
      message: L(`${number} numaralı teklif silinecek. Bu işlem geri alınamaz.`, `Quote ${number} will be deleted. This cannot be undone.`),
      confirmText: L("Sil", "Delete"),
      cancelText: L("İptal", "Cancel"),
      danger: true,
    });
    if (!ok) return;
    setQuotes((p) => p.filter((x) => x.id !== id));
    const res = await deleteInvoice(id);
    if (!res.ok) { alert(res.error || "Silinemedi"); load(); }
  };

  const newQuote = (e: React.MouseEvent) => { if (!requireAuth()) e.preventDefault(); };

  return (
    <div>
      <PageHeader title={L("Teklifler", "Quotes")} subtitle={L("Teklifleri yönet, faturaya dönüştür.", "Manage quotes, convert to invoices.")}
        action={
          <Link href="/app/invoices/new?type=quote" onClick={newQuote} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {L("Yeni Teklif", "New Quote")}
          </Link>
        } />

      {!loading && quotes.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <FileText className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900 mb-1">{L("Henüz teklifin yok", "No quotes yet")}</p>
            <p className="text-sm text-slate-500 mb-5">{L("İlk teklifini oluştur, kabul edilince tek tıkla faturaya dönüştür.", "Create your first quote, convert to invoice in one click.")}</p>
            <Link href="/app/invoices/new?type=quote" onClick={newQuote} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
              <Plus className="h-4 w-4" /> {L("Yeni Teklif", "New Quote")}
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400 border-b border-slate-100"><tr>
                <th className="font-medium px-5 py-3">{L("Teklif No", "Quote No")}</th>
                <th className="font-medium px-5 py-3">{L("Müşteri", "Client")}</th>
                <th className="font-medium px-5 py-3 hidden md:table-cell">{L("Tarih", "Date")}</th>
                <th className="font-medium px-5 py-3">{L("Durum", "Status")}</th>
                <th className="font-medium px-5 py-3 text-right">{L("Tutar", "Amount")}</th>
                <th className="px-5 py-3"></th>
              </tr></thead>
              <tbody>{quotes.map((q) => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium">{q.number}</td>
                  <td className="px-5 py-3">{q.client?.name || "—"}</td>
                  <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{fmtDate(q.issueDate)}</td>
                  <td className="px-5 py-3"><StatusBadge status={badge(q.status)} label={sl(q.status)} /></td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(q.total, q.currency)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button onClick={() => convert(q.id)} disabled={converting === q.id} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50 mr-3">
                      {converting === q.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <>{L("Faturaya dönüştür", "To invoice")} <ArrowRight className="h-3 w-3" /></>}
                    </button>
                    <Link href={`/app/invoices/new?id=${q.id}`} onClick={(e) => { if (!requireAuth()) e.preventDefault(); }} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500 align-middle" title={L("Düzenle", "Edit")}><Pencil className="h-4 w-4" /></Link>
                    <button onClick={() => delQuote(q.id, q.number)} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 align-middle" title={L("Sil", "Delete")}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
