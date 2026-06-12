"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { renderInvoiceHTML } from "@/lib/templates/render";
import { FAMILIES, THEMES, VARIANT_NAMES, FamilyId } from "@/lib/templates/data";
import { EditorState, emptyEditorState, toInvoiceData } from "@/lib/invoice-data";
import { calcTotals, formatMoney } from "@/lib/invoice-calc";
import { UNIT_ORDER, unitLabel, normalizeUnit } from "@/lib/units";
import { Plus, Trash2, Save, Eye, X, Download, Send, Loader2, CheckCircle2 } from "lucide-react";
import { saveInvoice, getNextInvoiceNumber, getInvoice } from "../actions";
import { listClients, listProducts, getAccountInfo, listBankAccounts } from "../../data-actions";
import { useGuest } from "@/lib/guest-context";
import { useToast } from "@/lib/toast-context";

export default function NewInvoicePage() {
  const { lang } = useLang();
  const router = useRouter();
  const { requireAuth } = useGuest();
  const toast = useToast();
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
  // Fatura dili — program dilinden BAĞIMSIZ. Öncelik: müşteri dili > ayar varsayılanı > program dili
  const [invoiceLang, setInvoiceLang] = useState<string>(lang);
  const [companyDefaultLang, setCompanyDefaultLang] = useState<string | null>(null);
  const [companyQr, setCompanyQr] = useState<string>("");   // şirketin varsayılan ödeme QR'ı
  const [companyQrVerify, setCompanyQrVerify] = useState<string>(""); // şirketin doğrulama QR'ı
  const [invoiceQr, setInvoiceQr] = useState<string>("");   // bu faturaya özel QR (boşsa şirketinki)
  const [bankAccounts, setBankAccounts] = useState<any[]>([]); // kayıtlı banka hesapları
  const [selectedBankId, setSelectedBankId] = useState<string>(""); // seçili hesap
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsQuote(params.get("type") === "quote");
    setEditId(params.get("id"));
  }, []);

  // Kayıtlı müşteri ve ürünleri yükle (faturada seçim için)
  useEffect(() => {
    listClients().then((r) => { if (r.ok) setSavedClients(r.clients || []); }).catch(() => {});
    listProducts().then((r) => { if (r.ok) setSavedProducts(r.products || []); }).catch(() => {});
    // Kayıtlı banka hesaplarını yükle; varsayılanı (veya ilkini) faturaya uygula
    listBankAccounts().then((r) => {
      if (r.ok && r.accounts.length > 0) {
        setBankAccounts(r.accounts);
        const params = new URLSearchParams(window.location.search);
        // Düzenleme değilse varsayılan hesabı otomatik seç
        if (!params.get("id")) {
          const def = r.accounts.find((a: any) => a.isDefault) || r.accounts[0];
          setSelectedBankId(def.id);
          setSt((s) => ({ ...s, bank: { name: def.bankName || "", iban: def.iban, swift: def.swift || "" } }));
        }
      }
    }).catch(() => {});
    // Şirketin varsayılan fatura dilini al (yeni faturada başlangıç dili)
    getAccountInfo().then((r) => {
      if (r.ok && r.company?.qrImage) setCompanyQr(r.company.qrImage);
      if (r.ok && (r.company as any)?.qrVerify) setCompanyQrVerify((r.company as any).qrVerify);
      if (r.ok && r.company?.defaultLanguage) {
        setCompanyDefaultLang(r.company.defaultLanguage);
        // Düzenleme/müşteri seçimi henüz olmadıysa varsayılanı uygula
        setInvoiceLang((cur) => cur);
        const params = new URLSearchParams(window.location.search);
        if (!params.get("id")) setInvoiceLang(r.company.defaultLanguage);
      }
    }).catch(() => {});
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
              description: it.description, unit: normalizeUnit(it.unit || "piece"), quantity: Number(it.quantity),
              unitPrice: Number(it.unitPrice), vatRate: Number(it.vatRate),
            })),
            currency: inv.currency || "EUR",
            taxMode: (inv.taxMode || "NORMAL").toLowerCase(),
          }));
          // Faturanın kayıtlı dilini yükle
          if (inv.language) setInvoiceLang(inv.language);
          // Kaydedilmiş banka bilgisini yükle (snapshot)
          if (inv.bankIban || inv.bankName) {
            setSt((s) => ({ ...s, bank: { name: inv.bankName || "", iban: inv.bankIban || "", swift: inv.bankSwift || "" } }));
            setSelectedBankId("custom");
          }
          // Faturaya özel QR varsa yükle
          if (inv.qrImage) setInvoiceQr(inv.qrImage);
          if (inv.qrMode) { const m = String(inv.qrMode).toLowerCase(); setQrMode(m === "off" ? "off" : (m === "pay" ? "pay" : "verify")); }
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
    // Bu müşteriye daha önce hangi dilde fatura kesildiyse onu kullan (hatırlanır)
    if (c.preferredLanguage) setInvoiceLang(c.preferredLanguage);
  };

  // Kayıtlı ürün bir satıra eklenir
  const pickProduct = (id: string) => {
    const p = savedProducts.find((x) => x.id === id);
    if (!p) return;
    setSt((s) => ({ ...s, items: [...s.items, {
      description: p.name + (p.description ? ` — ${p.description}` : ""),
      unit: normalizeUnit(p.unit || "piece"),
      quantity: 1,
      unitPrice: Number(p.unitPrice) || 0,
      vatRate: Number(p.vatRate) || 20,
    }] }));
  };

  const family = (Object.keys(FAMILIES) as FamilyId[]).find((f) => FAMILIES[f].variants.includes(variant)) || "classic";
  const totals = calcTotals(st.items, st.discount, st.taxMode);
  const data = toInvoiceData(st, invoiceLang);
  // Etkili QR: faturaya özel varsa o; yoksa seçilen QR tipine göre şirket varsayılanı
  const effectiveQr = qrMode === "off" ? "" : (invoiceQr || (qrMode === "verify" ? companyQrVerify : companyQr));
  const html = renderInvoiceHTML({ variant, theme, lang: invoiceLang, docType: isQuote ? "quote" : "invoice", qrMode, qrImage: effectiveQr, taxMode: st.taxMode, data });

  const upItem = (i: number, field: string, val: any) =>
    setSt((s) => ({ ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)) }));
  const addItem = () => setSt((s) => ({ ...s, items: [...s.items, { description: "", unit: "piece", quantity: 1, unitPrice: 0, vatRate: 20 }] }));
  const delItem = (i: number) => setSt((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  // Kaydetme: server action'a gönderir (Supabase bağlanınca DB'ye yazar)
  // Dönen invoice id'sini döndürür ki e-posta gönderme gibi işlemler kullanabilsin.
  const save = async (exitAfter = false): Promise<string | null> => {
    if (!requireAuth()) return null;
    setBusy("save");
    const res = await saveInvoice({
      id: editId || undefined,
      number: st.meta.no, clientName: st.client.name, clientVat: st.client.vat,
      clientAddr: st.client.addr, clientEmail: st.client.email,
      currency: st.currency, taxMode: st.taxMode, qrMode, qrImage: invoiceQr || undefined, template: variant, themeColor: theme,
      bankName: st.bank.name || undefined, bankIban: st.bank.iban || undefined, bankSwift: st.bank.swift || undefined,
      issueDate: st.meta.issue, dueDate: st.meta.due,
      items: st.items, subtotal: totals.subtotal, vatTotal: totals.vatTotal, total: totals.total,
      docType: isQuote ? "QUOTE" : "INVOICE",
      language: invoiceLang,
    });
    setBusy("");
    if (res.ok) {
      setSaved(true);
      toast.success(lang === "TR" ? "Fatura kaydedildi" : "Invoice saved");
      if (res.id) setEditId(res.id); // sonraki kayıtlar güncelleme olsun
      // Kaydet butonuyla kaydedince faturalar sayfasına dön
      if (exitAfter) {
        router.push(isQuote ? "/app/quotes" : "/app/invoices");
      }
      return res.id || editId || null;
    }
    toast.error(saveErrorMessage((res as any).errorCode, (res as any).error, lang));
    return null;
  };

  const renderOpts = () => ({ variant, theme, lang: invoiceLang, docType: isQuote ? "quote" : "invoice", qrMode, qrImage: effectiveQr, taxMode: st.taxMode, data });

  const downloadPdf = async () => {
    setBusy("pdf");
    try {
      const res = await fetch("/api/invoice-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          lang: invoiceLang,
          docType: isQuote ? "quote" : "invoice",
          taxMode: st.taxMode,
          themeColor: theme,
          qrImage: effectiveQr || undefined,
          filename: st.meta.no || "fatura",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "PDF");
      }
      // PDF blob'unu indir
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(st.meta.no || "fatura").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(L("PDF oluşturulamadı: ", "Could not create PDF: ") + (e.message || ""));
    } finally {
      setBusy("");
    }
  };

  const sendEmail = async () => {
    if (!requireAuth()) return;
    // Güvenli model: e-posta için faturanın DB'de kayıtlı olması gerekir.
    // Önce kaydet (id al), sonra backend invoiceId ile faturayı DB'den çekip PDF'i kendisi üretip gönderir.
    const to = st.client.email || window.prompt(L("Müşteri e-postası:", "Client email:")) || "";
    if (!to) return;
    setBusy("email");
    try {
      // Faturayı kaydet / güncelle, id al
      const invoiceId = await save();
      if (!invoiceId) { setBusy(""); return; } // kaydetme başarısızsa save() zaten uyardı

      const res = await fetch("/api/send-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, toOverride: to }),
      });
      const j = await res.json();
      if (j.ok) toast.success(L("E-posta gönderildi (PDF ekli)", "Email sent (PDF attached)"));
      else throw new Error(j.error);
    } catch (e: any) {
      toast.error(L("E-posta gönderilemedi: ", "Email failed: ") + (e.message || L("Resend anahtarı gerekli.", "Resend key required.")));
    } finally { setBusy(""); }
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
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-slate-50/95 backdrop-blur border-b border-slate-200 flex items-center justify-between flex-wrap gap-3 mb-6">
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
          <button onClick={() => save(true)} disabled={busy==="save"} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60">
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
              <div><label className={lbl}>{L("Fatura dili", "Invoice language")}</label>
                <select className={field} value={invoiceLang} onChange={(e) => setInvoiceLang(e.target.value)}>
                  <option value="TR">Türkçe</option>
                  <option value="EN">English</option>
                  <option value="DE">Deutsch</option>
                  <option value="NL">Nederlands</option>
                  <option value="FR">Français</option>
                  <option value="ES">Español</option>
                  <option value="IT">Italiano</option>
                </select>
              </div>
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

              {/* Banka hesabı (IBAN) seçimi */}
              <div className="sm:col-span-2">
                <label className={lbl}>{L("Banka Hesabı (IBAN)", "Bank Account (IBAN)")}</label>
                {bankAccounts.length > 0 ? (
                  <select className={field} value={selectedBankId} onChange={(e) => {
                    const id = e.target.value;
                    setSelectedBankId(id);
                    if (id === "custom") return; // özel: aşağıdaki alanlardan girilsin
                    const acc = bankAccounts.find((a) => a.id === id);
                    if (acc) setSt((s) => ({ ...s, bank: { name: acc.bankName || "", iban: acc.iban, swift: acc.swift || "" } }));
                  }}>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.label} — {a.iban}{a.currency ? ` (${a.currency})` : ""}</option>
                    ))}
                    <option value="custom">{L("Bu fatura için özel gir…", "Custom for this invoice…")}</option>
                  </select>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">{L("Kayıtlı banka hesabın yok. Ayarlar → Banka & Ödeme bölümünden ekle, ya da aşağıya elle gir.", "No saved bank account. Add one in Settings → Bank & Payment, or enter manually below.")}</p>
                )}
                {/* Özel/elle giriş alanları (kayıtlı hesap yoksa veya 'özel' seçildiyse) */}
                {(bankAccounts.length === 0 || selectedBankId === "custom") && (
                  <div className="grid sm:grid-cols-3 gap-2 mt-2">
                    <input className={field} placeholder={L("Banka adı", "Bank name")} value={st.bank.name} onChange={(e) => setSt((s) => ({ ...s, bank: { ...s.bank, name: e.target.value } }))} />
                    <input className={field} placeholder="IBAN" value={st.bank.iban} onChange={(e) => setSt((s) => ({ ...s, bank: { ...s.bank, iban: e.target.value } }))} />
                    <input className={field} placeholder="SWIFT/BIC" value={st.bank.swift} onChange={(e) => setSt((s) => ({ ...s, bank: { ...s.bank, swift: e.target.value } }))} />
                  </div>
                )}
              </div>
              <div><label className={lbl}>{L("QR Kod", "QR Code")}</label>
                <select className={field} value={qrMode} onChange={(e) => setQrMode(e.target.value)}>
                  <option value="pay">{L("Ödeme QR'ı", "Payment QR")}</option>
                  <option value="verify">{L("Doğrulama QR'ı (GİB/e-Arşiv)", "Verification QR")}</option>
                  <option value="off">{L("QR Yok", "No QR")}</option>
                </select>
                {qrMode !== "off" && (() => {
                  // Etkili QR: faturaya özel varsa o; yoksa seçilen tipe göre şirket varsayılanı
                  const defaultForMode = qrMode === "verify" ? companyQrVerify : companyQr;
                  const effective = invoiceQr || defaultForMode;
                  return (
                    <div className="mt-2">
                      {effective ? (
                        <div className="flex items-center gap-2">
                          <img src={effective} alt="QR" className="h-12 w-12 rounded border border-slate-200 object-contain bg-white p-0.5" />
                          <div className="flex flex-col gap-1">
                            <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                              {L("Bu fatura için değiştir", "Change for this invoice")}
                              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0]; if (!file) return;
                                if (file.size > 500 * 1024) { toast.error(L("Resim çok büyük (max 500 KB).", "Image too large (max 500 KB).")); return; }
                                const reader = new FileReader();
                                reader.onload = () => setInvoiceQr(String(reader.result));
                                reader.readAsDataURL(file);
                              }} />
                            </label>
                            {invoiceQr && <button onClick={() => setInvoiceQr("")} className="text-xs text-slate-400 hover:text-slate-600 text-left">{L("Varsayılana dön", "Reset to default")}</button>}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">{L("Bu QR türü için Ayarlar → Banka & Ödeme bölümünden resim yükle.", "Upload an image for this QR type in Settings → Bank & Payment.")}</p>
                      )}
                    </div>
                  );
                })()}
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
                  <input className={field + " col-span-4"} placeholder={L("Açıklama", "Description")} value={it.description} onChange={(e) => upItem(i, "description", e.target.value)} />
                  <input className={field + " col-span-1"} type="number" placeholder={L("Adet", "Qty")} value={it.quantity === 0 ? "" : it.quantity} onChange={(e) => upItem(i, "quantity", e.target.value === "" ? 0 : Number(e.target.value))} onFocus={(e) => e.target.select()} />
                  <select className={field + " col-span-2"} value={normalizeUnit(it.unit)} onChange={(e) => upItem(i, "unit", e.target.value)}>
                    {UNIT_ORDER.map((u) => (
                      <option key={u} value={u}>{unitLabel(u, invoiceLang)}</option>
                    ))}
                  </select>
                  <input className={field + " col-span-2"} type="number" placeholder={L("Fiyat", "Price")} value={it.unitPrice === 0 ? "" : it.unitPrice} onChange={(e) => upItem(i, "unitPrice", e.target.value === "" ? 0 : Number(e.target.value))} onFocus={(e) => e.target.select()} />
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
// Kaydetme hata kodunu kullanıcının diline çevirir (karışık dil olmaz)
function saveErrorMessage(code: string | undefined, fallback: string | undefined, lang: string): string {
  const M: Record<string, Record<string, string>> = {
    item_description: { TR: "Lütfen tüm fatura kalemlerine bir açıklama girin.", EN: "Please enter a description for every line item.", DE: "Bitte gib für jede Position eine Beschreibung ein.", NL: "Voer een omschrijving in voor elke regel.", FR: "Veuillez saisir une description pour chaque ligne.", ES: "Introduce una descripción para cada línea.", IT: "Inserisci una descrizione per ogni riga." },
    item_quantity: { TR: "Miktar geçerli bir sayı olmalı.", EN: "Quantity must be a valid number.", DE: "Die Menge muss eine gültige Zahl sein.", NL: "Aantal moet een geldig getal zijn.", FR: "La quantité doit être un nombre valide.", ES: "La cantidad debe ser un número válido.", IT: "La quantità deve essere un numero valido." },
    item_price: { TR: "Fiyat negatif olamaz.", EN: "Price cannot be negative.", DE: "Der Preis darf nicht negativ sein.", NL: "Prijs mag niet negatief zijn.", FR: "Le prix ne peut pas être négatif.", ES: "El precio no puede ser negativo.", IT: "Il prezzo non può essere negativo." },
    item_vat: { TR: "KDV oranı 0–100 arasında olmalı.", EN: "VAT rate must be between 0 and 100.", DE: "Der MwSt.-Satz muss zwischen 0 und 100 liegen.", NL: "Btw-tarief moet tussen 0 en 100 liggen.", FR: "Le taux de TVA doit être compris entre 0 et 100.", ES: "El IVA debe estar entre 0 y 100.", IT: "L'IVA deve essere tra 0 e 100." },
    client_email: { TR: "Müşteri e-postası geçerli değil.", EN: "Client email is not valid.", DE: "Die Kunden-E-Mail ist ungültig.", NL: "Klant-e-mail is ongeldig.", FR: "L'e-mail du client n'est pas valide.", ES: "El correo del cliente no es válido.", IT: "L'email del cliente non è valida." },
    due_date: { TR: "Vade tarihi, fatura tarihinden önce olamaz.", EN: "Due date cannot be before the issue date.", DE: "Das Fälligkeitsdatum darf nicht vor dem Rechnungsdatum liegen.", NL: "Vervaldatum mag niet vóór de factuurdatum liggen.", FR: "L'échéance ne peut pas précéder la date de facture.", ES: "El vencimiento no puede ser anterior a la fecha de factura.", IT: "La scadenza non può precedere la data della fattura." },
    items_empty: { TR: "En az bir fatura kalemi ekleyin.", EN: "Add at least one line item.", DE: "Füge mindestens eine Position hinzu.", NL: "Voeg minstens één regel toe.", FR: "Ajoutez au moins une ligne.", ES: "Añade al menos una línea.", IT: "Aggiungi almeno una riga." },
    number: { TR: "Fatura numarası gerekli.", EN: "Invoice number is required.", DE: "Rechnungsnummer ist erforderlich.", NL: "Factuurnummer is vereist.", FR: "Le numéro de facture est requis.", ES: "El número de factura es obligatorio.", IT: "Il numero di fattura è obbligatorio." },
    invalid: { TR: "Lütfen formdaki bilgileri kontrol edin.", EN: "Please check the form fields.", DE: "Bitte überprüfe die Formularfelder.", NL: "Controleer de formuliervelden.", FR: "Veuillez vérifier les champs du formulaire.", ES: "Revisa los campos del formulario.", IT: "Controlla i campi del modulo." },
  };
  if (code && M[code]) return M[code][lang] || M[code]["EN"];
  // errorCode yoksa (DB hatası vb.) genel mesaj — yine tek dil
  const generic: Record<string, string> = { TR: "Kaydedilemedi. Lütfen tekrar deneyin.", EN: "Could not save. Please try again.", DE: "Speichern fehlgeschlagen. Bitte erneut versuchen.", NL: "Opslaan mislukt. Probeer opnieuw.", FR: "Échec de l'enregistrement. Réessayez.", ES: "No se pudo guardar. Inténtalo de nuevo.", IT: "Salvataggio non riuscito. Riprova." };
  return generic[lang] || generic["EN"];
}

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
