"use client";

import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { LANDING } from "@/lib/i18n-landing";
import { LANGS, Lang } from "@/lib/i18n";
import { Globe, Check, FileText, Zap, Shield, Languages, CreditCard, ArrowRight, ChevronDown, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const APP_URL = "https://app.invoyca.com";

export default function Landing() {
  const [lang, setLang] = useState<Lang>("TR");
  const t = LANDING[lang];

  // Giriş yapmış kullanıcının baş harfleri (yoksa boş = giriş yapmamış)
  const [initials, setInitials] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (!u) { setInitials(null); return; }
      const full = (u.user_metadata?.name || "").trim();
      if (full) {
        const parts = full.split(" ").filter(Boolean);
        const ini = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]) : full.slice(0, 2);
        setInitials(ini.toUpperCase());
      } else if (u.email) {
        setInitials(u.email.slice(0, 2).toUpperCase());
      } else {
        setInitials("•");
      }
    }).catch(() => setInitials(null));
  }, []);

  // Scroll'da beliren öğeler için observer
  useEffect(() => {
    const els = document.querySelectorAll(".iv-reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("iv-show"); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F1F4F9" }}>
      {/* Kıtlık / promosyon bandı */}
      <a href={APP_URL} className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center text-sm font-medium py-2.5 px-4 hover:from-blue-700 hover:to-blue-800 transition-colors">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
          {t.banner}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </a>
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
            {initials ? (
              // Giriş yapmış: baş harf avatarı, tıklayınca uygulamaya gider
              <a href={`${APP_URL}/app/dashboard`} title={t.cta_start}
                className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold hover:bg-blue-200 transition-colors">
                {initials}
              </a>
            ) : (
              // Giriş yapmamış: Ücretsiz Başla
              <a href={APP_URL} className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
                {t.cta_start}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Hareketli arka plan blob'ları */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="iv-blob absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="iv-blob absolute top-40 right-0 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" style={{ animationDelay: "-6s" }} />
          <div className="iv-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" style={{ animationDelay: "-12s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium mb-5 border border-blue-100">
                {t.hero_badge}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                {t.hero_title_1} <span className="text-blue-600">{t.hero_title_hl}</span>.
              </h1>
              <p className="mt-4 text-xl font-semibold text-slate-700">
                <span className="text-blue-600">{t.hero_punch1}</span> <span className="text-blue-600">{t.hero_punch2}</span> <span className="text-blue-600">{t.hero_punch3}</span>
              </p>
              <p className="mt-4 text-lg text-slate-500 leading-relaxed">{t.hero_desc}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href={APP_URL} className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white font-semibold px-6 py-3 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all">
                  {t.hero_cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 backdrop-blur font-semibold px-6 py-3 hover:bg-slate-50 transition-colors">
                  {t.hero_pricing}
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> {t.hero_f1}</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> {t.hero_f2}</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> {t.hero_f3}</span>
              </div>
            </div>
            {/* Yüzen fatura mockup'ı + arka katman */}
            <div className="relative">
              {/* Arkadaki ikinci kart (derinlik) */}
              <div className="absolute inset-0 rounded-2xl bg-blue-600/10 border border-blue-200 translate-x-4 translate-y-4 rotate-3" aria-hidden="true" />
              <div className="iv-float relative rounded-2xl bg-white shadow-2xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <Logo size={36} />
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
                {/* Canlı "ödendi" rozeti */}
                <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> {t.w_paid}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Güven şeridi — sonsuz kayan bant */}
      <section className="border-y border-slate-200 bg-white/60 py-6 overflow-hidden">
        <p className="text-center text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">{t.trust_label}</p>
        <div className="relative">
          <div className="flex w-max iv-marquee">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-10 px-5 text-slate-600" aria-hidden={dup === 1}>
                <span className="inline-flex items-center gap-1.5 font-semibold text-lg">€ <span className="text-sm">EUR</span></span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-lg">$ <span className="text-sm">USD</span></span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-lg">£ <span className="text-sm">GBP</span></span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-lg">₺ <span className="text-sm">TRY</span></span>
                <span className="inline-flex items-center gap-1.5 text-sm"><Languages className="h-4 w-4 text-blue-500" /> 7 {t.w_lang}</span>
                <span className="inline-flex items-center gap-1.5 text-sm"><FileText className="h-4 w-4 text-blue-500" /> 25 {t.w_tpl}</span>
                <span className="inline-flex items-center gap-1.5 text-sm"><Globe className="h-4 w-4 text-blue-500" /> {t.w_world}</span>
              </div>
            ))}
          </div>
          {/* Kenar gölgeleri (fade) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/80 to-transparent" />
        </div>
      </section>

      {/* Nasıl Çalışır — 4 adım */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-3 iv-reveal">{t.how_title}</h2>
        <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto iv-reveal">{t.how_sub}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: "1", t: t.how_s1_t, d: t.how_s1_d, visual: "client" },
            { n: "2", t: t.how_s2_t, d: t.how_s2_d, visual: "invoice" },
            { n: "3", t: t.how_s3_t, d: t.how_s3_d, visual: "template" },
            { n: "4", t: t.how_s4_t, d: t.how_s4_d, visual: "track" },
          ].map((s, i) => (
            <div key={s.n} className="iv-reveal group rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">{s.n}</div>
              {/* Mini canlı görsel */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4 h-28 overflow-hidden">
                {s.visual === "client" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">BS</div>
                      <div className="flex-1"><div className="h-2 w-20 bg-slate-300 rounded mb-1" /><div className="h-1.5 w-14 bg-slate-200 rounded" /></div>
                    </div>
                    <div className="flex items-center gap-2 opacity-60">
                      <div className="h-7 w-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">NS</div>
                      <div className="flex-1"><div className="h-2 w-16 bg-slate-300 rounded mb-1" /><div className="h-1.5 w-10 bg-slate-200 rounded" /></div>
                    </div>
                  </div>
                )}
                {s.visual === "invoice" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-slate-500"><span>Web tasarım</span><span className="font-semibold">€2.000</span></div>
                    <div className="flex justify-between text-[9px] text-slate-500"><span>Aylık bakım</span><span className="font-semibold">€450</span></div>
                    <div className="h-px bg-slate-200 my-1" />
                    <div className="flex justify-between text-[10px] font-bold text-blue-600"><span>TOPLAM</span><span>€3.540</span></div>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[7px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">EUR</span>
                      <span className="text-[7px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">KDV %20</span>
                    </div>
                  </div>
                )}
                {s.visual === "template" && (
                  <div className="flex gap-1.5 h-full items-center justify-center">
                    <div className="h-20 w-14 rounded bg-white border-2 border-blue-400 shadow-sm shrink-0"><div className="h-1.5 w-8 bg-blue-400 rounded m-1.5" /><div className="h-0.5 w-9 bg-slate-200 rounded mx-1.5 mb-0.5" /><div className="h-0.5 w-7 bg-slate-200 rounded mx-1.5" /></div>
                    <div className="h-20 w-14 rounded bg-white border border-slate-200 shrink-0 opacity-70"><div className="h-1.5 w-8 bg-slate-800 rounded m-1.5" /><div className="h-0.5 w-9 bg-slate-200 rounded mx-1.5 mb-0.5" /></div>
                    <div className="h-20 w-14 rounded bg-white border border-slate-200 shrink-0 opacity-50"><div className="h-4 w-full bg-emerald-500 rounded-t" /></div>
                  </div>
                )}
                {s.visual === "track" && (
                  <div className="space-y-2">
                    <div className="flex items-end gap-1 h-12">
                      {[40, 65, 50, 80, 70, 95].map((h, k) => <div key={k} className="flex-1 bg-blue-400 rounded-t" style={{ height: `${h}%` }} />)}
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">{t.w_paid} 6</span>
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">{t.w_pending} 2</span>
                    </div>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{s.t}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10 iv-reveal">
          <a href={APP_URL} className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white font-semibold px-6 py-3 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all">
            {t.hero_cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="font-semibold text-sm">Invoyca</span>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1">
              <a href="mailto:contact@invoyca.com" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-blue-600">
                <Mail className="h-4 w-4" /> contact@invoyca.com
              </a>
              <p className="text-xs text-slate-400">{lang === "TR" ? "Soruların için buradayız." : "We're here for your questions."}</p>
            </div>
          </div>
          <div className="border-t border-slate-100 mt-6 pt-6 text-center">
            <p className="text-xs text-slate-400">© 2026 Invoyca. {lang === "TR" ? "Tüm hakları saklıdır." : "All rights reserved."}</p>
          </div>
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
