"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import { BarChart3, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { listInvoices } from "../invoices/actions";

export default function ReportsPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listInvoices().then((res) => {
      if (res.ok) setInvoices(res.invoices || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const curSym: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", TRY: "₺" };

  // Para birimine göre grupla
  const byCurrency: Record<string, { total: number; paid: number }> = {};
  for (const i of invoices) {
    const cur = i.currency || "EUR";
    if (!byCurrency[cur]) byCurrency[cur] = { total: 0, paid: 0 };
    const amt = Number(i.total || 0);
    byCurrency[cur].total += amt;
    if (i.status === "PAID") byCurrency[cur].paid += amt;
  }
  const currencies = Object.keys(byCurrency).sort((a, b) => byCurrency[b].total - byCurrency[a].total);
  const fmt = (n: number, cur: string) => (curSym[cur] || "€") + Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div>
      <PageHeader title={L("Raporlar", "Reports")} subtitle={L("Gelir ve tahsilat analizi.", "Revenue and collection analysis.")} />

      {!loading && invoices.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <BarChart3 className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900 mb-1">{L("Henüz veri yok", "No data yet")}</p>
            <p className="text-sm text-slate-500">{L("Fatura oluşturdukça raporların burada görünür.", "Reports appear here as you create invoices.")}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {currencies.map((cur) => {
            const d = byCurrency[cur];
            const pending = d.total - d.paid;
            const kpis = [
              { label: L("Toplam Gelir", "Total Revenue"), value: fmt(d.total, cur), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
              { label: L("Tahsil Edilen", "Collected"), value: fmt(d.paid, cur), icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
              { label: L("Bekleyen", "Outstanding"), value: fmt(pending, cur), icon: Clock, color: "text-amber-600 bg-amber-50" },
            ];
            return (
              <div key={cur}>
                {currencies.length > 1 && (
                  <p className="text-sm font-semibold text-slate-700 mb-2">{curSym[cur] || cur} {cur}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {kpis.map((k) => (
                    <Card key={k.label} className="p-5">
                      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${k.color}`}>
                        <k.icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-slate-500 mt-3">{k.label}</p>
                      <p className="text-2xl font-semibold tracking-tight mt-0.5">{k.value}</p>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
