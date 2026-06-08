"use client";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import { RefreshCw } from "lucide-react";

export default function RecurringPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);

  return (
    <div>
      <PageHeader title={L("Tekrar Edenler", "Recurring")} subtitle={L("Otomatik fatura aboneliklerin.", "Your automated invoice subscriptions.")} />
      <Card>
        <div className="py-16 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
            <RefreshCw className="h-7 w-7 text-slate-400" />
          </div>
          <p className="font-medium text-slate-900 mb-1">{L("Henüz tekrarlayan faturan yok", "No recurring invoices yet")}</p>
          <p className="text-sm text-slate-500 mb-1">{L("Otomatik fatura özelliği çok yakında ekleniyor.", "Recurring invoices are coming soon.")}</p>
          <p className="text-xs text-slate-400">{L("Aylık/yıllık tekrar eden faturaları otomatikleştirebileceksin.", "You'll be able to automate monthly/yearly invoices.")}</p>
        </div>
      </Card>
    </div>
  );
}
