"use client";
import { useState } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import { Plus, Play, Pause, RefreshCw, TrendingUp, Calendar } from "lucide-react";

export default function RecurringPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const [items, setItems] = useState([
    { id: 1, name: "Bright Sample — Aylık Bakım", freq: L("Aylık","Monthly"), next: "01.07.2026", amount: "€150", active: true },
    { id: 2, name: "Demo Industries — Hosting", freq: L("Aylık","Monthly"), next: "05.07.2026", amount: "€45", active: true },
    { id: 3, name: "Test Ventures — Danışmanlık", freq: L("Aylık","Monthly"), next: "10.07.2026", amount: "€800", active: false },
  ]);
  const toggle = (id: number) => setItems((p) => p.map((i) => i.id === id ? { ...i, active: !i.active } : i));
  const stats = [
    { label: L("Aktif","Active"), value: items.filter(i=>i.active).length, icon: RefreshCw, color: "text-emerald-600 bg-emerald-50" },
    { label: L("Aylık Gelir","MRR"), value: "€995", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: L("Sonraki","Next"), value: "01.07", icon: Calendar, color: "text-violet-600 bg-violet-50" },
  ];
  return (
    <div>
      <PageHeader title={L("Tekrar Edenler", "Recurring")} subtitle={L("Otomatik fatura aboneliklerin.", "Your automated invoice subscriptions.")}
        action={<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700"><Plus className="h-4 w-4" /> {L("Yeni","New")}</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <p className="text-sm text-slate-500 mt-3">{s.label}</p>
            <p className="text-2xl font-semibold tracking-tight mt-0.5">{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="divide-y divide-slate-100">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 px-5 py-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${i.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}><RefreshCw className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{i.name}</p>
              <p className="text-xs text-slate-400">{i.freq} · {L("Sonraki","Next")}: {i.next}</p>
            </div>
            <span className="text-sm font-medium">{i.amount}</span>
            <button onClick={() => toggle(i.id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${i.active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {i.active ? <><Pause className="h-3.5 w-3.5" /> {L("Aktif","Active")}</> : <><Play className="h-3.5 w-3.5" /> {L("Duraklatıldı","Paused")}</>}
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}
