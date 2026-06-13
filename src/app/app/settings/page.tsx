"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { getCountries } from "@/lib/countries";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import { LayoutTemplate, ArrowRight, Check, Loader2, User, Lock, Mail } from "lucide-react";
import { getAccountInfo, updateUserName, updateProfile, updatePassword, updateCompany, listBankAccounts, saveBankAccount, deleteBankAccount } from "../data-actions";

export default function SettingsPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const [tab, setTab] = useState("account");
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    getAccountInfo().then((res) => { if (res.ok) setInfo(res); });
    // URL'de ?tab=company gibi bir parametre varsa o sekmeyi aç (dashboard yönlendirmesi için)
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && ["account", "company", "bank", "subscription"].includes(t)) setTab(t);
  }, []);

  const tabs = [
    { id: "account", label: L("Hesap", "Account") },
    { id: "company", label: L("Şirket Profili", "Company") },
    { id: "bank", label: L("Banka & Ödeme", "Bank & Payment") },
    { id: "subscription", label: L("Abonelik", "Subscription") },
  ];

  return (
    <div className="max-w-4xl">
      <PageHeader title={L("Ayarlar", "Settings")} subtitle={L("Hesap ve şirket ayarların.", "Account and company settings.")} />
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit overflow-x-auto">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${tab === tb.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "account" && <AccountTab L={L} info={info} />}
      {tab === "company" && <CompanyTab L={L} info={info} />}
      {tab === "bank" && <BankTab L={L} info={info} />}

      {tab === "subscription" && (
        <Card className="p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold mb-3">
            <Check className="h-3.5 w-3.5" /> {L("Sınırsız Erişim", "Unlimited Access")}
          </div>
          <p className="font-medium text-slate-900">{L("2026 boyunca ücretsiz ve sınırsız", "Free & unlimited throughout 2026")}</p>
          <p className="text-sm text-slate-500 mt-1">{L("Tüm özellikler açık. Abonelik planları 2027'de başlayacak; önceden bilgilendirileceksin.", "All features unlocked. Subscription plans start in 2027; you'll be notified in advance.")}</p>
        </Card>
      )}

      {/* Destek / iletişim — tüm sekmelerde görünür */}
      <Card className="p-6 mt-4">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Mail className="h-5 w-5" /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{L("Destek & İletişim", "Support & Contact")}</h3>
            <p className="text-sm text-slate-500 mt-0.5 mb-3">{L("Bir sorun, soru veya öneri için bize her zaman yazabilirsin. En kısa sürede dönüş yaparız.", "Reach out anytime with a problem, question or suggestion. We'll get back to you soon.")}</p>
            <a href="mailto:contact@invoyca.com" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
              <Mail className="h-4 w-4" /> contact@invoyca.com
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AccountTab({ L, info }: { L: (tr: string, en?: string) => string; info: any }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    if (info?.name) setName(info.name);
    if (info?.phone) setPhone(info.phone);
    if (info?.title) setTitle(info.title);
  }, [info]);

  const field = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const lbl = "text-xs font-medium text-slate-500";

  const saveName = async () => {
    if (!name.trim()) { setNameMsg(L("İsim boş olamaz.", "Name required.")); return; }
    setSavingName(true); setNameMsg("");
    const res = await updateProfile({ name, phone, title });
    setSavingName(false);
    setNameMsg(res.ok ? L("Kaydedildi ✓", "Saved ✓") : (res.error || "Hata"));
  };

  const savePw = async () => {
    setPwMsg("");
    if (pw.length < 6) { setPwMsg(L("Şifre en az 6 karakter olmalı.", "Min 6 characters.")); return; }
    if (pw !== pw2) { setPwMsg(L("Şifreler eşleşmiyor.", "Passwords don't match.")); return; }
    setSavingPw(true);
    const res = await updatePassword(pw);
    setSavingPw(false);
    if (res.ok) { setPwMsg(L("Şifre değiştirildi ✓", "Password changed ✓")); setPw(""); setPw2(""); }
    else setPwMsg(res.error || "Hata");
  };

  return (
    <div className="space-y-4">
      {/* Profil */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold">{L("Profil Bilgileri", "Profile")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>{L("Ad Soyad", "Full Name")} *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("Adınız Soyadınız", "Your name")} className={field} />
          </div>
          <div>
            <label className={lbl}>{L("E-posta", "Email")}</label>
            <input value={info?.email || ""} disabled className={field + " bg-slate-50 text-slate-400"} />
            <p className="text-xs text-slate-400 mt-1">{L("E-posta değiştirilemez.", "Email cannot be changed.")}</p>
          </div>
          <div>
            <label className={lbl}>{L("Telefon", "Phone")}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" className={field} />
          </div>
          <div>
            <label className={lbl}>{L("Ünvan / Görev", "Title / Role")}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L("ör. Kurucu, Muhasebeci", "e.g. Founder, Accountant")} className={field} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={saveName} disabled={savingName} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60">
            {savingName && <Loader2 className="h-4 w-4 animate-spin" />}{L("Kaydet", "Save")}
          </button>
          {nameMsg && <span className="text-sm text-emerald-600">{nameMsg}</span>}
        </div>
      </Card>

      {/* Şifre */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold">{L("Şifre Değiştir", "Change Password")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>{L("Yeni Şifre", "New Password")}</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" className={field} />
          </div>
          <div>
            <label className={lbl}>{L("Yeni Şifre (Tekrar)", "Confirm Password")}</label>
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" className={field} />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={savePw} disabled={savingPw} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60">
            {savingPw && <Loader2 className="h-4 w-4 animate-spin" />}{L("Şifreyi Güncelle", "Update Password")}
          </button>
          {pwMsg && <span className={`text-sm ${pwMsg.includes("✓") ? "text-emerald-600" : "text-rose-600"}`}>{pwMsg}</span>}
        </div>
      </Card>
    </div>
  );
}

function BankTab({ L, info }: { L: (tr: string, en?: string) => string; info: any }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null); // {id?, label, bankName, iban, swift, currency, isDefault}
  const [msg, setMsg] = useState("");
  const [qrPay, setQrPay] = useState("");
  const [qrVerify, setQrVerify] = useState("");
  const [savingQr, setSavingQr] = useState(false);

  const field = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const lbl = "text-xs font-medium text-slate-500";

  const reload = () => listBankAccounts().then((r) => { if (r.ok) setAccounts(r.accounts); });
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (info?.company) { setQrPay(info.company.qrImage || ""); setQrVerify(info.company.qrVerify || ""); }
  }, [info]);

  const blank = { label: "", bankName: "", iban: "", swift: "", currency: "EUR", isDefault: false };

  const saveAcc = async () => {
    if (!editing) return;
    const res = await saveBankAccount(editing);
    if (res.ok) { setEditing(null); reload(); setMsg(L("Hesap kaydedildi ✓", "Account saved ✓")); }
    else setMsg(res.error || "Hata");
  };
  const delAcc = async (id: string) => {
    const res = await deleteBankAccount(id);
    if (res.ok) reload();
  };
  const saveQrs = async () => {
    setSavingQr(true); setMsg("");
    const res = await updateCompany({ qrImage: qrPay, qrVerify });
    setSavingQr(false);
    setMsg(res.ok ? L("QR kodları kaydedildi ✓", "QR codes saved ✓") : (res.error || "Hata"));
  };

  const readQr = (file: File | undefined, setter: (v: string) => void) => {
    if (!file) return;
    if (file.size > 500 * 1024) { setMsg(L("Resim çok büyük (max 500 KB).", "Image too large (max 500 KB).")); return; }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };

  const QrUploader = ({ value, setter, title, hint }: { value: string; setter: (v: string) => void; title: string; hint: string }) => (
    <div>
      <label className={lbl}>{title}</label>
      <p className="text-xs text-slate-400 mt-0.5 mb-2">{hint}</p>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="QR" className="h-20 w-20 rounded-lg border border-slate-200 object-contain bg-white p-1" />
            <button onClick={() => setter("")} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs hover:bg-rose-600">✕</button>
          </div>
        ) : (
          <div className="h-20 w-20 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-xs font-semibold">QR</div>
        )}
        <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50">
          {L("Resim Seç", "Choose Image")}
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => readQr(e.target.files?.[0], setter)} />
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Banka hesapları */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">{L("Banka Hesapları", "Bank Accounts")}</h2>
          {!editing && <button onClick={() => setEditing({ ...blank })} className="text-sm font-medium text-blue-600 hover:underline">+ {L("Hesap Ekle", "Add Account")}</button>}
        </div>
        <p className="text-sm text-slate-500 mb-4">{L("Birden fazla IBAN ekleyebilirsin. Fatura oluştururken hangisini kullanacağını seçersin.", "Add multiple IBANs. You choose which one to use when creating an invoice.")}</p>

        {/* Liste */}
        {accounts.length === 0 && !editing && (
          <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">{L("Henüz banka hesabı eklenmedi.", "No bank accounts yet.")}</p>
        )}
        <div className="space-y-2">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{a.label}</span>
                  {a.isDefault && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{L("Varsayılan", "Default")}</span>}
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{a.currency}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{a.iban}{a.bankName ? ` · ${a.bankName}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setEditing({ id: a.id, label: a.label, bankName: a.bankName || "", iban: a.iban, swift: a.swift || "", currency: a.currency, isDefault: a.isDefault })} className="text-xs text-slate-600 hover:text-slate-900">{L("Düzenle", "Edit")}</button>
                <button onClick={() => delAcc(a.id)} className="text-xs text-rose-500 hover:text-rose-700">{L("Sil", "Delete")}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Ekleme/düzenleme formu */}
        {editing && (
          <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50/30 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className={lbl}>{L("Etiket", "Label")}</label><input className={field} placeholder={L("Ana Hesap", "Main Account")} value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} /></div>
              <div><label className={lbl}>{L("Banka Adı", "Bank Name")}</label><input className={field} value={editing.bankName} onChange={(e) => setEditing({ ...editing, bankName: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={lbl}>IBAN</label><input className={field} value={editing.iban} onChange={(e) => setEditing({ ...editing, iban: e.target.value })} /></div>
              <div><label className={lbl}>SWIFT/BIC</label><input className={field} value={editing.swift} onChange={(e) => setEditing({ ...editing, swift: e.target.value })} /></div>
              <div><label className={lbl}>{L("Para Birimi", "Currency")}</label>
                <select className={field} value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                  <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} />
              {L("Varsayılan hesap yap", "Set as default")}
            </label>
            <div className="flex items-center gap-2">
              <button onClick={saveAcc} className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">{L("Kaydet", "Save")}</button>
              <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 bg-white text-sm font-medium px-4 py-2 hover:bg-slate-50">{L("İptal", "Cancel")}</button>
            </div>
          </div>
        )}
      </Card>

      {/* QR kodları: ödeme + doğrulama */}
      <Card className="p-6">
        <h2 className="font-semibold mb-2">{L("QR Kodları", "QR Codes")}</h2>
        <p className="text-sm text-slate-500 mb-4">{L("Kendi QR kodlarını yükle. Faturalarında otomatik görünür; her faturada ayrıca değiştirebilirsin. PNG/JPG, max 500 KB.", "Upload your own QR codes. They appear on your invoices automatically; you can also change them per invoice. PNG/JPG, max 500 KB.")}</p>
        <div className="grid sm:grid-cols-2 gap-6">
          <QrUploader value={qrPay} setter={setQrPay} title={L("Ödeme QR'ı", "Payment QR")} hint={L("Ödeme bağlantısı/IBAN QR'ı.", "Payment link / IBAN QR.")} />
          <QrUploader value={qrVerify} setter={setQrVerify} title={L("Doğrulama QR'ı (GİB/e-Arşiv)", "Verification QR (e-archive)")} hint={L("Resmi doğrulama/e-Arşiv QR'ı.", "Official verification / e-archive QR.")} />
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button onClick={saveQrs} disabled={savingQr} className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60">{savingQr ? L("Kaydediliyor...", "Saving...") : L("QR Kodlarını Kaydet", "Save QR Codes")}</button>
          {msg && <span className="text-sm text-slate-500">{msg}</span>}
        </div>
      </Card>
    </div>
  );
}

function CompanyTab({ L, info }: { L: (tr: string, en?: string) => string; info: any }) {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: "", email: "", address: "", city: "", country: "", taxId: "", vatId: "", defaultLanguage: "TR", defaultDueDays: 15 });
  const [logo, setLogo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (info?.company) {
      setForm({
        name: info.company.name || "", email: info.company.email || "", address: info.company.address || "",
        city: info.company.city || "", country: info.company.country || "", taxId: info.company.taxId || "", vatId: info.company.vatId || "",
        defaultLanguage: info.company.defaultLanguage || "TR",
        defaultDueDays: typeof info.company.defaultDueDays === "number" ? info.company.defaultDueDays : 15,
      });
      setLogo(info.company.logoUrl || "");
    }
  }, [info]);

  const field = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const lbl = "text-xs font-medium text-slate-500";

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      const res = await updateCompany({ ...form, logoUrl: logo, defaultDueDays: form.defaultDueDays });
      setMsg(res.ok ? L("Kaydedildi ✓", "Saved ✓") : (res.error || L("Kaydedilemedi.", "Could not save.")));
    } catch (e: any) {
      // Sunucu hata atarsa (ör. çok büyük logo, ağ hatası) yine de loading dursun ve kullanıcı sebebi görsün
      setMsg(L("Kaydedilemedi. Logo çok büyük olabilir veya bağlantı koptu.", "Could not save. The logo may be too large or the connection dropped."));
    } finally {
      setSaving(false);
    }
  };

  // Logo yükle (base64). 2 MB sınırı, sadece görsel.
  const onLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setMsg(L("Sadece PNG, JPG veya WEBP.", "Only PNG, JPG or WEBP.")); return; }
    if (file.size > 2 * 1024 * 1024) { setMsg(L("Logo çok büyük (max 2 MB).", "Logo too large (max 2 MB).")); return; }
    setMsg(L("Logo işleniyor...", "Processing logo..."));
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Logoyu makul boyuta küçült (en fazla 400px) — veritabanı/ağ yükünü azaltır,
        // fatura logosu için 400px fazlasıyla yeterli. Böylece kaydetme takılmaz.
        const maxDim = 400;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setLogo(String(reader.result)); setMsg(""); return; }
        ctx.drawImage(img, 0, 0, width, height);
        // PNG şeffaflığı korusun; JPEG/WEBP ise sıkıştır
        const isPng = /image\/png/.test(file.type);
        const out = isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
        setLogo(out);
        setMsg("");
      };
      img.onerror = () => { setLogo(String(reader.result)); setMsg(""); };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const fields: [string, keyof typeof form][] = [
    [L("Şirket Adı", "Company Name"), "name"],
    [L("E-posta", "Email"), "email"],
    [L("Adres", "Address"), "address"],
    [L("Şehir", "City"), "city"],
    [L("Vergi No", "Tax ID"), "taxId"],
    [L("VAT ID", "VAT ID"), "vatId"],
  ];
  const countries = getCountries(lang);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="font-semibold mb-4">{L("Şirket Bilgileri", "Company Info")}</h2>
        <p className="text-sm text-slate-500 mb-4">{L("Bu bilgiler faturalarında görünür.", "This info appears on your invoices.")}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map(([label, key]) => (
            <div key={key}>
              <label className={lbl}>{label}</label>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={field} />
            </div>
          ))}
          <div>
            <label className={lbl}>{L("Ülke", "Country")}</label>
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={field}>
              <option value="">{L("Seç...", "Select...")}</option>
              {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className={lbl}>{L("Logo", "Logo")}</label>
          <p className="text-xs text-slate-400 mt-0.5 mb-2">{L("Faturalarının üst köşesinde görünür. PNG/JPG, max 2 MB.", "Appears on the top corner of your invoices. PNG/JPG, max 2 MB.")}</p>
          <div className="flex items-center gap-4">
            {logo ? (
              <img src={logo} alt="logo" className="h-14 w-14 rounded-lg border border-slate-200 object-contain bg-white p-1" />
            ) : (
              <div className="h-14 w-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-300 text-xs">LOGO</div>
            )}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium px-3.5 py-2 hover:bg-slate-50">
                {logo ? L("Değiştir", "Change") : L("Logo Yükle", "Upload Logo")}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onLogoFile} />
              </label>
              {logo && (
                <button onClick={() => setLogo("")} className="text-sm text-slate-400 hover:text-rose-600">{L("Kaldır", "Remove")}</button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className={lbl}>{L("Varsayılan Fatura Dili", "Default Invoice Language")}</label>
          <p className="text-xs text-slate-400 mt-0.5 mb-2">{L("Yeni faturalar bu dilde oluşturulur. Fatura ekranında değiştirebilirsin.", "New invoices are created in this language. You can change it on the invoice screen.")}</p>
          <select value={form.defaultLanguage} onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })} className={field + " sm:max-w-xs"}>
            <option value="TR">Türkçe</option>
            <option value="EN">English</option>
            <option value="DE">Deutsch</option>
            <option value="NL">Nederlands</option>
            <option value="FR">Français</option>
            <option value="ES">Español</option>
            <option value="IT">Italiano</option>
          </select>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className={lbl}>{L("Varsayılan Ödeme Vadesi", "Default Payment Due")}</label>
          <p className="text-xs text-slate-400 mt-0.5 mb-2">{L("Yeni faturalarda vade tarihi otomatik bu kadar gün sonrası gelir. Her faturada değiştirebilirsin.", "New invoices get a due date this many days ahead automatically. You can change it per invoice.")}</p>
          <select value={form.defaultDueDays} onChange={(e) => setForm({ ...form, defaultDueDays: Number(e.target.value) })} className={field + " sm:max-w-xs"}>
            <option value={0}>{L("Vade yok", "No due date")}</option>
            <option value={7}>{L("7 gün", "7 days")}</option>
            <option value={14}>{L("14 gün", "14 days")}</option>
            <option value={15}>{L("15 gün", "15 days")}</option>
            <option value={30}>{L("30 gün", "30 days")}</option>
            <option value={45}>{L("45 gün", "45 days")}</option>
            <option value={60}>{L("60 gün", "60 days")}</option>
          </select>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}{L("Kaydet", "Save")}
          </button>
          {msg && <span className="text-sm text-emerald-600">{msg}</span>}
        </div>
      </Card>

      <Link href="/app/templates" className="block">
        <Card className="p-5 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><LayoutTemplate className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="font-medium">{L("Varsayılan Şablon", "Default Template")}</p>
              <p className="text-sm text-slate-500">{L("Classic Standard — değiştirmek için tıkla", "Classic Standard — click to change")}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </div>
        </Card>
      </Link>
    </div>
  );
}
