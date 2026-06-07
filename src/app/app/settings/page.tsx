"use client";
import { useState } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import { LayoutTemplate, ArrowRight, Check } from "lucide-react";

export default function SettingsPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const [tab, setTab] = useState("company");
  const tabs = [
    { id: "company", label: L("Şirket Profili", "Company") },
    { id: "subscription", label: L("Abonelik", "Subscription") },
    { id: "account", label: L("Hesap", "Account") },
    { id: "team", label: L("Ekip", "Team") },
  ];
  return (
    <div className="max-w-4xl">
      <PageHeader title={L("Ayarlar", "Settings")} subtitle={L("Hesap ve şirket ayarların.", "Account and company settings.")} />
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit overflow-x-auto">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${tab === tb.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-semibold mb-4">{L("Şirket Bilgileri","Company Info")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                [L("Şirket Adı","Company Name"), "North Example Studio"],
                [L("E-posta","Email"), "billing@example.com"],
                [L("Adres","Address"), "24 Example Street"],
                [L("Şehir / Ülke","City / Country"), "London, UK"],
                [L("Vergi No","Tax ID"), "000000000"],
                [L("VAT ID","VAT ID"), "GB000000000"],
              ].map(([label, val]) => (
                <div key={label}>
                  <label className="text-xs font-medium text-slate-500">{label}</label>
                  <input defaultValue={val} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
              ))}
            </div>
          </Card>
          {/* Varsayılan şablon kısayolu */}
          <Link href="/app/templates" className="block">
            <Card className="p-5 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><LayoutTemplate className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="font-medium">{L("Varsayılan Şablon","Default Template")}</p>
                  <p className="text-sm text-slate-500">{L("Classic Standard — değiştirmek için tıkla","Classic Standard — click to change")}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>
            </Card>
          </Link>
        </div>
      )}
      {tab === "subscription" && (
        <Card className="p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold mb-3">
            <Check className="h-3.5 w-3.5" /> {L("Sınırsız Erişim","Unlimited Access")}
          </div>
          <p className="font-medium text-slate-900">{L("2026 boyunca ücretsiz ve sınırsız","Free & unlimited throughout 2026")}</p>
          <p className="text-sm text-slate-500 mt-1">{L("Tüm özellikler açık. Abonelik planları 2027'de başlayacak; önceden bilgilendirileceksin.","All features unlocked. Subscription plans start in 2027; you'll be notified in advance.")}</p>
        </Card>
      )}
      {tab === "account" && (
        <Card className="p-6"><p className="text-slate-500">{L("Hesap ayarları.","Account settings.")}</p></Card>
      )}
      {tab === "team" && (
        <Card className="p-6"><p className="text-slate-500">{L("Ekip üyelerini davet et (Pro plan).","Invite team members (Pro plan).")}</p></Card>
      )}
    </div>
  );
}
