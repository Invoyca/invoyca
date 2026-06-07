"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { Plus, Search } from "lucide-react";

const INVOICES = [
  { no: "2026-0042", client: "Bright Sample Company", date: "06.06.2026", due: "06.07.2026", amount: "€3.540", status: "paid" },
  { no: "2026-0041", client: "Example Trading Co.", date: "01.06.2026", due: "01.07.2026", amount: "€1.200", status: "pending" },
  { no: "2026-0040", client: "Demo Industries", date: "28.05.2026", due: "28.06.2026", amount: "€890", status: "paid" },
  { no: "2026-0039", client: "Sample Holdings", date: "20.05.2026", due: "20.06.2026", amount: "€5.600", status: "overdue" },
  { no: "2026-0038", client: "Test Ventures", date: "15.05.2026", due: "15.06.2026", amount: "€2.100", status: "sent" },
];

export default function InvoicesPage() {
  const { lang } = useLang();
  const [filter, setFilter] = useState("all");
  const L = (tr: string, _en?: string) => appT(lang, tr);

  const tabs = [
    { id: "all", label: L("Tümü", "All") },
    { id: "paid", label: L("Ödenen", "Paid") },
    { id: "pending", label: L("Bekleyen", "Pending") },
    { id: "overdue", label: L("Gecikmiş", "Overdue") },
    { id: "draft", label: L("Taslak", "Draft") },
  ];
  const statusLabel = (s: string) =>
    ({ paid: L("Ödendi", "Paid"), pending: L("Bekliyor", "Pending"), overdue: L("Gecikmiş", "Overdue"), sent: L("Gönderildi", "Sent"), draft: L("Taslak", "Draft") }[s] || s);

  const rows = filter === "all" ? INVOICES : INVOICES.filter((i) => i.status === filter);

  return (
    <div>
      <PageHeader
        title={L("Faturalar", "Invoices")}
        subtitle={L("Tüm faturalarını yönet.", "Manage all your invoices.")}
        action={
          <Link href="/app/invoices/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {L("Yeni Fatura", "New Invoice")}
          </Link>
        }
      />

      {/* Filtre + arama */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === tab.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input placeholder={L("Ara...", "Search...")} className="rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
      </div>

      {/* Tablo */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400 border-b border-slate-100">
              <tr>
                <th className="font-medium px-5 py-3">{L("Fatura No", "Invoice No")}</th>
                <th className="font-medium px-5 py-3">{L("Müşteri", "Client")}</th>
                <th className="font-medium px-5 py-3 hidden md:table-cell">{L("Tarih", "Date")}</th>
                <th className="font-medium px-5 py-3 hidden lg:table-cell">{L("Vade", "Due")}</th>
                <th className="font-medium px-5 py-3">{L("Durum", "Status")}</th>
                <th className="font-medium px-5 py-3 text-right">{L("Tutar", "Amount")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.no} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium">{inv.no}</td>
                  <td className="px-5 py-3">{inv.client}</td>
                  <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{inv.date}</td>
                  <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{inv.due}</td>
                  <td className="px-5 py-3"><StatusBadge status={inv.status} label={statusLabel(inv.status)} /></td>
                  <td className="px-5 py-3 text-right font-medium">{inv.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
