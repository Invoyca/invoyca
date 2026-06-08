"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { Plus, Search, FileText, Check, ChevronDown } from "lucide-react";
import { listInvoices, updateInvoiceStatus } from "./actions";
import { useGuest } from "@/lib/guest-context";

export default function InvoicesPage() {
  const { lang } = useLang();
  const { requireAuth } = useGuest();
  const [filter, setFilter] = useState("all");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Topbar'dan gelen arama terimini al (?q=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setSearch(q);
  }, []);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const L = (tr: string, _en?: string) => appT(lang, tr);

  const load = () => {
    listInvoices().then((res) => {
      if (res.ok) setInvoices(res.invoices || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Açık durum menüsü varken dışarı tıklayınca kapat
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);

  const tabs = [
    { id: "all", label: L("Tümü", "All") },
    { id: "PAID", label: L("Ödenen", "Paid") },
    { id: "SENT", label: L("Gönderildi", "Sent") },
    { id: "OVERDUE", label: L("Gecikmiş", "Overdue") },
    { id: "DRAFT", label: L("Taslak", "Draft") },
  ];

  const statusLabel = (s: string) =>
    ({ PAID: L("Ödendi", "Paid"), SENT: L("Gönderildi", "Sent"), OVERDUE: L("Gecikmiş", "Overdue"), DRAFT: L("Taslak", "Draft"), CANCELLED: L("İptal", "Cancelled") }[s] || s);

  // Durum → StatusBadge rengi için (paid/pending/overdue/sent/draft)
  const badgeStatus = (s: string) =>
    ({ PAID: "paid", SENT: "sent", OVERDUE: "overdue", DRAFT: "draft", CANCELLED: "draft" }[s] || "draft");

  const curSym: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", TRY: "₺" };
  const fmt = (n: number, cur?: string) => (curSym[cur || "EUR"] || "€") + Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";

  let rows = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((i) =>
      (i.number || "").toLowerCase().includes(q) ||
      (i.client?.name || "").toLowerCase().includes(q)
    );
  }

  const changeStatus = async (id: string, status: string) => {
    if (!requireAuth()) { setOpenMenu(null); return; }
    setOpenMenu(null);
    // İyimser güncelleme: önce ekranda değiştir
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    const res = await updateInvoiceStatus(id, status);
    if (!res.ok) { alert(res.error || "Güncellenemedi"); load(); }
  };

  const statusOptions = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];

  return (
    <div>
      <PageHeader
        title={L("Faturalar", "Invoices")}
        subtitle={L("Tüm faturalarını yönet.", "Manage all your invoices.")}
        action={
          <Link href="/app/invoices/new" onClick={(e) => { if (!requireAuth()) e.preventDefault(); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {L("Yeni Fatura", "New Invoice")}
          </Link>
        }
      />

      {!loading && invoices.length === 0 ? (
        // Boş durum
        <Card>
          <div className="py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <FileText className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900 mb-1">{L("Henüz faturan yok", "No invoices yet")}</p>
            <p className="text-sm text-slate-500 mb-5">{L("İlk faturanı oluşturarak başla.", "Start by creating your first invoice.")}</p>
            <Link href="/app/invoices/new" onClick={(e) => { if (!requireAuth()) e.preventDefault(); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
              <Plus className="h-4 w-4" /> {L("Yeni Fatura", "New Invoice")}
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Filtre + arama */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filter === tab.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={L("Ara...", "Search...")}
                className="rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
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
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium">{inv.number}</td>
                      <td className="px-5 py-3">{inv.client?.name || "—"}</td>
                      <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{fmtDate(inv.issueDate)}</td>
                      <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{fmtDate(inv.dueDate)}</td>
                      <td className="px-5 py-3">
                        {/* Tıklanabilir durum menüsü */}
                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === inv.id ? null : inv.id); }}
                            className="inline-flex items-center gap-1 hover:opacity-80">
                            <StatusBadge status={badgeStatus(inv.status)} label={statusLabel(inv.status)} />
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                          </button>
                          {openMenu === inv.id && (
                            <div className="absolute z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                              {statusOptions.map((s) => (
                                <button key={s} onClick={() => changeStatus(inv.id, s)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 text-left">
                                  {statusLabel(s)}
                                  {inv.status === s && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-medium">{fmt(inv.total, inv.currency)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">{L("Bu filtrede fatura yok.", "No invoices in this filter.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
