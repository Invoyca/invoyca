"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { Plus, Search, FileText, Check, ChevronDown, Pencil, Trash2, Copy } from "lucide-react";
import { listInvoices, updateInvoiceStatus, deleteInvoice, duplicateInvoice } from "./actions";
import { nextStatuses } from "@/lib/invoice-status";
import { useGuest } from "@/lib/guest-context";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";

export default function InvoicesClient({ initialInvoices }: { initialInvoices: any[] }) {
  const { lang } = useLang();
  const router = useRouter();
  const { requireAuth } = useGuest();
  const confirm = useConfirm();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [invoices, setInvoices] = useState<any[]>(initialInvoices || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");   // sıralama
  const [dateRange, setDateRange] = useState("all");    // tarih aralığı

  // Topbar'dan gelen arama terimini al (?q=...) ve dashboard'dan gelen durum filtresini (?status=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setSearch(q);
    const status = params.get("status");
    if (status) setFilter(status);
  }, []);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const [paidModal, setPaidModal] = useState<{ id: string; date: string } | null>(null);
  const L = (tr: string, _en?: string) => appT(lang, tr);

  const load = () => {
    listInvoices().then((res) => {
      if (res.ok) setInvoices(res.invoices || []);
    }).catch(() => {});
  };

  // Açık durum menüsü varken dışarı tıklayınca kapat
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);

  const tabs = [
    { id: "all", label: L("Tümü", "All") },
    { id: "DRAFT", label: L("Taslak", "Draft") },
    { id: "SENT", label: L("Gönderildi", "Sent") },
    { id: "PAID", label: L("Ödenen", "Paid") },
    { id: "OVERDUE", label: L("Gecikmiş", "Overdue") },
    { id: "CANCELLED", label: L("İptal", "Cancelled") },
  ];

  const statusLabel = (s: string) =>
    ({ PAID: L("Ödendi", "Paid"), SENT: L("Gönderildi", "Sent"), OVERDUE: L("Gecikmiş", "Overdue"), DRAFT: L("Taslak", "Draft"), CANCELLED: L("İptal", "Cancelled") }[s] || s);

  // Durum → StatusBadge rengi için (paid/pending/overdue/sent/draft)
  const badgeStatus = (s: string) =>
    ({ PAID: "paid", SENT: "sent", OVERDUE: "overdue", DRAFT: "draft", CANCELLED: "draft" }[s] || "draft");

  const curSym: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", TRY: "₺" };
  const fmt = (n: number, cur?: string) => (curSym[cur || "EUR"] || "€") + Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";

  // 1) Durum filtresi
  let rows = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  // 2) Arama
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((i) =>
      (i.number || "").toLowerCase().includes(q) ||
      (i.client?.name || "").toLowerCase().includes(q)
    );
  }

  // 3) Tarih aralığı filtresi
  if (dateRange !== "all") {
    const now = new Date();
    rows = rows.filter((i) => {
      const d = i.issueDate ? new Date(i.issueDate) : null;
      if (!d) return false;
      if (dateRange === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateRange === "quarter") {
        const q = Math.floor(now.getMonth() / 3);
        return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
      }
      if (dateRange === "year") return d.getFullYear() === now.getFullYear();
      return true;
    });
  }

  // 4) Sıralama
  const statusOrder: Record<string, number> = { DRAFT: 0, SENT: 1, OVERDUE: 2, PAID: 3, CANCELLED: 4 };
  rows = [...rows].sort((a, b) => {
    switch (sortBy) {
      case "date_asc": return new Date(a.issueDate || 0).getTime() - new Date(b.issueDate || 0).getTime();
      case "date_desc": return new Date(b.issueDate || 0).getTime() - new Date(a.issueDate || 0).getTime();
      case "amount_desc": return Number(b.total || 0) - Number(a.total || 0);
      case "amount_asc": return Number(a.total || 0) - Number(b.total || 0);
      case "status": return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      case "client": return (a.client?.name || "").localeCompare(b.client?.name || "");
      default: return 0;
    }
  });

  // Filtrelenmiş sonucun özeti (sayı + para birimine göre toplam)
  const resultCount = rows.length;
  const totalsByCurrency: Record<string, number> = {};
  for (const r of rows) {
    const c = r.currency || "EUR";
    totalsByCurrency[c] = (totalsByCurrency[c] || 0) + Number(r.total || 0);
  }

  const changeStatus = async (id: string, status: string) => {
    if (!requireAuth()) { setOpenMenu(null); return; }
    setOpenMenu(null);
    // "Ödendi" seçilince ödeme tarihini sor (varsayılan bugün)
    if (String(status).toUpperCase() === "PAID") {
      setPaidModal({ id, date: new Date().toISOString().slice(0, 10) });
      return;
    }
    // İyimser güncelleme: önce ekranda değiştir
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    const res = await updateInvoiceStatus(id, status);
    if (!res.ok) { toast.error(res.error || "Güncellenemedi"); load(); }
    else toast.success(L("Durum güncellendi", "Status updated"));
  };

  // Ödeme tarihini onayla
  const confirmPaid = async () => {
    if (!paidModal) return;
    const { id, date } = paidModal;
    setPaidModal(null);
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "PAID", paidAt: date } : i));
    const res = await updateInvoiceStatus(id, "PAID", date);
    if (!res.ok) { toast.error(res.error || "Güncellenemedi"); load(); }
    else toast.success(L("Ödeme alındı olarak işaretlendi", "Marked as paid"));
  };

  const dupInvoice = async (id: string) => {
    if (!requireAuth()) return;
    const res = await duplicateInvoice(id);
    if (res.ok && res.id) {
      toast.success(L("Fatura kopyalandı", "Invoice duplicated"));
      router.push(`/app/invoices/new?id=${res.id}`);
    } else {
      toast.error(res.error || L("Kopyalanamadı", "Could not duplicate"));
    }
  };

  const delInvoice = async (id: string, number: string, status: string) => {
    if (!requireAuth()) return;
    // Ödenmiş fatura: hiç sorma, direkt uyar
    if (String(status).toUpperCase() === "PAID") {
      toast.error(L("Ödenmiş fatura silinemez.", "Paid invoice can't be deleted."));
      return;
    }
    // Gönderilmiş/gecikmiş: silinmez, iptal edilir — kullanıcıyı doğru bilgilendir
    const willCancel = ["SENT", "OVERDUE"].includes(String(status).toUpperCase());
    const ok = await confirm({
      title: willCancel ? L("Faturayı iptal et", "Cancel invoice") : L("Faturayı sil", "Delete invoice"),
      message: willCancel
        ? L(`${number} numaralı fatura iptal edilecek (kayıt korunur).`, `Invoice ${number} will be cancelled (record kept).`)
        : L(`${number} numaralı taslak silinecek. Bu işlem geri alınamaz.`, `Draft ${number} will be deleted. This cannot be undone.`),
      confirmText: willCancel ? L("İptal Et", "Cancel it") : L("Sil", "Delete"),
      cancelText: L("Vazgeç", "Back"),
      danger: true,
    });
    if (!ok) return;
    const res = await deleteInvoice(id);
    if (!res.ok) { toast.error(res.error || "Silinemedi"); load(); return; }
    if (res.cancelled) {
      toast.success(L("Fatura iptal edildi", "Invoice cancelled"));
      load(); // listede CANCELLED olarak görünsün
    } else {
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      toast.success(L("Fatura silindi", "Invoice deleted"));
    }
  };

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
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tarih aralığı */}
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="all">{L("Tüm tarihler", "All dates")}</option>
                <option value="month">{L("Bu ay", "This month")}</option>
                <option value="quarter">{L("Bu çeyrek", "This quarter")}</option>
                <option value="year">{L("Bu yıl", "This year")}</option>
              </select>
              {/* Sıralama */}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="date_desc">{L("Tarih (yeni → eski)", "Date (new → old)")}</option>
                <option value="date_asc">{L("Tarih (eski → yeni)", "Date (old → new)")}</option>
                <option value="amount_desc">{L("Tutar (yüksek → düşük)", "Amount (high → low)")}</option>
                <option value="amount_asc">{L("Tutar (düşük → yüksek)", "Amount (low → high)")}</option>
                <option value="status">{L("Duruma göre", "By status")}</option>
                <option value="client">{L("Müşteri adı", "Client name")}</option>
              </select>
              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={L("Ara...", "Search...")}
                  className="rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
            </div>
          </div>

          {/* Sonuç özeti */}
          <div className="flex items-center gap-3 text-sm text-slate-500 mb-3 px-1 flex-wrap">
            <span>{resultCount} {L("fatura", "invoices")}</span>
            {Object.keys(totalsByCurrency).length > 0 && <span className="text-slate-300">·</span>}
            {Object.entries(totalsByCurrency).map(([cur, sum]) => (
              <span key={cur} className="font-medium text-slate-700">{fmt(sum, cur)}</span>
            ))}
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
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium">
                        <Link href={`/app/invoices/${inv.id}`} onClick={(e) => { if (!requireAuth()) e.preventDefault(); }}
                          className="text-blue-600 hover:underline">{inv.number}</Link>
                      </td>
                      <td className="px-5 py-3">{inv.client?.name || "—"}</td>
                      <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{fmtDate(inv.issueDate)}</td>
                      <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{fmtDate(inv.dueDate)}</td>
                      <td className="px-5 py-3">
                        {/* Tıklanabilir durum menüsü */}
                        <div className="relative">
                          <button onClick={(e) => {
                              e.stopPropagation();
                              if (openMenu === inv.id) { setOpenMenu(null); return; }
                              // Butonun ekrandaki konumunu ölç → menüyü akıllı konumlandır
                              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const menuH = 200; // tahmini menü yüksekliği
                              const spaceBelow = window.innerHeight - r.bottom;
                              const up = spaceBelow < menuH; // altta yer yoksa yukarı aç
                              setMenuPos({ top: up ? r.top : r.bottom, left: r.left, up });
                              setOpenMenu(inv.id);
                            }}
                            className="inline-flex items-center gap-1 hover:opacity-80">
                            <StatusBadge status={badgeStatus(inv.status)} label={statusLabel(inv.status)} />
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                          </button>
                          {String(inv.status).toUpperCase() === "PAID" && inv.paidAt && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(inv.paidAt)} {L("ödendi", "paid")}</p>
                          )}
                          {openMenu === inv.id && menuPos && (
                            <div className="fixed z-50 w-44 rounded-lg border border-slate-200 bg-white shadow-xl py-1"
                              style={{ left: menuPos.left, top: menuPos.up ? undefined : menuPos.top + 4, bottom: menuPos.up ? window.innerHeight - menuPos.top + 4 : undefined }}
                              onClick={(e) => e.stopPropagation()}>
                              {/* Mevcut durum (işaretli) + sadece geçerli geçişler */}
                              <div className="px-3 py-1.5 text-xs text-slate-400 flex items-center justify-between">
                                {statusLabel(inv.status)} <Check className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                              {nextStatuses(inv.status).length > 0 && <div className="h-px bg-slate-100 my-1" />}
                              {nextStatuses(inv.status).map((s) => (
                                <button key={s} onClick={() => changeStatus(inv.id, s)}
                                  className="w-full flex items-center px-3 py-2 text-sm hover:bg-slate-50 text-left">
                                  {statusLabel(s)}
                                </button>
                              ))}
                              {nextStatuses(inv.status).length === 0 && (
                                <div className="px-3 py-2 text-xs text-slate-400">{L("Bu durum kilitli", "Status locked")}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-medium">{fmt(inv.total, inv.currency)}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <Link href={`/app/invoices/new?id=${inv.id}`} onClick={(e) => { if (!requireAuth()) e.preventDefault(); }}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500" title={L("Düzenle", "Edit")}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => dupInvoice(inv.id)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title={L("Kopyala", "Duplicate")}>
                          <Copy className="h-4 w-4" />
                        </button>
                        <button onClick={() => delInvoice(inv.id, inv.number, inv.status)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600" title={L("Sil", "Delete")}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">{L("Bu filtrede fatura yok.", "No invoices in this filter.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Ödeme tarihi sorma modalı */}
      {paidModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setPaidModal(null)}>
          <div className="absolute inset-0 bg-slate-900/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-1">{L("Ödeme alındı", "Payment received")}</h3>
            <p className="text-sm text-slate-500 mb-4">{L("Ödemenin alındığı tarihi seç.", "Select the date the payment was received.")}</p>
            <label className="text-xs font-medium text-slate-500">{L("Ödeme tarihi", "Payment date")}</label>
            <input type="date" value={paidModal.date} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setPaidModal({ ...paidModal, date: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <div className="flex items-center gap-2 mt-5">
              <button onClick={confirmPaid} className="flex-1 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">{L("Onayla", "Confirm")}</button>
              <button onClick={() => setPaidModal(null)} className="rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50">{L("Vazgeç", "Cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
