"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader } from "@/components/ui";
import { renderInvoiceHTML } from "@/lib/templates/render";
import { thumbSchema } from "@/lib/templates/schema";
import { FAMILIES, THEMES, VARIANT_NAMES, FamilyId } from "@/lib/templates/data";
import { Check } from "lucide-react";
import { setDefaultTemplate, getDefaultTemplate } from "../data-actions";
import { useGuest } from "@/lib/guest-context";

const VD: Record<string, { TR: string; EN: string }> = {
  standard: { TR: "Dengeli ve tanıdık. Üstte logo, klasik tablo, sağda toplamlar.", EN: "Balanced and familiar." },
  bordered: { TR: "İnce çerçeveli kurumsal görünüm.", EN: "Thin-bordered corporate look." },
  centered: { TR: "Ortalanmış başlık, simetrik resmi düzen.", EN: "Centered, symmetric formal layout." },
  letterhead: { TR: "Antetli kağıt hissi, renkli şerit ve footer.", EN: "Letterhead feel." },
  detailed: { TR: "Proje/referans no ve ek alanlar; karmaşık işler için.", EN: "Project ref and extra fields." },
  band: { TR: "Geniş gradient üst bant, büyük başlık. Çağdaş.", EN: "Wide gradient band, large heading." },
  sidebar: { TR: "Sol renkli dikey şerit, modern ve dengeli.", EN: "Left colored strip, modern." },
  split: { TR: "Üst renkli blok, gölgeli kartlar; güçlü etki.", EN: "Top color block, shadowed cards." },
  card: { TR: "Yuvarlak köşeli kartlar, dijital ürün hissi.", EN: "Rounded cards, digital feel." },
  accent: { TR: "Beyaz zemin, ince renkli vurgu çizgileri.", EN: "White canvas, accent lines." },
  mono: { TR: "Neredeyse tek renk, ultra sade.", EN: "Almost single-color, ultra clean." },
  wide: { TR: "Geniş harf aralıkları, bol boşluk; editöryal.", EN: "Wide spacing, editorial." },
  line: { TR: "Yalnızca ince çizgiler, kutu yok; en hafif.", EN: "Only thin lines, lightest." },
  corner: { TR: "Bilgiler köşelerde, merkez ferah.", EN: "Info in corners, airy center." },
  serif: { TR: "Zarif serif başlık, dergi inceliği.", EN: "Elegant serif heading." },
  dense: { TR: "En sıkı, çok kalemli faturalar için.", EN: "Tightest, for many line items." },
  grid: { TR: "Zebra çizgili ızgara tablo; okunaklı.", EN: "Zebra grid table; legible." },
  header: { TR: "Üstte renkli özet bar, toplam öne çıkar.", EN: "Colored summary bar." },
  twin: { TR: "Gönderen/alıcı tek satırda dar; tabloya yer.", EN: "Sender/recipient on one row." },
  receipt: { TR: "Fiş/makbuz hissi, dar ve uzun.", EN: "Receipt feel, narrow and tall." },
  block: { TR: "Kocaman renkli blok, dev başlık; güçlü izlenim.", EN: "Huge color block, giant heading." },
  dark: { TR: "Koyu tema, renkli vurgular; premium.", EN: "Dark theme, color accents." },
  diagonal: { TR: "Açılı renkli kesim; dinamik, yaratıcı.", EN: "Angled color cut; dynamic." },
  stamp: { TR: "Dev renkli toplam rozeti; tutar öne çıkar.", EN: "Giant total badge." },
  frame: { TR: "Kalın renkli çerçeve; poster gibi.", EN: "Thick color frame." },
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
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{L("Renk:", "Color:")}</span>
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
      <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr_210px] gap-4 lg:gap-5 items-start">
        <div className="space-y-2">
          {FAMILIES[family].variants.map((v) => (
            <button key={v} onClick={() => setVariant(v)}
              className={`w-full text-left rounded-xl border p-2.5 transition-all ${variant === v ? "border-blue-400 bg-blue-50/40 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="flex items-center gap-2.5">
                <div className="rounded border border-slate-200 overflow-hidden shrink-0 bg-white" style={{ width: 44, aspectRatio: "1/1.414" }}
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
          <div className="w-full max-w-[560px] bg-white rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: "1/1.414" }}
            dangerouslySetInnerHTML={{ __html: html }} />
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
