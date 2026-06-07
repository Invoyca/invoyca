"use client";

import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import { Plus, Search, Mail } from "lucide-react";

const CLIENTS = [
  { name: "Bright Sample Company", country: "NL", email: "finance@example.org", invoices: 8, total: "€24.300" },
  { name: "Example Trading Co.", country: "DE", email: "billing@example.com", invoices: 5, total: "€12.100" },
  { name: "Demo Industries", country: "GB", email: "accounts@example.com", invoices: 3, total: "€6.890" },
  { name: "Sample Holdings", country: "FR", email: "compta@example.org", invoices: 12, total: "€48.500" },
];

export default function ClientsPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);

  return (
    <div>
      <PageHeader
        title={L("Müşteriler", "Clients")}
        subtitle={L("Müşteri bilgilerini yönet.", "Manage your client records.")}
        action={
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {L("Yeni Müşteri", "New Client")}
          </button>
        }
      />
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input placeholder={L("Ara...", "Search...")} className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400 border-b border-slate-100">
              <tr>
                <th className="font-medium px-5 py-3">{L("Müşteri", "Client")}</th>
                <th className="font-medium px-5 py-3 hidden md:table-cell">{L("E-posta", "Email")}</th>
                <th className="font-medium px-5 py-3 hidden lg:table-cell">{L("Fatura", "Invoices")}</th>
                <th className="font-medium px-5 py-3 text-right">{L("Toplam", "Total")}</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr key={c.name} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{c.email}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{c.invoices}</td>
                  <td className="px-5 py-3 text-right font-medium">{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
