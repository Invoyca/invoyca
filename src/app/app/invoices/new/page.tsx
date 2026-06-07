"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { renderInvoiceHTML } from "@/lib/templates/render";
import { FAMILIES, THEMES, VARIANT_NAMES, FamilyId } from "@/lib/templates/data";
import { EditorState, emptyEditorState, toInvoiceData } from "@/lib/invoice-data";
import { calcTotals, formatMoney } from "@/lib/invoice-calc";
import { Plus, Trash2, Save, Eye, X, Download, Send, Loader2, CheckCircle2 } from "lucide-react";
import { saveInvoice } from "../actions";
import { printInvoicePdf } from "@/lib/pdf-print";

export default function NewInvoicePage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);

  const [st, setSt] = useState<EditorState>(emptyEditorState);
  const [variant, setVariant] = useState("standard");
  const [theme, setTheme] = useState("blue");
  const [qrMode, setQrMode] = useState("verify");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState("");

  const family = (Object.keys(FAMILIES) as FamilyId[]).find((f) => FAMILIES[f].variants.includes(variant)) || "classic";
  const totals = calcTotals(st.items, st.discount, st.taxMode);
  const data = toInvoiceData(st);
  const html = renderInvoiceHTML({ variant, theme, lang, docType: "invoice", qrMode, taxMode: st.taxMode, data });

  const upItem = (i: number, field: string, val: any) =>
    setSt((s) => ({ ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)) }));
  const addItem = () => setSt((s) => ({ ...s, items: [...s.items, { description: "", unit: "adet", quantity: 1, unitPrice: 0, vatRate: 20 }] }));
  const delItem = (i: number) => setSt((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setBusy("save");
    const res = await saveInvoice({
      number: st.meta.no, clientName: st.client.name, clientVat: st.client.vat,
      clientAddr: st.client.addr, clientEmail: st.client.email,
      currency: st.currency, taxMode: st.taxMode, qrMode, template: variant, themeColor: theme,
      issueDate: st.meta.issue, dueDate: st.meta.due,
      items: st.items, subtotal: totals.subtotal, vatTotal: totals.vatTotal, total: totals.total,
    });
    setBusy("");
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3500); }
    else alert((lang === "TR" ? "Kaydedilemedi: " : "Save failed: ") + (res.error || ""));
  };

  const renderOpts = () => ({ variant, theme, lang, docType: "invoice", qrMode, taxMode: st.taxMode, data });

  const downloadPdf = () => {
    printInvoicePdf(html, st.meta.no || "fatura");
  };

  const sendEmail = async () => {
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
      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 text-white px-5 py-3 shadow-lg">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium text-sm">{L("Fatura başarıyla kaydedildi", "Invoice saved successfully")}</span>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-xl font-semibold tracking-tight">{L("Yeni Fatura", "New Invoice")}</h1>
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
        <div className="space-y-5">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-medium text-sm mb-3">{L("Alıcı (Müşteri)", "Bill To (Client)")}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className={lbl}>{L("Şirket adı", "Company name")}</label><input className={field} value={st.client.name} onChange={(e) => setSt((s) => ({ ...s, client: { ...s.client, name: e.target.value } }))} /></div>
              <div><label className={lbl}>{L("VAT No", "VAT No")}</label><input className={field} value={st.client.vat} onChange={(e) => setSt((s) => ({ ...s, client: { ...s.client, vat: e.target.value } }))} /></div>
              <div className="sm:col-span-2"><label className={lbl}>{L("Adres", "Address")}</label><textarea rows={2} className={field} value={st.client.addr} onChange={(e) => setSt((s) => ({ ...s, client: { ...s.client, addr: e.target.value } }))} /></div>
            </div>
          </div>

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
              <div><label className={lbl}>QR</label>
                <select className={field} value={qrMode} onChange={(e) => setQrMode(e.target.value)}>
                  <option value="verify">{L("Doğrulama", "Verify")}</option>
                  <option value="pay">{L("Ödeme", "Pay")}</option>
                  <option value="off">{L("Kapalı", "Off")}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-sm">{L("Kalemler", "Line Items")}</p>
              <button onClick={addItem} className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline"><Plus className="h-4 w-4" /> {L("Kalem ekle", "Add item")}</button>
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
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <div className="w-56 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500"><span>{L("Ara Toplam", "Subtotal")}</span><span>{formatMoney(totals.subtotal, st.currency)}</span></div>
                <div className="flex justify-between text-slate-500"><span>{L("KDV", "VAT")}</span><span>{formatMoney(totals.vatTotal, st.currency)}</span></div>
                <div className="flex justify-between font-semibold text-slate-900 pt-1.5 border-t border-slate-100"><span>{L("Toplam", "Total")}</span><span>{formatMoney(totals.total, st.currency)}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block sticky top-24">
          <p className="text-xs font-medium text-slate-500 mb-2">{L("Canlı Önizleme", "Live Preview")}</p>
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: "1/1.414" }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 lg:hidden" onClick={() => setShowPreview(false)}>
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPreview(false)} className="absolute -top-10 right-0 text-white"><X className="h-6 w-6" /></button>
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: "1/1.414" }} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      )}
    </div>
  );
}