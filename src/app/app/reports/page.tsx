"use client";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ReportsPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const kpis = [
    { label: L("Toplam Gelir","Total Revenue"), value: "€48.500", sub: "+18%", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { label: L("Bekleyen","Outstanding"), value: "€7.700", sub: L("6 fatura","6 invoices"), icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: L("Tahsil Edilen","Collected"), value: "€40.800", sub: "84%", icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
    { label: L("Gecikmiş","Overdue"), value: "€2.100", sub: L("2 fatura","2 invoices"), icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
  ];
  const months = [
    { m: "Oca", v: 60 }, { m: "Şub", v: 45 }, { m: "Mar", v: 75 }, { m: "Nis", v: 55 }, { m: "May", v: 90 }, { m: "Haz", v: 70 },
  ];
  const max = Math.max(...months.map((x) => x.v));
  return (
    <div>
      <PageHeader title={L("Raporlar", "Reports")} subtitle={L("Gelir ve tahsilat analizi.", "Revenue and collection analysis.")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${k.color}`}><k.icon className="h-5 w-5" /></div>
            <p className="text-sm text-slate-500 mt-3">{k.label}</p>
            <p className="text-2xl font-semibold tracking-tight mt-0.5">{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h2 className="font-semibold mb-4">{L("Aylık Gelir","Monthly Revenue")}</h2>
        <div className="flex items-end justify-between gap-3 h-48">
          {months.map((mo) => (
            <div key={mo.m} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600" style={{ height: `${(mo.v / max) * 100}%` }} />
              <span className="text-xs text-slate-400">{mo.m}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
