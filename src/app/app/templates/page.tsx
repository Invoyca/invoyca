"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader } from "@/components/ui";
import { renderInvoiceHTML } from "@/lib/templates/render";
import { thumbSchema } from "@/lib/templates/schema";
import { FAMILIES, THEMES, VARIANT_NAMES, FamilyId } from "@/lib/templates/data";
import { Check, Mail } from "lucide-react";
import { setDefaultTemplate, getDefaultTemplate } from "../data-actions";
import { useGuest } from "@/lib/guest-context";

const VD: Record<string, { TR: string; EN: string }> = {
  // Classic
  standard: { TR: "Geleneksel şirketler, danışmanlık, B2B — en güvenli seçim.", EN: "Traditional companies, consulting, B2B — the safe choice." },
  bordered: { TR: "Hukuk, mühendislik, mimarlık — resmi çerçeveli belge.", EN: "Legal, engineering, architecture — formal framed document." },
  letterhead: { TR: "Orta ölçekli şirketler, üreticiler — güçlü kurumsal başlık.", EN: "Mid-size companies, manufacturers — strong corporate header." },
  detailed: { TR: "Muhasebe odaklı, çok KDV oranlı, tevkifatlı detaylı faturalar.", EN: "Accounting-focused, multi-VAT, withholding." },
  centered: { TR: "Uluslararası B2B, AB sınır ötesi, reverse charge KDV.", EN: "International B2B, EU cross-border, reverse charge." },
  // Modern
  band: { TR: "Startup, SaaS, yazılım — hafif, modern, kart-tabanlı.", EN: "Startup, SaaS, software — light, modern, card-based." },
  sidebar: { TR: "Yaratıcı ajanslar, stüdyolar — dikey kenar çubuğu.", EN: "Creative agencies, studios — vertical sidebar." },
  split: { TR: "Danışman, mühendis, yazılımcı — saatlik/hizmet bazlı.", EN: "Consultants, engineers — hourly/service-based." },
  card: { TR: "Abonelik, retainer, hosting — dönem ve ödenecek tutar belirgin.", EN: "Subscriptions, retainers — billing period & amount due." },
  accent: { TR: "Freelancer, online hizmet — hızlı ödeme odaklı.", EN: "Freelancers, online services — payment-focused." },
  // Minimal
  line: { TR: "Freelancer, danışman, tasarımcı — en dengeli minimal.", EN: "Freelancers, consultants — most balanced minimal." },
  wide: { TR: "Butik stüdyo, premium danışman — bol boşluk, editoryal.", EN: "Boutique studios, premium — generous whitespace." },
  mono: { TR: "Küçük şirket, ürün satıcısı — tablo merkezli, pratik.", EN: "Small companies — table-centric, practical." },
  corner: { TR: "Danışman, küçük stüdyo — imza/onay alanı içeren.", EN: "Consultants, studios — with signature area." },
  serif: { TR: "Hukuk, finans — neredeyse renksiz, siyah-beyaz baskıya ideal.", EN: "Legal, finance — nearly color-free, print-ready." },
  // Compact
  dense: { TR: "Perakende, toptan, ürün satışı — çok satırlı faturalar.", EN: "Retail, wholesale — many line items." },
  grid: { TR: "Danışman, ajans, bakım ekibi — çok hizmet satırı.", EN: "Consultants, agencies — many service rows." },
  header: { TR: "Küçük dükkan, esnaf, yerel hizmet — basit ve anlaşılır.", EN: "Small shops, local services — simple and clear." },
  twin: { TR: "Stok bazlı işletme, yedek parça, depo — SKU/kod odaklı.", EN: "Inventory businesses — SKU/code focused." },
  receipt: { TR: "Büyük faturalar, çok kalemli dökümler — maksimum yoğunluk.", EN: "Large invoices — maximum density." },
  // Bold
  block: { TR: "Premium ajanslar, danışmanlar — güçlü hiyerarşi.", EN: "Premium agencies — strong hierarchy." },
  dark: { TR: "Freelancer, küçük işletme — ödenecek tutar ana odak.", EN: "Freelancers — amount due is the focus." },
  diagonal: { TR: "Ajanslar, güçlü marka kimliği olan modern şirketler.", EN: "Agencies, brand-forward companies." },
  stamp: { TR: "Modern işletmeler — temiz durum rozeti, büyük tutar.", EN: "Modern businesses — clean badge, large total." },
  frame: { TR: "Yönetim danışmanları, yüksek değerli B2B — ciddi, üst düzey.", EN: "Management consultants, high-value B2B — executive." },
};

export default function TemplatesPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);

  const [family, setFamily] = useState<FamilyId>("classic");
  const [variant, setVariant] = useState("standard");
  const [theme, setTheme] = useState("blue");
  const [docType, setDocType] = useState("invoice");
  const [qrMode, setQrMode] = useState("verify");
  const [taxMode, setTaxMode] = useState("normal");
  const [defaultVariant, setDefaultVariant] = useState("standard");
  const { requireAuth } = useGuest();
  const [savedMsg, setSavedMsg] = useState(false);

  // Kayıtlı varsayılan şablonu yükle (örn "classic-standard" → variant "standard")
  useEffect(() => {
    getDefaultTemplate().then((r) => {
      if (r.ok && r.template) {
        const parts = r.template.split("-");
        if (parts.length === 2) setDefaultVariant(parts[1]);
      }
    }).catch(() => {});
  }, []);

  const makeDefault = async () => {
    if (!requireAuth()) return;
    setDefaultVariant(variant);
    const res = await setDefaultTemplate(`${family}-${variant}`);
    if (res.ok) { setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2500); }
  };

  const themeObj = THEMES.find((t) => t.id === theme)!;
  const html = renderInvoiceHTML({ variant, theme, lang, docType, qrMode, taxMode });
  const pickFamily = (f: FamilyId) => { setFamily(f); setVariant(FAMILIES[f].variants[0]); };
  const isDef = defaultVariant === variant;

  return (
    <div>
      <PageHeader
        title={L("Fatura Şablonları", "Invoice Templates")}
        subtitle={L("Bir şablon seç, varsayılan yap. Her faturada bunu kullanırsın.", "Pick a template, make it default.")}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
            <Check className="h-3.5 w-3.5" /> {VARIANT_NAMES[defaultVariant]}
          </span>
        }
      />
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(Object.keys(FAMILIES) as FamilyId[]).map((f) => (
            <button key={f} onClick={() => pickFamily(f)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border ${family === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
              {FAMILIES[f].name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap text-xs bg-white border border-slate-200 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">{L("Renk:", "Color:")}</span>
            <div className="flex gap-1.5">
              {THEMES.map((t) => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`h-5 w-5 rounded-full border-2 transition-transform ${theme === t.id ? "scale-110 border-slate-900" : "border-transparent"}`}
                  style={{ background: t.color }} />
              ))}
            </div>
          </div>
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="invoice">{L("Fatura", "Invoice")}</option>
            <option value="proforma">Proforma</option>
            <option value="commercial">Commercial</option>
            <option value="quote">{L("Teklif", "Quote")}</option>
          </select>
          <ModeToggle label="QR" value={qrMode} onChange={setQrMode} options={[["verify", L("Doğrulama","Verify")],["pay",L("Ödeme","Pay")],["off",L("Kapalı","Off")]]} />
          <ModeToggle label={L("Vergi","Tax")} value={taxMode} onChange={setTaxMode} options={[["normal",L("Normal","Normal")],["reverse",L("Tevkifat","Reverse")],["exempt",L("Muaf","Exempt")]]} />
        </div>
      </div>
      <div className="grid md:grid-cols-[170px_1fr] lg:grid-cols-[180px_minmax(0,1fr)_200px] gap-4 lg:gap-6 items-start">
        <div className="space-y-2">
          {FAMILIES[family].variants.map((v) => (
            <button key={v} onClick={() => setVariant(v)}
              className={`w-full text-left rounded-xl border p-2.5 transition-all ${variant === v ? "border-blue-400 bg-blue-50/40 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="flex items-center gap-2.5">
                <div className="rounded border border-slate-200 overflow-hidden shrink-0 bg-white" style={{ width: 40, aspectRatio: "1/1.414" }}
                  dangerouslySetInnerHTML={{ __html: thumbSchema(v, themeObj.color, themeObj.light) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-900 truncate">{VARIANT_NAMES[v]}</p>
                  {defaultVariant === v ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium"><Check className="h-2.5 w-2.5" />{L("Varsayılan", "Default")}</span>
                  ) : (<span className="text-[10px] text-slate-400">{FAMILIES[family].name}</span>)}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden mx-auto" style={{ width: 540, maxWidth: "100%", height: 540 * 1.414 }}>
            <div style={{ width: 794, height: 794 * 1.414, transform: `scale(${540 / 794})`, transformOrigin: "top left" }} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
        <div className="space-y-3 md:col-span-2 lg:col-span-1 lg:sticky lg:top-24">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-1">{VARIANT_NAMES[variant]}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{L(VD[variant]?.TR || "", VD[variant]?.EN || "")}</p>
          </div>
          <button onClick={makeDefault}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold py-3 transition-colors"
            style={{ background: isDef ? "#059669" : themeObj.color }}>
            <Check className="h-4 w-4" /> {isDef ? L("Varsayılan ✓", "Default ✓") : L("Varsayılan yap", "Make default")}
          </button>
          {savedMsg && <p className="text-xs text-emerald-600 text-center">{L("Kaydedildi ✓", "Saved ✓")}</p>}
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {L("Yeni faturalar bu şablonla başlar. Fatura oluştururken değiştirebilirsin.", "New invoices start with this template.")}
          </p>

          {/* Destek / iletişim kartı */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Mail className="h-3.5 w-3.5" /></div>
              <h4 className="text-sm font-semibold text-slate-900">{L("Yardıma mı ihtiyacın var?", "Need help?")}</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-2">{L("Şablonlar, faturalama veya başka bir konuda sorun olursa bize yaz.", "Questions about templates, invoicing or anything else? Reach out.")}</p>
            <a href="mailto:contact@invoyca.com" className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700">
              <Mail className="h-3.5 w-3.5" /> contact@invoyca.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeToggle({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-slate-500">{label}:</span>
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
        {options.map(([val, lbl]) => (
          <button key={val} onClick={() => onChange(val)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${value === val ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}
