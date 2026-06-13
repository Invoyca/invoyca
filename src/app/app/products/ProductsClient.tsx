"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import { Plus, Search, Package, X, Loader2, Trash2, Pencil } from "lucide-react";
import { listProducts, createProduct, deleteProduct, updateProduct } from "../data-actions";
import { useGuest } from "@/lib/guest-context";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";
import type { ProductVM } from "@/lib/view-models";

export default function ProductsClient({ initialProducts }: { initialProducts: ProductVM[] }) {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const { requireAuth } = useGuest();
  const confirm = useConfirm();
  const toast = useToast();
  const [products, setProducts] = useState<ProductVM[]>(initialProducts || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const openForm = () => { if (requireAuth()) { setEditingProduct(null); setShowForm(true); } };
  const openEdit = (p: any) => { if (requireAuth()) { setEditingProduct(p); setShowForm(true); } };

  const load = () => {
    listProducts().then((res) => {
      if (res.ok) setProducts(res.products || []);
    }).catch(() => {});
  };

  const fmt = (n: number, cur: string) => {
    const sym: any = { EUR: "€", USD: "$", GBP: "£", TRY: "₺" };
    return (sym[cur] || "") + Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  let rows = products;
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((p) => (p.name || "").toLowerCase().includes(q));
  }

  const del = async (id: string) => {
    const ok = await confirm({
      title: L("Ürünü sil", "Delete product"),
      message: L("Bu ürünü silmek istediğine emin misin? Bu işlem geri alınamaz.", "Delete this product? This cannot be undone."),
      confirmText: L("Sil", "Delete"),
      cancelText: L("İptal", "Cancel"),
      danger: true,
    });
    if (!ok) return;
    setProducts((p) => p.filter((x) => x.id !== id));
    const res = await deleteProduct(id);
    if (!res.ok) { toast.error(res.error || "Hata"); load(); }
  };

  return (
    <div>
      <PageHeader
        title={L("Ürünler", "Products")}
        subtitle={L("Ürün ve hizmet kataloğun.", "Your product & service catalog.")}
        action={
          <button onClick={openForm} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {L("Yeni Ürün", "New Product")}
          </button>
        }
      />

      {!loading && products.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Package className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900 mb-1">{L("Henüz ürün veya hizmet eklemedin", "No products or services yet")}</p>
            <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">{L("Sık kullandığın hizmetleri kaydet — danışmanlık, tasarım, saat bazlı iş. Fatura oluştururken birim ve fiyatıyla hazır gelir.", "Save the services you offer — consulting, design, hourly work. They appear ready with unit and price when you create an invoice.")}</p>
            <button onClick={openForm} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
              <Plus className="h-4 w-4" /> {L("Ürün / Hizmet Ekle", "Add Product / Service")}
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
                    <th className="font-medium px-5 py-3">{L("Ürün / Hizmet", "Product / Service")}</th>
                    <th className="font-medium px-5 py-3 hidden md:table-cell">{L("Birim", "Unit")}</th>
                    <th className="font-medium px-5 py-3 hidden lg:table-cell">{L("KDV", "VAT")}</th>
                    <th className="font-medium px-5 py-3 text-right">{L("Fiyat", "Price")}</th>
                    <th className="font-medium px-5 py-3 text-right">{L("İşlem", "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <button onClick={() => setDetailProduct(p)} className="font-medium text-slate-900 hover:text-blue-600 hover:underline text-left">{p.name}</button>
                        {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                      </td>
                      <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{p.unit || "—"}</td>
                      <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">%{Number(p.vatRate)}</td>
                      <td className="px-5 py-3 text-right font-medium">{fmt(Number(p.unitPrice), p.currency)}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-blue-600 mr-2" title={L("Düzenle", "Edit")}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => del(p.id)} className="text-slate-400 hover:text-rose-600" title={L("Sil", "Delete")}><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">{L("Sonuç yok.", "No results.")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {showForm && <ProductForm L={L} editProduct={editingProduct} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}

      {/* Ürün detay penceresi */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setDetailProduct(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Package className="h-6 w-6" /></div>
                <div>
                  <h2 className="font-semibold text-lg text-slate-900">{detailProduct.name}</h2>
                  {detailProduct.description && <p className="text-xs text-slate-400">{detailProduct.description}</p>}
                </div>
              </div>
              <button onClick={() => setDetailProduct(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-slate-400">{L("Birim Fiyat", "Unit Price")}</span><span className="text-slate-900 font-medium text-right">{fmt(Number(detailProduct.unitPrice), detailProduct.currency)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-400">{L("Birim", "Unit")}</span><span className="text-slate-700 text-right">{detailProduct.unit || "—"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-400">{L("KDV Oranı", "VAT Rate")}</span><span className="text-slate-700 text-right">%{Number(detailProduct.vatRate)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-400">{L("Para Birimi", "Currency")}</span><span className="text-slate-700 text-right">{detailProduct.currency || "EUR"}</span></div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => { const p = detailProduct; setDetailProduct(null); openEdit(p); }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
                <Pencil className="h-4 w-4" /> {L("Düzenle", "Edit")}
              </button>
              <button onClick={() => setDetailProduct(null)}
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

function ProductForm({ L, onClose, onSaved, editProduct }: { L: (tr: string, en?: string) => string; onClose: () => void; onSaved: () => void; editProduct?: any }) {
  const [form, setForm] = useState({
    name: editProduct?.name || "",
    description: editProduct?.description || "",
    unit: editProduct?.unit || "adet",
    unitPrice: editProduct?.unitPrice ?? 0,
    vatRate: editProduct?.vatRate ?? 20,
    currency: editProduct?.currency || "EUR",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name.trim()) { setError(L("Ürün adı gerekli.", "Product name required.")); return; }
    setBusy(true); setError("");
    const res = editProduct
      ? await updateProduct(editProduct.id, form)
      : await createProduct(form);
    setBusy(false);
    if (res.ok) onSaved();
    else setError(res.error || "Hata");
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const lbl = "text-xs font-medium text-slate-500";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{editProduct ? L("Ürünü Düzenle", "Edit Product") : L("Yeni Ürün", "New Product")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div><label className={lbl}>{L("Ürün / Hizmet", "Product / Service")} *</label><input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className={lbl}>{L("Açıklama", "Description")}</label><input className={field} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>{L("Birim", "Unit")}</label><input className={field} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div><label className={lbl}>{L("Fiyat", "Price")}</label><input type="number" className={field} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} /></div>
            <div><label className={lbl}>{L("KDV", "VAT")} %</label><input type="number" className={field} value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })} /></div>
          </div>
          <div><label className={lbl}>{L("Para birimi", "Currency")}</label>
            <select className={field} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option>EUR</option><option>USD</option><option>GBP</option><option>TRY</option>
            </select>
          </div>
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
