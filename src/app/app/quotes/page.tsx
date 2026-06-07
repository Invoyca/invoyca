"use client";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { Plus, ArrowRight } from "lucide-react";

const QUOTES = [
  { no: "TEK-2026-012", client: "Bright Sample Company", valid: "30.06.2026", amount: "€4.200", status: "sent" },
  { no: "TEK-2026-011", client: "Demo Industries", valid: "25.06.2026", amount: "€1.800", status: "draft" },
  { no: "TEK-2026-010", client: "Test Ventures", valid: "20.06.2026", amount: "€9.500", status: "paid" },
];

export default function QuotesPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const sl = (s: string) => ({ sent: L("Gönderildi","Sent"), draft: L("Taslak","Draft"), paid: L("Kabul edildi","Accepted") }[s] || s);
  return (
    <div>
      <PageHeader title={L("Teklifler", "Quotes")} subtitle={L("Teklifleri yönet, faturaya dönüştür.", "Manage quotes, convert to invoices.")}
        action={<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700"><Plus className="h-4 w-4" /> {L("Yeni Teklif", "New Quote")}</button>} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400 border-b border-slate-100"><tr>
              <th className="font-medium px-5 py-3">{L("Teklif No", "Quote No")}</th>
              <th className="font-medium px-5 py-3">{L("Müşteri", "Client")}</th>
              <th className="font-medium px-5 py-3 hidden md:table-cell">{L("Geçerlilik", "Valid Until")}</th>
              <th className="font-medium px-5 py-3">{L("Durum", "Status")}</th>
              <th className="font-medium px-5 py-3 text-right">{L("Tutar", "Amount")}</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>{QUOTES.map((q) => (
              <tr key={q.no} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{q.no}</td>
                <td className="px-5 py-3">{q.client}</td>
                <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{q.valid}</td>
                <td className="px-5 py-3"><StatusBadge status={q.status} label={sl(q.status)} /></td>
                <td className="px-5 py-3 text-right font-medium">{q.amount}</td>
                <td className="px-5 py-3 text-right">
                  <button className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">{L("Faturaya dönüştür","To invoice")} <ArrowRight className="h-3 w-3" /></button>
                </td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
