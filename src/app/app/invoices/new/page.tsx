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
import { Plus, Trash2, Save, Eye, X, Download, Send, Loader2, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { generateEmailDraft } from "../../ai-actions";
import { saveErrorMessage } from "./save-error";
import { MobilePreview } from "./MobilePreview";
import { getCountries } from "@/lib/countries";
import { saveInvoice, getNextInvoiceNumber, getInvoice } from "../actions";
import { listClients, listProducts, getAccountInfo, listBankAccounts, createClientRecord } from "../../data-actions";
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
  const [emailModal, setEmailModal] = useState<{ to: string; subject: string; message: string } | null>(null);
  const [clientModal, setClientModal] = useState<{ name: string; email: string; vatId: string; address: string; city: string; country: string } | null>(null);
  const [savingClient, setSavingClient] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
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
  const [companyLogo, setCompanyLogo] = useState<string>(""); // şirketin logosu
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
    listClients().then((r) => {
      if (r.ok) {
        setSavedClients(r.clients || []);
        // URL'de ?client=ID varsa (müşteri detayından "Bu müşteriye fatura") o müşteriyi seç
        const params = new URLSearchParams(window.location.search);
        const cid = params.get("client");
        if (cid && !params.get("id")) {
          const c = (r.clients || []).find((x: any) => x.id === cid);
          if (c) {
            setSt((s) => ({ ...s, client: {
              name: c.name || "", email: c.email || "",
              addr: [c.address, c.city, c.country].filter(Boolean).join("\n"),
              vat: c.vatId || "",
            } }));
            if (c.preferredLanguage) setInvoiceLang(String(c.preferredLanguage).toUpperCase() as any);
          }
        }
      }
    }).catch(() => {});
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
      if (r.ok && (r.company as any)?.logoUrl) setCompanyLogo((r.company as any).logoUrl);
      // Gönderen (senin şirketin) bilgisini önizlemeye doldur — örnek veriyi gerçek şirketle değiştir
      const params0 = new URLSearchParams(window.location.search);
      if (r.ok && r.company && !params0.get("id")) {
        const c: any = r.company;
        const addr = [c.address, c.city, c.country].filter(Boolean).join("\n");
        setSt((s) => ({ ...s, sender: {
          name: c.name || s.sender.name,
          addr: addr || s.sender.addr,
          tax: c.taxId || "",
          vat: c.vatId || "",
          email: c.email || "",
        } }));
        // Varsayılan vade: bugün + şirketin defaultDueDays'i (kullanıcı değiştirebilir)
        const days = typeof c.defaultDueDays === "number" ? c.defaultDueDays : 15;
        if (days > 0) {
          const due = new Date();
          due.setDate(due.getDate() + days);
          const dd = String(due.getDate()).padStart(2, "0");
          const mm = String(due.getMonth() + 1).padStart(2, "0");
          const yy = due.getFullYear();
          setSt((s) => ({ ...s, meta: { ...s.meta, due: `${dd}.${mm}.${yy}` } }));
        }
      }
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
              subtitle: inv.subtitle || "",
            },
            items: (inv.items || []).map((it: any) => ({
              description: it.description, unit: normalizeUnit(it.unit || "piece"), quantity: Number(it.quantity),
              unitPrice: Number(it.unitPrice), vatRate: Number(it.vatRate),
            })),
            currency: inv.currency || "EUR",
            taxMode: (inv.taxMode || "NORMAL").toLowerCase(),
            notes: inv.notes || "",
            terms: inv.terms || "",
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
  // Modal'dan yeni müşteri kaydet → listeye ekle → faturaya otomatik seç
  const saveNewClient = async () => {
    if (!clientModal) return;
    if (!clientModal.name.trim()) { toast.error(L("Müşteri adı gerekli.", "Client name required.")); return; }
    if (clientModal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientModal.email.trim())) {
      toast.error(L("Geçersiz e-posta adresi.", "Invalid email address.")); return;
    }
    setSavingClient(true);
    const res = await createClientRecord({
      name: clientModal.name.trim(),
      email: clientModal.email.trim() || undefined,
      vatId: clientModal.vatId.trim() || undefined,
      address: clientModal.address.trim() || undefined,
      city: clientModal.city.trim() || undefined,
      country: clientModal.country.trim() || undefined,
    });
    setSavingClient(false);
    if (!res.ok) { toast.error(res.error || L("Müşteri kaydedilemedi.", "Could not save client.")); return; }
    // Listeyi yenile + faturaya bu müşteriyi uygula
    const c = (res as any).client;
    if (c) {
      setSavedClients((prev) => [c, ...prev]);
      setSt((s) => ({ ...s, client: {
        ...s.client, name: c.name || "", vat: c.vatId || "",
        addr: [c.address, c.city, c.country].filter(Boolean).join("\n"),
        email: c.email || "",
      } }));
    }
    setClientModal(null);
    toast.success(L("Müşteri kaydedildi", "Client saved"));
  };

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
  const html = renderInvoiceHTML({ variant, theme, lang: invoiceLang, docType: isQuote ? "quote" : "invoice", qrMode, qrImage: effectiveQr, logoUrl: companyLogo, taxMode: st.taxMode, data });

  const upItem = (i: number, field: string, val: any) =>
    setSt((s) => ({ ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)) }));
  const addItem = () => setSt((s) => ({ ...s, items: [...s.items, { description: "", unit: "piece", quantity: 1, unitPrice: 0, vatRate: 20 }] }));
  const delItem = (i: number) => setSt((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  // Kaydetme: server action'a gönderir (Supabase bağlanınca DB'ye yazar)
  // Dönen invoice id'sini döndürür ki e-posta gönderme gibi işlemler kullanabilsin.
  const save = async (exitAfter = false): Promise<string | null> => {
    if (!requireAuth()) return null;

    // Kayıt öncesi net kontrol — kullanıcıya hangi alanın eksik olduğunu HEMEN söyle
    if (!st.client.name.trim()) {
      toast.error(L("Müşteri adı gerekli. 'Alıcı (Müşteri)' bölümünü doldur.", "Client name is required. Fill in the 'Bill To (Client)' section."));
      return null;
    }
    if (st.items.length === 0) {
      toast.error(L("En az bir fatura kalemi ekle.", "Add at least one line item."));
      return null;
    }
    const emptyItem = st.items.findIndex((it) => !it.description.trim());
    if (emptyItem >= 0) {
      toast.error(L(`${emptyItem + 1}. kalemin açıklaması boş. Lütfen doldur.`, `Line ${emptyItem + 1} has no description. Please fill it in.`));
      return null;
    }

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
      notes: st.notes || undefined,
      terms: st.terms || undefined,
      subtitle: st.meta.subtitle || undefined,
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
      // Önce kaydet ki DB'deki gerçek veriden PDF üretebilelim (preview≠PDF tutarsızlığını önler)
      let id = editId;
      if (!id) { id = await save(false); }
      const res = await fetch("/api/invoice-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: id
          ? JSON.stringify({ invoiceId: id })   // güvenli mod: DB'den çek
          : JSON.stringify({                      // kaydedilemezse önizleme moduna düş
              data, lang: invoiceLang,
              docType: isQuote ? "quote" : "invoice",
              taxMode: st.taxMode, themeColor: theme,
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

  // E-posta modalını aç — alanları otomatik doldur
  const openEmailModal = () => {
    if (!requireAuth()) return;
    const to = st.client.email || "";
    const docLabel = isQuote ? L("Teklif", "Quote") : L("Fatura", "Invoice");
    const subject = `${st.sender.name || "Invoyca"} — ${docLabel} ${st.meta.no || ""}`.trim();
    // Faturanın dilinde varsayılan mesaj
    const greet = st.client.name ? `${L("Merhaba")} ${st.client.name},` : `${L("Merhaba")},`;
    const intro = isQuote
      ? `${L("Numaralı teklifimizi ekte bulabilirsiniz:")} ${st.meta.no}`
      : `${L("Numaralı faturayı ekte bulabilirsiniz:")} ${st.meta.no}`;
    const sign = L("İyi çalışmalar") + `,\n${st.sender.name || ""}`;
    const message = `${greet}\n\n${intro}\n\n${sign}`;
    setEmailModal({ to, subject, message });
  };

  // AI ile e-posta mesajı öner — sonucu mesaj kutusuna yazar (kullanıcı düzenleyebilir)
  const suggestEmail = async () => {
    if (!emailModal) return;
    setAiBusy(true);
    try {
      const res = await generateEmailDraft({
        clientName: st.client.name || undefined,
        invoiceNo: st.meta.no || undefined,
        amount: data.total,
        currency: st.currency as any,
        dueDate: st.meta.due || undefined,
        companyName: st.sender.name || undefined,
        lang: invoiceLang as any,
        isQuote,
      });
      if (res.ok && res.text) {
        setEmailModal({ ...emailModal, message: res.text });
        toast.success(L("AI önerisi hazır — istersen düzenle", "AI draft ready — edit if you like"));
      } else {
        toast.error(res.error || L("AI önerisi alınamadı.", "Couldn't get AI suggestion."));
      }
    } catch {
      toast.error(L("AI önerisi alınamadı.", "Couldn't get AI suggestion."));
    } finally {
      setAiBusy(false);
    }
  };

  // Modaldan gerçek gönderim
  const doSendEmail = async () => {
    if (!emailModal) return;
    const { to, subject, message } = emailModal;
    if (!to.trim()) { toast.error(L("Alıcı e-postası gerekli.", "Recipient email required.")); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) { toast.error(L("Geçersiz e-posta adresi.", "Invalid email address.")); return; }
    setBusy("email");
    try {
      const invoiceId = await save();
      if (!invoiceId) { setBusy(""); return; }
      const res = await fetch("/api/send-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, toOverride: to.trim(), subject: subject.trim(), customMessage: message }),
      });
      const j = await res.json();
      if (j.ok) {
        toast.success(L("E-posta gönderildi (PDF ekli)", "Email sent (PDF attached)"));
        setEmailModal(null);
      } else throw new Error(j.error);
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
          <button onClick={openEmailModal} disabled={busy==="email"} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-60">
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

            {/* Kayıtlı müşteriden seç (varsa) + yeni ekle */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className={lbl}>{savedClients.length > 0 ? L("Kayıtlı müşteriden seç", "Pick saved client") : L("Müşteri", "Client")}</label>
                <button type="button" onClick={() => setClientModal({ name: "", email: "", vatId: "", address: "", city: "", country: "" })}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                  <Plus className="h-3.5 w-3.5" /> {L("Yeni müşteri", "New client")}
                </button>
              </div>
              {savedClients.length > 0 && (
                <select className={field} defaultValue="" onChange={(e) => { pickClient(e.target.value); e.target.value = ""; }}>
                  <option value="" disabled>{L("Seç...", "Select...")}</option>
                  {savedClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

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

              {/* Alt başlık — belge başlığının altında küçük açıklama */}
              <div className="sm:col-span-2">
                <label className={lbl}>{L("Fatura alt başlığı (opsiyonel)", "Invoice subtitle (optional)")}</label>
                <input className={field} maxLength={120}
                  placeholder={L("Örn: Danışmanlık hizmetleri — Haziran 2026", "e.g. Engineering consultancy — June 2026")}
                  value={st.meta.subtitle || ""}
                  onChange={(e) => setSt((s) => ({ ...s, meta: { ...s.meta, subtitle: e.target.value } }))} />
              </div>

              {/* Müşteri notu + Ödeme şartları */}
              <div>
                <label className={lbl}>{L("Müşteri notu (opsiyonel)", "Note to client (optional)")}</label>
                <textarea className={field + " resize-none"} rows={2} maxLength={300}
                  placeholder={L("Örn: İşbirliğiniz için teşekkürler.", "e.g. Thank you for your business.")}
                  value={st.notes || ""}
                  onChange={(e) => setSt((s) => ({ ...s, notes: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>{L("Ödeme şartları (opsiyonel)", "Payment terms (optional)")}</label>
                <textarea className={field + " resize-none"} rows={2} maxLength={300}
                  placeholder={L("Örn: Ödeme 14 gün içinde yapılmalıdır.", "e.g. Payment due within 14 days.")}
                  value={st.terms || ""}
                  onChange={(e) => setSt((s) => ({ ...s, terms: e.target.value }))} />
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

      {/* Yeni müşteri ekleme modalı */}
      {clientModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => !savingClient && setClientModal(null)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-900">{L("Yeni Müşteri", "New Client")}</h3>
              <button onClick={() => setClientModal(null)} disabled={savingClient} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-slate-400">{L("Kaydedince bu faturaya eklenir ve sonraki faturalarında tekrar kullanabilirsin.", "Once saved, it's added to this invoice and reusable on future invoices.")}</p>
              <div>
                <label className={lbl}>{L("Şirket adı", "Company name")} *</label>
                <input className={field + " mt-1"} value={clientModal.name} onChange={(e) => setClientModal({ ...clientModal, name: e.target.value })} autoFocus />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>{L("E-posta", "Email")}</label>
                  <input className={field + " mt-1"} value={clientModal.email} onChange={(e) => setClientModal({ ...clientModal, email: e.target.value })} placeholder="client@example.com" />
                </div>
                <div>
                  <label className={lbl}>{L("Vergi / VAT No", "Tax / VAT No")}</label>
                  <input className={field + " mt-1"} value={clientModal.vatId} onChange={(e) => setClientModal({ ...clientModal, vatId: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={lbl}>{L("Adres", "Address")}</label>
                <input className={field + " mt-1"} value={clientModal.address} onChange={(e) => setClientModal({ ...clientModal, address: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>{L("Şehir", "City")}</label>
                  <input className={field + " mt-1"} value={clientModal.city} onChange={(e) => setClientModal({ ...clientModal, city: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>{L("Ülke", "Country")}</label>
                  <select className={field + " mt-1"} value={clientModal.country} onChange={(e) => setClientModal({ ...clientModal, country: e.target.value })}>
                    <option value="">{L("Seç...", "Select...")}</option>
                    {getCountries(lang).map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setClientModal(null)} disabled={savingClient}
                className="rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50">
                {L("İptal", "Cancel")}
              </button>
              <button onClick={saveNewClient} disabled={savingClient}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60">
                {savingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {savingClient ? L("Kaydediliyor...", "Saving...") : L("Kaydet", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-posta gönderme modalı */}
      {emailModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => busy !== "email" && setEmailModal(null)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-900">{L("Faturayı e-posta ile gönder", "Send invoice by email")}</h3>
              <button onClick={() => setEmailModal(null)} disabled={busy === "email"} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={lbl}>{L("Alıcı", "To")}</label>
                <input type="email" value={emailModal.to} onChange={(e) => setEmailModal({ ...emailModal, to: e.target.value })}
                  placeholder="client@example.com" className={field + " mt-1"} />
              </div>
              <div>
                <label className={lbl}>{L("Konu", "Subject")}</label>
                <input type="text" value={emailModal.subject} onChange={(e) => setEmailModal({ ...emailModal, subject: e.target.value })}
                  className={field + " mt-1"} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={lbl}>{L("Mesaj", "Message")}</label>
                  <button type="button" onClick={suggestEmail} disabled={aiBusy}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50">
                    {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {aiBusy ? L("Yazılıyor...", "Writing...") : L("AI ile öner", "Suggest with AI")}
                  </button>
                </div>
                <textarea value={emailModal.message} onChange={(e) => setEmailModal({ ...emailModal, message: e.target.value })}
                  rows={7} className={field + " mt-1 resize-none leading-relaxed"} />
              </div>
              {/* PDF ekli göstergesi */}
              <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5">
                <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-600">{L("PDF fatura otomatik olarak eklenecek", "PDF invoice will be attached automatically")}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setEmailModal(null)} disabled={busy === "email"}
                className="rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50">
                {L("İptal", "Cancel")}
              </button>
              <button onClick={doSendEmail} disabled={busy === "email"}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60">
                {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {busy === "email" ? L("Gönderiliyor...", "Sending...") : L("Gönder", "Send")}
              </button>
            </div>
          </div>
        </div>
      )}

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
