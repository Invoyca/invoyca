"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import { Plus, Search, Mail, Users, X, Loader2, Trash2, Pencil } from "lucide-react";
import { listClients, createClientRecord, deleteClient, updateClient } from "../data-actions";
import { useGuest } from "@/lib/guest-context";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";
import { getCountries } from "@/lib/countries";

export default function ClientsClient({ initialClients }: { initialClients: any[] }) {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const { requireAuth } = useGuest();
  const confirm = useConfirm();
  const toast = useToast();
  const [clients, setClients] = useState<any[]>(initialClients || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [detailClient, setDetailClient] = useState<any>(null);

  const openForm = () => { if (requireAuth()) { setEditingClient(null); setShowForm(true); } };
  const openEdit = (c: any) => { if (requireAuth()) { setEditingClient(c); setShowForm(true); } };

  const load = () => {
    listClients().then((res) => {
      if (res.ok) setClients(res.clients || []);
    }).catch(() => {});
  };

  const fmtCountry = (c: any) => [c.city, c.country].filter(Boolean).join(", ") || "—";
  let rows = clients;
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q));
  }

  const del = async (id: string) => {
    const ok = await confirm({
      title: L("Müşteriyi sil", "Delete client"),
      message: L("Bu müşteriyi silmek istediğine emin misin? Bu işlem geri alınamaz.", "Delete this client? This cannot be undone."),
      confirmText: L("Sil", "Delete"),
      cancelText: L("İptal", "Cancel"),
      danger: true,
    });
    if (!ok) return;
    setClients((p) => p.filter((c) => c.id !== id));
    const res = await deleteClient(id);
    if (!res.ok) { toast.error(res.error || "Hata"); load(); }
  };

  return (
    <div>
      <PageHeader
        title={L("Müşteriler", "Clients")}
        subtitle={L("Müşteri bilgilerini yönet.", "Manage your client records.")}
        action={
          <button onClick={openForm} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {L("Yeni Müşteri", "New Client")}
          </button>
        }
      />

      {!loading && clients.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Users className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900 mb-1">{L("Henüz müşterin yok", "No clients yet")}</p>
            <p className="text-sm text-slate-500 mb-5">{L("İlk müşterini ekleyerek başla.", "Add your first client to get started.")}</p>
            <button onClick={openForm} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
              <Plus className="h-4 w-4" /> {L("Yeni Müşteri", "New Client")}
            </button>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative mb-4 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={L("Ara...", "Search...")}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="font-medium px-5 py-3">{L("Müşteri", "Client")}</th>
                    <th className="font-medium px-5 py-3 hidden md:table-cell">{L("E-posta", "Email")}</th>
                    <th className="font-medium px-5 py-3 hidden lg:table-cell">{L("Fatura", "Invoices")}</th>
                    <th className="font-medium px-5 py-3 text-right">{L("İşlem", "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                            {(c.name || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button onClick={() => setDetailClient(c)} className="font-medium text-slate-900 hover:text-blue-600 hover:underline text-left">{c.name}</button>
                            <p className="text-xs text-slate-400">{fmtCountry(c)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                        {c.email ? <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{c.email}</span> : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{c._count?.invoices ?? 0}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-blue-600 mr-2" title={L("Düzenle", "Edit")}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => del(c.id)} className="text-slate-400 hover:text-rose-600" title={L("Sil", "Delete")}><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">{L("Sonuç yok.", "No results.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {showForm && <ClientForm L={L} lang={lang} editClient={editingClient} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}

      {/* Müşteri detay penceresi */}
      {detailClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setDetailClient(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-base font-semibold">
                  {(detailClient.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-slate-900">{detailClient.name}</h2>
                  <p className="text-xs text-slate-400">{fmtCountry(detailClient)}</p>
                </div>
              </div>
              <button onClick={() => setDetailClient(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-sm">
              {detailClient.email && (
                <div className="flex justify-between gap-4"><span className="text-slate-400">{L("E-posta", "Email")}</span><span className="text-slate-700 text-right">{detailClient.email}</span></div>
              )}
              {detailClient.phone && (
                <div className="flex justify-between gap-4"><span className="text-slate-400">{L("Telefon", "Phone")}</span><span className="text-slate-700 text-right">{detailClient.phone}</span></div>
              )}
              {detailClient.vatId && (
                <div className="flex justify-between gap-4"><span className="text-slate-400">{L("Vergi / VAT No", "Tax / VAT No")}</span><span className="text-slate-700 text-right">{detailClient.vatId}</span></div>
              )}
              {detailClient.address && (
                <div className="flex justify-between gap-4"><span className="text-slate-400">{L("Adres", "Address")}</span><span className="text-slate-700 text-right">{detailClient.address}</span></div>
              )}
              {detailClient.city && (
                <div className="flex justify-between gap-4"><span className="text-slate-400">{L("Şehir", "City")}</span><span className="text-slate-700 text-right">{detailClient.city}</span></div>
              )}
              {detailClient.country && (
                <div className="flex justify-between gap-4"><span className="text-slate-400">{L("Ülke", "Country")}</span><span className="text-slate-700 text-right">{detailClient.country}</span></div>
              )}
              <div className="flex justify-between gap-4 pt-2 border-t border-slate-100"><span className="text-slate-400">{L("Fatura sayısı", "Invoices")}</span><span className="text-slate-700 font-medium">{detailClient._count?.invoices ?? 0}</span></div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => { const c = detailClient; setDetailClient(null); openEdit(c); }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
                <Pencil className="h-4 w-4" /> {L("Düzenle", "Edit")}
              </button>
              <button onClick={() => setDetailClient(null)}
                className="rounded-lg border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 hover:bg-slate-50">
                {L("Kapat", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientForm({ L, lang, onClose, onSaved, editClient }: { L: (tr: string, en?: string) => string; lang: string; onClose: () => void; onSaved: () => void; editClient?: any }) {
  // Düzenleme modunda mevcut müşteri bilgileriyle doldur
  const [form, setForm] = useState({
    name: editClient?.name || "",
    email: editClient?.email || "",
    phone: editClient?.phone || "",
    vatId: editClient?.vatId || "",
    address: editClient?.address || "",
    city: editClient?.city || "",
    postalCode: "",
    country: editClient?.country || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const countries = getCountries(lang);

  const save = async () => {
    if (!form.name.trim()) { setError(L("Müşteri adı gerekli.", "Client name required.")); return; }
    setBusy(true); setError("");
    const fullAddress = [form.address, form.postalCode].filter(Boolean).join(", ");
    // editClient varsa GÜNCELLE, yoksa YENİ KAYIT
    const res = editClient
      ? await updateClient(editClient.id, { ...form, address: fullAddress })
      : await createClientRecord({ ...form, address: fullAddress });
    setBusy(false);
    if (res.ok) onSaved();
    else setError(res.error || "Hata");
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const lbl = "text-xs font-medium text-slate-500";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{editClient ? L("Müşteriyi Düzenle", "Edit Client") : L("Yeni Müşteri", "New Client")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div><label className={lbl}>{L("Şirket / Müşteri adı", "Company / Client name")} *</label><input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>{L("E-posta", "Email")}</label><input className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className={lbl}>{L("Telefon", "Phone")}</label><input className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><label className={lbl}>{L("Adres", "Address")}</label><input className={field} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>{L("Posta Kodu", "Postal Code")}</label><input className={field} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
            <div><label className={lbl}>{L("Şehir", "City")}</label><input className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div>
              <label className={lbl}>{L("Ülke", "Country")}</label>
              <select className={field} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                <option value="">{L("Seç...", "Select...")}</option>
                {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className={lbl}>{L("Vergi / VAT No", "Tax / VAT No")}</label><input className={field} value={form.vatId} onChange={(e) => setForm({ ...form, vatId: e.target.value })} /></div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50">{L("İptal", "Cancel")}</button>
          <button onClick={save} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{L("Kaydet", "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}
