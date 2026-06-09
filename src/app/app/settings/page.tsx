"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import { LayoutTemplate, ArrowRight, Check, Loader2, User, Lock } from "lucide-react";
import { getAccountInfo, updateUserName, updateProfile, updatePassword, updateCompany } from "../data-actions";

export default function SettingsPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const [tab, setTab] = useState("account");
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    getAccountInfo().then((res) => { if (res.ok) setInfo(res); });
  }, []);

  const tabs = [
    { id: "account", label: L("Hesap", "Account") },
    { id: "company", label: L("Şirket Profili", "Company") },
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

      {tab === "subscription" && (
        <Card className="p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold mb-3">
            <Check className="h-3.5 w-3.5" /> {L("Sınırsız Erişim", "Unlimited Access")}
          </div>
          <p className="font-medium text-slate-900">{L("2026 boyunca ücretsiz ve sınırsız", "Free & unlimited throughout 2026")}</p>
          <p className="text-sm text-slate-500 mt-1">{L("Tüm özellikler açık. Abonelik planları 2027'de başlayacak; önceden bilgilendirileceksin.", "All features unlocked. Subscription plans start in 2027; you'll be notified in advance.")}</p>
        </Card>
      )}
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

function CompanyTab({ L, info }: { L: (tr: string, en?: string) => string; info: any }) {
  const [form, setForm] = useState({ name: "", email: "", address: "", city: "", country: "", taxId: "", vatId: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (info?.company) setForm({
      name: info.company.name || "", email: info.company.email || "", address: info.company.address || "",
      city: info.company.city || "", country: info.company.country || "", taxId: info.company.taxId || "", vatId: info.company.vatId || "",
    });
  }, [info]);

  const field = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";
  const lbl = "text-xs font-medium text-slate-500";

  const save = async () => {
    setSaving(true); setMsg("");
    const res = await updateCompany(form);
    setSaving(false);
    setMsg(res.ok ? L("Kaydedildi ✓", "Saved ✓") : (res.error || "Hata"));
  };

  const fields: [string, keyof typeof form][] = [
    [L("Şirket Adı", "Company Name"), "name"],
    [L("E-posta", "Email"), "email"],
    [L("Adres", "Address"), "address"],
    [L("Şehir", "City"), "city"],
    [L("Ülke", "Country"), "country"],
    [L("Vergi No", "Tax ID"), "taxId"],
    [L("VAT ID", "VAT ID"), "vatId"],
  ];

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
