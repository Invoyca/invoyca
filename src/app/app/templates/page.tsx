"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { renderInvoiceHTML } from "@/lib/templates/render";
import { thumbSchema } from "@/lib/templates/schema";
import { FAMILIES, THEMES, VARIANT_NAMES, FamilyId } from "@/lib/templates/data";
import { Check, ZoomIn, ZoomOut, Maximize2, Scan, X } from "lucide-react";
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

const A4_W = 794;
const A4_H = 794 * 1.414;
const ZOOM_STEPS = [0.5, 0.65, 0.75, 0.85, 1, 1.25];

export default function TemplatesPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  const { requireAuth } = useGuest();

  const [family, setFamily] = useState<FamilyId>("classic");
  const [variant, setVariant] = useState("standard");
  const [theme, setTheme] = useState("blue");
  const [docType, setDocType] = useState("invoice");
  const [qrMode, setQrMode] = useState("verify");
  const [taxMode, setTaxMode] = useState("normal");
  const [defaultVariant, setDefaultVariant] = useState("standard");
  const [defaultFamily, setDefaultFamily] = useState<string>("classic");
  const [savedMsg, setSavedMsg] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [mobileTab, setMobileTab] = useState<"template" | "customize" | "preview">("template");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    getDefaultTemplate().then((r) => {
      if (r.ok && r.template) {
        const parts = r.template.split("-");
        if (parts.length === 2) { setDefaultFamily(parts[0]); setDefaultVariant(parts[1]); }
      }
    }).catch(() => {});
  }, []);

  const makeDefault = async () => {
    if (!requireAuth()) return;
    setDefaultVariant(variant); setDefaultFamily(family); setDirty(false);
    const res = await setDefaultTemplate(`${family}-${variant}`);
    if (res.ok) { setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2500); }
  };

  const themeObj = THEMES.find((t) => t.id === theme)!;
  const html = renderInvoiceHTML({ variant, theme, lang, docType, qrMode, taxMode });
  const pickFamily = (f: FamilyId) => { setFamily(f); setVariant(FAMILIES[f].variants[0]); setDirty(true); };
  const pickVariant = (v: string) => { setVariant(v); setDirty(true); };
  const isDef = defaultVariant === variant && defaultFamily === family;
  const onCustomChange = (fn: () => void) => { fn(); setDirty(true); };

  const docLabel = docType === "invoice" ? L("Fatura", "Invoice") : docType === "proforma" ? "Proforma" : docType === "commercial" ? "Commercial" : L("Teklif", "Quote");
  const qrLabel = qrMode === "verify" ? L("Doğrulama", "Verify") : qrMode === "pay" ? L("Ödeme", "Pay") : L("Kapalı", "Off");
  const taxLabel = taxMode === "normal" ? L("Normal", "Normal") : taxMode === "reverse" ? L("Tevkifat", "Reverse") : L("Muaf", "Exempt");
  const summary = VARIANT_NAMES[variant] + " · " + docLabel + " · QR " + qrLabel + " · " + taxLabel;

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <header className="shrink-0 flex items-center justify-between gap-4 px-5 lg:px-6 h-[68px] border-b border-slate-200 bg-white">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-slate-900 truncate">{L("Fatura Şablonları", "Invoice Templates")}</h1>
          <p className="text-xs text-slate-500 truncate hidden sm:block">{L("Şablonunu seç, renklerini özelleştir ve faturalarında kullan.", "Pick a template, customize colors, use it on your invoices.")}</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
          <Check className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{L("Varsayılan:", "Default:")} </span>{VARIANT_NAMES[defaultVariant]}
        </span>
      </header>

      <div className="lg:hidden shrink-0 flex border-b border-slate-200 bg-white">
        {([["template", L("Şablon", "Template")], ["customize", L("Özelleştir", "Customize")], ["preview", L("Önizleme", "Preview")]] as const).map(([key, lbl]) => (
          <button key={key} onClick={() => setMobileTab(key)}
            className={"flex-1 py-2.5 text-sm font-medium transition-colors " + (mobileTab === key ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500")}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[232px_minmax(0,1fr)_264px]">
        <aside className={(mobileTab === "template" ? "flex" : "hidden") + " lg:flex flex-col min-h-0 border-r border-slate-200 bg-white"}>
          <TemplateRail family={family} variant={variant} defaultVariant={defaultVariant} defaultFamily={defaultFamily}
            themeObj={themeObj} L={L} onPickFamily={pickFamily} onPickVariant={pickVariant} />
        </aside>

        <PreviewWorkspace html={html} L={L}
          className={(mobileTab === "preview" ? "flex" : "hidden") + " lg:flex"}
          onFullscreen={() => setFullscreen(true)} />

        <aside className={(mobileTab === "customize" ? "flex" : "hidden") + " lg:flex flex-col min-h-0 border-l border-slate-200 bg-white"}>
          <CustomizationRail theme={theme} setTheme={(v) => onCustomChange(() => setTheme(v))}
            docType={docType} setDocType={(v) => onCustomChange(() => setDocType(v))}
            qrMode={qrMode} setQrMode={(v) => onCustomChange(() => setQrMode(v))}
            taxMode={taxMode} setTaxMode={(v) => onCustomChange(() => setTaxMode(v))}
            variant={variant} isDef={isDef} L={L} onMakeDefault={makeDefault} savedMsg={savedMsg} />
        </aside>
      </div>

      <footer className="shrink-0 flex items-center justify-between gap-3 px-5 lg:px-6 h-[64px] border-t border-slate-200 bg-white">
        <div className="min-w-0 hidden sm:block">
          <p className="text-sm font-medium text-slate-900 truncate">{summary}</p>
          {dirty && !isDef && <p className="text-xs text-amber-600">{L("Kaydedilmemiş değişiklikler", "Unsaved changes")}</p>}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setFullscreen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Maximize2 className="h-4 w-4" /> <span className="hidden sm:inline">{L("Tam Ekran", "Full Screen")}</span>
          </button>
          {isDef ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-semibold">
              <Check className="h-4 w-4" /> {L("Varsayılan", "Default")}
            </span>
          ) : (
            <button onClick={makeDefault}
              className="inline-flex items-center gap-1.5 rounded-xl text-white px-4 py-2 text-sm font-semibold transition-colors"
              style={{ background: themeObj.color }}>
              <Check className="h-4 w-4" /> {L("Bu Şablonu Kullan", "Use This Template")}
            </button>
          )}
        </div>
      </footer>

      {fullscreen && <FullscreenPreview html={html} L={L} onClose={() => setFullscreen(false)} />}
    </div>
  );
}

function TemplateRail({ family, variant, defaultVariant, defaultFamily, themeObj, L, onPickFamily, onPickVariant }: {
  family: FamilyId; variant: string; defaultVariant: string; defaultFamily: string;
  themeObj: { color: string; light: string }; L: (tr: string, en?: string) => string;
  onPickFamily: (f: FamilyId) => void; onPickVariant: (v: string) => void;
}) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="shrink-0 p-3 border-b border-slate-100">
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(FAMILIES) as FamilyId[]).map((f) => (
            <button key={f} onClick={() => onPickFamily(f)}
              className={"rounded-lg px-2 py-2 text-xs font-semibold transition-all border " + (family === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
              {FAMILIES[f].name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {FAMILIES[family].variants.map((v) => {
          const sel = variant === v;
          const def = defaultVariant === v && defaultFamily === family;
          return (
            <button key={v} onClick={() => onPickVariant(v)}
              className={"w-full text-left rounded-xl border p-2.5 transition-all " + (sel ? "border-blue-400 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300")}>
              <div className="flex items-center gap-2.5">
                <div className="rounded border border-slate-200 overflow-hidden shrink-0 bg-white" style={{ width: 56, aspectRatio: "1/1.414" }}
                  dangerouslySetInnerHTML={{ __html: thumbSchema(v, themeObj.color, themeObj.light) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{VARIANT_NAMES[v]}</p>
                  <p className="text-[10px] text-slate-400 mb-1">{FAMILIES[family].name}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {sel && <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium"><Check className="h-2.5 w-2.5" />{L("Seçili", "Selected")}</span>}
                    {def && <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-emerald-600 px-1 py-0.5 text-[9px] font-medium">{L("Varsayılan", "Default")}</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewWorkspace({ html, L, className, onFullscreen }: {
  html: string; L: (tr: string, en?: string) => string; className?: string; onFullscreen: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | "fit-width" | "fit-page">("fit-width");
  const [fitScale, setFitScale] = useState(0.7);

  const recompute = useCallback(() => {
    const el = wrapRef.current; if (!el) return;
    const availW = el.clientWidth - 64;
    const availH = el.clientHeight - 64;
    if (zoom === "fit-width") setFitScale(Math.min(Math.max(availW / A4_W, 0.4), 1.5));
    else if (zoom === "fit-page") setFitScale(Math.min(availW / A4_W, availH / A4_H));
  }, [zoom]);

  useEffect(() => {
    recompute();
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(recompute); ro.observe(el);
    return () => ro.disconnect();
  }, [recompute]);

  const scale = typeof zoom === "number" ? zoom : fitScale;
  const pct = Math.round(scale * 100);

  const stepZoom = (dir: 1 | -1) => {
    const cur = typeof zoom === "number" ? zoom : fitScale;
    let idx = ZOOM_STEPS.findIndex((s) => s >= cur - 0.001);
    if (idx === -1) idx = ZOOM_STEPS.length - 1;
    const next = Math.min(Math.max(idx + dir, 0), ZOOM_STEPS.length - 1);
    setZoom(ZOOM_STEPS[next]);
  };

  return (
    <section ref={wrapRef} className={"relative flex-col min-h-0 overflow-auto " + (className || "")}
      style={{ background: "#EEF2F7" }}>
      <div className="sticky top-3 z-10 flex justify-end pr-3 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white shadow-md px-1.5 py-1">
          <button onClick={() => stepZoom(-1)} aria-label={L("Uzaklaştır", "Zoom out")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><ZoomOut className="h-4 w-4" /></button>
          <span className="text-xs font-medium text-slate-700 w-10 text-center tabular-nums">{pct}%</span>
          <button onClick={() => stepZoom(1)} aria-label={L("Yakınlaştır", "Zoom in")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><ZoomIn className="h-4 w-4" /></button>
          <div className="w-px h-5 bg-slate-200 mx-0.5" />
          <button onClick={() => setZoom("fit-width")} className={"px-2 py-1 rounded-lg text-xs font-medium " + (zoom === "fit-width" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-100")}>{L("Genişlik", "Width")}</button>
          <button onClick={() => setZoom("fit-page")} aria-label={L("Sayfaya sığdır", "Fit page")} className={"p-1.5 rounded-lg " + (zoom === "fit-page" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-100")}><Scan className="h-4 w-4" /></button>
          <button onClick={onFullscreen} aria-label={L("Tam ekran", "Full screen")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><Maximize2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex justify-center px-8 pb-10" style={{ marginTop: -36 }}>
        <div className="bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden"
          style={{ width: A4_W * scale, height: A4_H * scale }}>
          <div style={{ width: A4_W, height: A4_H, transform: "scale(" + scale + ")", transformOrigin: "top left" }}
            dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </section>
  );
}

function CustomizationRail({ theme, setTheme, docType, setDocType, qrMode, setQrMode, taxMode, setTaxMode, variant, isDef, L, onMakeDefault, savedMsg }: {
  theme: string; setTheme: (v: string) => void; docType: string; setDocType: (v: string) => void;
  qrMode: string; setQrMode: (v: string) => void; taxMode: string; setTaxMode: (v: string) => void;
  variant: string; isDef: boolean; L: (tr: string, en?: string) => string; onMakeDefault: () => void; savedMsg: boolean;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{L("Görünüm", "Appearance")}</h3>
        <div className="flex gap-2 flex-wrap">
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)} aria-label={t.id}
              className={"h-8 w-8 rounded-full border-2 flex items-center justify-center transition-transform " + (theme === t.id ? "scale-110 border-slate-900" : "border-transparent hover:scale-105")}
              style={{ background: t.color }}>
              {theme === t.id && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{L("Belge", "Document")}</h3>
        <select value={docType} onChange={(e) => setDocType(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          <option value="invoice">{L("Fatura", "Invoice")}</option>
          <option value="proforma">Proforma</option>
          <option value="commercial">Commercial</option>
          <option value="quote">{L("Teklif", "Quote")}</option>
        </select>
      </div>

      <div className="h-px bg-slate-100" />

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">QR</h3>
        <Segmented value={qrMode} onChange={setQrMode}
          options={[["verify", L("Doğrulama", "Verify")], ["pay", L("Ödeme", "Pay")], ["off", L("Kapalı", "Off")]]} />
      </div>

      <div className="h-px bg-slate-100" />

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{L("Vergi", "Tax")}</h3>
        <Segmented value={taxMode} onChange={setTaxMode}
          options={[["normal", L("Normal", "Normal")], ["reverse", L("Tevkifat", "Reverse")], ["exempt", L("Muaf", "Exempt")]]} />
      </div>

      <div className="h-px bg-slate-100" />

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{L("Seçili Şablon", "Selected Template")}</h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">{VARIANT_NAMES[variant]}</p>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">{L(VD[variant]?.TR || "", VD[variant]?.EN || "")}</p>
          {isDef ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"><Check className="h-3.5 w-3.5" />{L("Varsayılan şablon", "Default template")}</p>
          ) : (
            <button onClick={onMakeDefault} className="mt-2 w-full rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              {L("Varsayılan Yap", "Make Default")}
            </button>
          )}
          {savedMsg && <p className="text-xs text-emerald-600 mt-1.5 text-center">{L("Kaydedildi", "Saved")}</p>}
        </div>
      </div>
    </div>
  );
}

function FullscreenPreview({ html, L, onClose }: { html: string; L: (tr: string, en?: string) => string; onClose: () => void }) {
  const [scale, setScale] = useState(0.9);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-800/95 flex flex-col" role="dialog" aria-modal="true">
      <div className="shrink-0 flex items-center justify-between px-5 h-14 border-b border-slate-700">
        <span className="text-sm font-medium text-slate-200">{L("Tam Ekran Önizleme", "Full Screen Preview")}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale((s) => Math.max(s - 0.1, 0.4))} aria-label={L("Uzaklaştır", "Zoom out")} className="p-2 rounded-lg hover:bg-slate-700 text-slate-200"><ZoomOut className="h-4 w-4" /></button>
          <span className="text-xs text-slate-300 w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(s + 0.1, 2))} aria-label={L("Yakınlaştır", "Zoom in")} className="p-2 rounded-lg hover:bg-slate-700 text-slate-200"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={onClose} aria-label={L("Kapat", "Close")} className="ml-2 p-2 rounded-lg hover:bg-slate-700 text-slate-200"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto flex justify-center p-8">
        <div className="bg-white shadow-2xl overflow-hidden self-start" style={{ width: A4_W * scale, height: A4_H * scale }}>
          <div style={{ width: A4_W, height: A4_H, transform: "scale(" + scale + ")", transformOrigin: "top left" }}
            dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1 flex-wrap">
      {options.map(([val, lbl]) => (
        <button key={val} onClick={() => onChange(val)}
          className={"flex-1 min-w-[60px] px-2 py-1.5 rounded-md text-xs font-medium transition-colors " + (value === val ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}>
          {lbl}
        </button>
      ))}
    </div>
  );
}
