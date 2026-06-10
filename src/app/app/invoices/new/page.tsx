"use client";

import { useState, useEffect, useRef } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { renderInvoiceHTML } from "@/lib/templates/render";
import { FAMILIES, THEMES, VARIANT_NAMES, FamilyId } from "@/lib/templates/data";
import { EditorState, emptyEditorState, toInvoiceData } from "@/lib/invoice-data";
import { calcTotals, formatMoney } from "@/lib/invoice-calc";
import { Plus, Trash2, Save, Eye, X, Download, Send, Loader2, CheckCircle2 } from "lucide-react";
import { saveInvoice, getNextInvoiceNumber, getInvoice } from "../actions";
import { listClients, listProducts } from "../../data-actions";
import { useGuest } from "@/lib/guest-context";
import { printInvoicePdf } from "@/lib/pdf-print";

export default function NewInvoicePage() {
  const { lang } = useLang();
  const { requireAuth } = useGuest();
  const L = (tr: string, _en?: string) => appT(lang, tr);

  const [st, setSt] = useState<EditorState>(emptyEditorState);
  const [variant, setVariant] = useState("standard");
  const [theme, setTheme] = useState("blue");
  const [qrMode, setQrMode] = useState("verify");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState("");
  const [savedClients, setSavedClients] = useState<any[]>([]);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  // URL'de ?type=quote varsa teklif modu, ?id=... varsa düzenleme modu
  const [isQuote, setIsQuote] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsQuote(params.get("type") === "quote");
    setEditId(params.get("id"));
  }, []);

  // Kayıtlı müşteri ve ürünleri yükle (faturada seçim için)
  useEffect(() => {
    listClients().then((r) => { if (r.ok) setSavedClients(r.clients || []); }).catch(() => {});
    listProducts().then((r) => { if (r.ok) setSavedProducts(r.products || []); }).catch(() => {});
  }, []);

  // Düzenleme mi yeni mi? id varsa faturayı yükle; yoksa sıradaki numarayı al.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      getInvoice(id).then((r) => {
        if (r.ok && r.invoice) {
          const inv: any = r.invoice;
          setSt((s) => ({
            ...s,
            client: {
              name: inv.client?.name || "",
              addr: inv.client?.address || "",
              vat: inv.client?.vatId || "",
              email: inv.client?.email || "",
            },
            meta: {
              no: inv.number || s.meta.no,
              issue: inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("tr-TR") : s.meta.issue,
              due: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("tr-TR") : "",
              ref: s.meta.ref,
            },
            items: (inv.items || []).map((it: any) => ({
              description: it.description, unit: it.unit, quantity: Number(it.quantity),
              unitPrice: Number(it.unitPrice), vatRate: Number(it.vatRate),
            })),
            currency: inv.currency || "EUR",
            taxMode: (inv.taxMode || "NORMAL").toLowerCase(),
          }));
        }
      }).catch(() => {});
    } else {
      getNextInvoiceNumber().then((r) => {
        if (r.ok && r.number) setSt((s) => ({ ...s, meta: { ...s.meta, no: r.number } }));
      }).catch(() => {});
    }
  }, []);

  // Kayıtlı müşteri seçilince alanları doldur
  const pickClient = (id: string) => {
    const c = savedClients.find((x) => x.id === id);
    if (!c) return;
    setSt((s) => ({ ...s, client: {
      ...s.client,
      name: c.name || "",
      vat: c.vatId || "",
      addr: [c.address, c.city, c.country].filter(Boolean).join(", "),
      email: c.email || "",
    } }));
  };

  // Kayıtlı ürün bir satıra eklenir
  const pickProduct = (id: string) => {
    const p = savedProducts.find((x) => x.id === id);
    if (!p) return;
    setSt((s) => ({ ...s, items: [...s.items, {
      description: p.name + (p.description ? ` — ${p.description}` : ""),
      unit: p.unit || "adet",
      quantity: 1,
      unitPrice: Number(p.unitPrice) || 0,
      vatRate: Number(p.vatRate) || 20,
    }] }));
  };

  const family = (Object.keys(FAMILIES) as FamilyId[]).find((f) => FAMILIES[f].variants.includes(variant)) || "classic";
  const totals = calcTotals(st.items, st.discount, st.taxMode);
  const data = toInvoiceData(st);
  const html = renderInvoiceHTML({ variant, theme, lang, docType: isQuote ? "quote" : "invoice", qrMode, taxMode: st.taxMode, data });

  const upItem = (i: number, field: string, val: any) =>
    setSt((s) => ({ ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)) }));
  const addItem = () => setSt((s) => ({ ...s, items: [...s.items, { description: "", unit: "adet", quantity: 1, unitPrice: 0, vatRate: 20 }] }));
  const delItem = (i: number) => setSt((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  // Kaydetme: server action'a gönderir (Supabase bağlanınca DB'ye yazar)
  const save = async () => {
    if (!requireAuth()) return;
    setBusy("save");
    const res = await saveInvoice({
      id: editId || undefined,
      number: st.meta.no, clientName: st.client.name, clientVat: st.client.vat,
      clientAddr: st.client.addr, clientEmail: st.client.email,
      currency: st.currency, taxMode: st.taxMode, qrMode, template: variant, themeColor: theme,
      issueDate: st.meta.issue, dueDate: st.meta.due,
      items: st.items, subtotal: totals.subtotal, vatTotal: totals.vatTotal, total: totals.total,
      docType: isQuote ? "QUOTE" : "INVOICE",
    });
    setBusy("");
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3500); }
    else alert((lang === "TR" ? "Kaydedilemedi: " : "Save failed: ") + (res.error || ""));
  };

  const renderOpts = () => ({ variant, theme, lang, docType: isQuote ? "quote" : "invoice", qrMode, taxMode: st.taxMode, data });

  const downloadPdf = () => {
    printInvoicePdf(html, st.meta.no || "fatura");
  };

  const sendEmail = async () => {
    if (!requireAuth()) return;
    const to = st.client.email || window.prompt(L("Müşteri e-postası:", "Client email:")) || "";
    if (!to) return;
    setBusy("email");
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to, lang,
          clientName: st.client.name, invoiceNo: st.meta.no,
          senderName: st.sender.name, amount: formatMoney(totals.total, st.currency),
          replyTo: st.sender.email,
        }),
      });
      const j = await res.json();
      if (j.ok) alert(L("E-posta gönderildi ✓", "Email sent ✓"));
      else throw new Error(j.error);
    } catch (e) { alert(L("E-posta gönderilemedi (Resend anahtarı gerekli).", "Email failed (Resend key required).")); }
    finally { setBusy(""); }
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400";
  const lbl = "text-xs font-medium text-slate-500";

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Kayıt başarılı bildirimi */}
      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 text-white px-5 py-3 shadow-lg">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium text-sm">{L("Fatura başarıyla kaydedildi", "Invoice saved successfully")}</span>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-xl font-semibold tracking-tight">{editId ? L("Faturayı Düzenle", "Edit Invoice") : isQuote ? L("Yeni Teklif", "New Quote") : L("Yeni Fatura", "New Invoice")}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(true)} className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50">
            <Eye className="h-4 w-4" /> {L("Önizle", "Preview")}
          </button>
          <button onClick={downloadPdf} disabled={busy==="pdf"} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-60">
            {busy==="pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF
          </button>
          <button onClick={sendEmail} disabled={busy==="email"} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-60">
            {busy==="email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {L("Gönder", "Send")}
          </button>
          <button onClick={save} disabled={busy==="save"} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60">
            {busy==="save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {busy==="save" ? L("Kaydediliyor...", "Saving...") : (saved ? L("Kaydedildi ✓", "Saved ✓") : L("Kaydet", "Save"))}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_480px] gap-6 items-start">
        {/* SOL: FORM */}
        <div className="space-y-5">
          {/* Şablon seçici */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-medium text-sm mb-3">{L("Şablon", "Template")}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <select value={variant} onChange={(e) => setVariant(e.target.value)} className={field + " max-w-xs"}>
                {(Object.keys(FAMILIES) as FamilyId[]).map((f) => (
                  <optgroup key={f} label={FAMILIES[f].name}>
                    {FAMILIES[f].variants.map((v) => <option key={v} value={v}>{VARIANT_NAMES[v]}</option>)}
                  </optgroup>
                ))}
              </select>
              <div className="flex gap-1.5">
                {THEMES.map((t) => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className={`h-6 w-6 rounded-full border-2 ${theme === t.id ? "scale-110 border-slate-900" : "border-transparent"}`} style={{ background: t.color }} />
                ))}
              </div>
            </div>
          </div>

          {/* Alıcı */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-medium text-sm mb-3">{L("Alıcı (Müşteri)", "Bill To (Client)")}</p>

            {/* Kayıtlı müşteriden seç (varsa) */}
            {savedClients.length > 0 && (
              <div className="mb-3">
                <label className={lbl}>{L("Kayıtlı müşteriden seç", "Pick saved client")}</label>
                <select className={field} defaultValue="" onChange={(e) => { pickClient(e.target.value); e.target.value = ""; }}>
                  <option value="" disabled>{L("Seç...", "Select...")}</option>
                  {savedClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className={lbl}>{L("Şirket adı", "Company name")}</label><input className={field} value={st.client.name} onChange={(e) => setSt((s) => ({ ...s, client: { ...s.client, name: e.target.value } }))} /></div>
              <div><label className={lbl}>{L("VAT No", "VAT No")}</label><input className={field} value={st.client.vat} onChange={(e) => setSt((s) => ({ ...s, client: { ...s.client, vat: e.target.value } }))} /></div>
              <div className="sm:col-span-2"><label className={lbl}>{L("Adres", "Address")}</label><textarea rows={2} className={field} value={st.client.addr} onChange={(e) => setSt((s) => ({ ...s, client: { ...s.client, addr: e.target.value } }))} /></div>
            </div>
          </div>

          {/* Fatura bilgileri */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-medium text-sm mb-3">{L("Fatura Bilgileri", "Invoice Details")}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><label className={lbl}>{L("Fatura No", "Invoice No")}</label><input className={field} value={st.meta.no} onChange={(e) => setSt((s) => ({ ...s, meta: { ...s.meta, no: e.target.value } }))} /></div>
              <div><label className={lbl}>{L("Tarih", "Date")}</label><input className={field} value={st.meta.issue} onChange={(e) => setSt((s) => ({ ...s, meta: { ...s.meta, issue: e.target.value } }))} /></div>
              <div><label className={lbl}>{L("Vade", "Due")}</label><input className={field} value={st.meta.due} onChange={(e) => setSt((s) => ({ ...s, meta: { ...s.meta, due: e.target.value } }))} /></div>
              <div><label className={lbl}>{L("Para birimi", "Currency")}</label>
                <select className={field} value={st.currency} onChange={(e) => setSt((s) => ({ ...s, currency: e.target.value }))}>
                  <option>EUR</option><option>USD</option><option>GBP</option><option>TRY</option>
                </select>
              </div>
              <div><label className={lbl}>{L("Vergi modu", "Tax mode")}</label>
                <select className={field} value={st.taxMode} onChange={(e) => setSt((s) => ({ ...s, taxMode: e.target.value as any }))}>
                  <option value="normal">{L("Normal KDV", "Normal VAT")}</option>
                  <option value="reverse">{L("Tevkifat", "Reverse charge")}</option>
                  <option value="exempt">{L("Muaf", "Exempt")}</option>
                </select>
              </div>
              <div><label className={lbl}>{L("QR Kod", "QR Code")}</label>
                <select className={field} value={qrMode} onChange={(e) => setQrMode(e.target.value)}>
                  <option value="verify">{L("Türkiye e-Arşiv (GİB/ETTN)", "Türkiye e-Archive (GİB/ETTN)")}</option>
                  <option value="pay">{L("Ödeme QR (IBAN)", "Payment QR (IBAN)")}</option>
                  <option value="off">{L("QR Yok (Uluslararası)", "No QR (International)")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kalemler */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <p className="font-medium text-sm">{L("Kalemler", "Line Items")}</p>
              <div className="flex items-center gap-2">
                {savedProducts.length > 0 && (
                  <select className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" defaultValue="" onChange={(e) => { pickProduct(e.target.value); e.target.value = ""; }}>
                    <option value="" disabled>{L("Üründen ekle", "Add from product")}</option>
                    {savedProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
                <button onClick={addItem} className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline"><Plus className="h-4 w-4" /> {L("Kalem ekle", "Add item")}</button>
              </div>
            </div>
            <div className="space-y-2">
              {st.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className={field + " col-span-5"} placeholder={L("Açıklama", "Description")} value={it.description} onChange={(e) => upItem(i, "description", e.target.value)} />
                  <input className={field + " col-span-2"} type="number" placeholder={L("Adet", "Qty")} value={it.quantity} onChange={(e) => upItem(i, "quantity", Number(e.target.value))} />
                  <input className={field + " col-span-2"} type="number" placeholder={L("Fiyat", "Price")} value={it.unitPrice} onChange={(e) => upItem(i, "unitPrice", Number(e.target.value))} />
                  <div className="col-span-2 text-right text-sm font-medium">{formatMoney(it.quantity * it.unitPrice, st.currency)}</div>
                  <button onClick={() => delItem(i)} className="col-span-1 text-slate-400 hover:text-rose-600 flex justify-center"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            {/* Toplamlar */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <div className="w-56 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500"><span>{L("Ara Toplam", "Subtotal")}</span><span>{formatMoney(totals.subtotal, st.currency)}</span></div>
                <div className="flex justify-between text-slate-500"><span>{L("KDV", "VAT")}</span><span>{formatMoney(totals.vatTotal, st.currency)}</span></div>
                <div className="flex justify-between font-semibold text-slate-900 pt-1.5 border-t border-slate-100"><span>{L("Toplam", "Total")}</span><span>{formatMoney(totals.total, st.currency)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ: CANLI ÖNİZLEME (masaüstü) */}
        <div className="hidden lg:block sticky top-24">
          <p className="text-xs font-medium text-slate-500 mb-2">{L("Canlı Önizleme", "Live Preview")}</p>
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden mx-auto" style={{ width: 480, height: 480 * 1.414 }}>
            <div style={{ width: 794, height: 794 * 1.414, transform: `scale(${480/794})`, transformOrigin: "top left" }} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>

      {/* Mobil önizleme modalı */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 lg:hidden" onClick={() => setShowPreview(false)}>
          <div className="relative w-[88vw] max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPreview(false)} className="absolute -top-10 right-0 text-white"><X className="h-6 w-6" /></button>
            <MobilePreview html={html} />
          </div>
        </div>
      )}
    </div>
  );
}

// Mobil önizleme: container genişliğini ölçüp A4'ü (794px) tam oturacak şekilde küçültür.
// transform:scale görsel küçültür ama yer kaplamayı düzeltmek için dış kutu boyutu da ayarlanır → taşma olmaz.
function MobilePreview({ html }: { html: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const measure = () => {
      const w = wrapRef.current?.clientWidth || 0;
      if (w > 0) setScale(w / 794);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  return (
    // Dış sarmalayıcı: genişliği ekrana göre (%100). Bunu ölçüyoruz.
    <div ref={wrapRef} className="w-full">
      {scale > 0 && (
        // Görünen kutu: scale'li A4 yüksekliği kadar yer kaplar (taşma/boşluk yok)
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ height: 794 * 1.414 * scale }}>
          <div style={{ width: 794, height: 794 * 1.414, transform: `scale(${scale})`, transformOrigin: "top left" }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </div>
  );
}
