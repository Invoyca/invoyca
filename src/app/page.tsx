"use client";

import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { LANDING } from "@/lib/i18n-landing";
import { LANGS, Lang } from "@/lib/i18n";
import { Globe, Check, FileText, Zap, Shield, Languages, CreditCard, ArrowRight, ChevronDown } from "lucide-react";

const APP_URL = "https://app.invoyca.com";

export default function Landing() {
  const [lang, setLang] = useState<Lang>("TR");
  const t = LANDING[lang];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F1F4F9" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-semibold tracking-tight text-[15px]">Invoyca</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">{t.nav_features}</a>
            <a href="#pricing" className="hover:text-slate-900">{t.nav_pricing}</a>
            <a href="#faq" className="hover:text-slate-900">{t.nav_faq}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LandingLang lang={lang} setLang={setLang} />
            <a href={APP_URL} className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
              {t.cta_start}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium mb-5">
              {t.hero_badge}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              {t.hero_title_1} <span className="text-blue-600">{t.hero_title_hl}</span>.
            </h1>
            <p className="mt-5 text-lg text-slate-500 leading-relaxed">{t.hero_desc}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={APP_URL} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white font-semibold px-6 py-3 hover:bg-blue-700">
                {t.hero_cta} <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white font-semibold px-6 py-3 hover:bg-slate-50">
                {t.hero_pricing}
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> {t.hero_f1}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> {t.hero_f2}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> {t.hero_f3}</span>
            </div>
          </div>
          {/* Mockup */}
          <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 rotate-1 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-start justify-between mb-6">
              <div className="h-10 w-10 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center text-[8px] text-blue-400 font-semibold">LOGO</div>
              <p className="text-2xl font-bold text-blue-600">FATURA</p>
            </div>
            <div className="space-y-1 mb-4">
              <p className="text-sm font-semibold">Bright Sample Company</p>
              <p className="text-xs text-slate-400">48 Sample Avenue, Amsterdam</p>
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Web tasarım</span><span>€2.000</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Aylık bakım ×3</span><span>€450</span></div>
              <div className="flex justify-between font-semibold text-blue-600 border-t border-slate-100 pt-2 text-sm"><span>GENEL TOPLAM</span><span>€3.540</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">{t.features_title}</h2>
        <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">{t.features_sub}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Languages, title: t.f_lang_t, desc: t.f_lang_d },
            { icon: CreditCard, title: t.f_cur_t, desc: t.f_cur_d },
            { icon: FileText, title: t.f_tpl_t, desc: t.f_tpl_d },
            { icon: Shield, title: t.f_law_t, desc: t.f_law_d },
            { icon: Zap, title: t.f_auto_t, desc: t.f_auto_d },
            { icon: Globe, title: t.f_any_t, desc: t.f_any_d },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fiyatlar — 2026 promosyonu */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-white border-2 border-emerald-200 p-10 sm:p-16 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-4 py-1.5 text-sm font-semibold mb-6">
            <Check className="h-4 w-4" /> {t.promo_badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {t.promo_title_1} <span className="text-emerald-600">{t.promo_title_hl}</span>
          </h2>
          <p className="text-lg text-slate-500 mb-2">{t.promo_desc}</p>
          <p className="text-sm text-slate-400 mb-8">{t.promo_note}</p>
          <a href={APP_URL} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-semibold px-8 py-3 hover:bg-emerald-700">
            {t.promo_cta} <ArrowRight className="h-4 w-4" />
          </a>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t.promo_b1}</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t.promo_b2}</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t.promo_b3}</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t.promo_b4}</span>
          </div>
        </div>
      </section>

      {/* Son CTA */}
      {/* SSS */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10 text-slate-900">{t.faq_title}</h2>
        <div className="space-y-3">
          {[
            { q: t.faq_q1, a: t.faq_a1 },
            { q: t.faq_q2, a: t.faq_a2 },
            { q: t.faq_q3, a: t.faq_a3 },
            { q: t.faq_q4, a: t.faq_a4 },
            { q: t.faq_q5, a: t.faq_a5 },
          ].map((item, i) => (
            <details key={i} className="group rounded-xl border border-slate-200 bg-white p-5 [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-slate-900 list-none">
                {item.q}
                <span className="ml-4 text-slate-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-10 sm:p-16 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">{t.final_title}</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">{t.final_desc}</p>
          <a href={APP_URL} className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-700 font-semibold px-8 py-3 hover:bg-blue-50">
            {t.final_cta} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-semibold text-sm">Invoyca</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 Invoyca. {lang === "TR" ? "Tüm hakları saklıdır." : "All rights reserved."}</p>
          <a href="mailto:hello@invoyca.com" className="text-xs text-slate-500 hover:text-slate-900">hello@invoyca.com</a>
        </div>
      </footer>
    </div>
  );
}

function LandingLang({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <Globe className="h-4 w-4" /> {lang} <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white shadow-xl py-1 z-50">
          {LANGS.map(({ code, name }) => (
            <button key={code} onClick={() => { setLang(code); setOpen(false); }}
              className="w-full px-3 py-2 text-sm hover:bg-slate-50 text-slate-700 text-left">{name}</button>
          ))}
        </div>
      )}
    </div>
  );
}
