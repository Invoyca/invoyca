"use client";

import { useState, useRef, useEffect } from "react";
import { renderInvoiceHTML } from "@/lib/templates/render";
import { Logo } from "@/components/Logo";
import { LANDING } from "@/lib/i18n-landing";
import { LANGS, Lang } from "@/lib/i18n";
import { Globe, Check, FileText, Zap, Shield, Languages, CreditCard, ArrowRight, ChevronDown, Mail, Users, Sparkles, X, Menu, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const APP_URL = "https://app.invoyca.com";

export default function Landing() {
  const [lang, setLang] = useState<Lang>("TR");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openTpl, setOpenTpl] = useState<string | null>(null); // büyütülen şablon
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
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50">
              <Logo size={24} />
            </div>
            <span className="font-bold tracking-tight text-base text-slate-900">Invoyca</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">{t.nav_features}</a>
            <a href="#templates" className="hover:text-slate-900">{t.nav_templates}</a>
            <a href="#how" className="hover:text-slate-900">{t.nav_how}</a>
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
              // Giriş yapmamış: Ücretsiz Başla (sadece masaüstünde göster, mobilde menüde)
              <a href={APP_URL} className="hidden sm:inline-flex rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700">
                {t.cta_start}
              </a>
            )}
            {/* Mobil hamburger */}
            <button onClick={() => setMobileOpen((v) => !v)} aria-label="Menu"
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {/* Mobil açılır menü */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1">
            {[
              { href: "#features", label: t.nav_features },
              { href: "#templates", label: t.nav_templates },
              { href: "#how", label: t.nav_how },
              { href: "#pricing", label: t.nav_pricing },
              { href: "#faq", label: t.nav_faq },
            ].map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {item.label}
              </a>
            ))}
            <a href={APP_URL} className="block text-center rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 mt-2 hover:bg-blue-700">
              {t.cta_start}
            </a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Hareketli arka plan blob'ları */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="iv-blob absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="iv-blob absolute top-40 right-0 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" style={{ animationDelay: "-6s" }} />
          <div className="iv-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" style={{ animationDelay: "-12s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="grid lg:grid-cols-[1fr_0.85fr] gap-12 items-center">
            <div>
              <span className="inline-block rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium mb-5 border border-blue-100">
                {t.hero_badge}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 leading-[1.1] max-w-2xl">
                {t.hero_title_1} <span className="text-blue-600">{t.hero_title_hl}</span>.
              </h1>
              <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-xl">{t.hero_desc}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href={APP_URL} className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white font-semibold px-6 py-3 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all">
                  {t.hero_cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#templates" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 backdrop-blur font-semibold px-6 py-3 hover:bg-slate-50 transition-colors">
                  {t.hero_pricing}
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t.hero_f1}</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t.hero_f3}</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t.hero_f2}</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> {t.hero_f4}</span>
              </div>
            </div>
            {/* Yüzen fatura mockup'ı + arka katman */}
            <div className="relative">
              {/* Yumuşak mavi parıltı */}
              <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-blue-400/20 blur-3xl" aria-hidden="true" />
              {/* Arkadaki ikinci kart (derinlik) */}
              <div className="absolute inset-0 rounded-2xl bg-white border border-slate-200 translate-x-4 translate-y-4 rotate-2 shadow-lg" aria-hidden="true" />
              <div className="iv-float relative rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 max-w-md mx-auto lg:scale-95 xl:scale-100">
                {/* Üst: logo + belge başlığı + no/tarih */}
                <div className="flex items-start justify-between mb-5">
                  <Logo size={34} />
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600 tracking-tight">{t.m_title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.m_no}: INV-2026-001</p>
                  </div>
                </div>
                {/* Tarih satırı */}
                <div className="flex gap-4 mb-4 text-[10px]">
                  <div><span className="text-slate-400">{t.m_issue}</span><p className="text-slate-700 font-medium">12.06.2026</p></div>
                  <div><span className="text-slate-400">{t.m_due}</span><p className="text-slate-700 font-medium">12.07.2026</p></div>
                </div>
                {/* From / Bill To */}
                <div className="flex justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="text-[10px]">
                    <p className="text-slate-400 uppercase tracking-wide mb-0.5">{t.m_from}</p>
                    <p className="text-slate-800 font-semibold">Bright Studio</p>
                  </div>
                  <div className="text-[10px] text-right">
                    <p className="text-slate-400 uppercase tracking-wide mb-0.5">{t.m_billto}</p>
                    <p className="text-slate-800 font-semibold">Northline B.V.</p>
                  </div>
                </div>
                {/* Kalemler */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">{t.m_item1}</span><span className="text-slate-700">€2.000</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t.m_item2}</span><span className="text-slate-700">€450</span></div>
                </div>
                {/* Subtotal + reverse charge notu + total */}
                <div className="border-t border-slate-100 mt-3 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400"><span>{t.m_subtotal}</span><span>€2.450</span></div>
                  <p className="text-[9px] text-slate-400 italic">{t.m_vatnote}</p>
                  <div className="flex justify-between font-bold text-blue-600 text-sm pt-1"><span>{t.m_total}</span><span>€2.450</span></div>
                </div>
                {/* Ödeme bilgileri */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">{t.m_pay}</p>
                  <p className="text-[10px] text-slate-500">IBAN: NL00 BANK 0000 0000</p>
                </div>
                {/* "PDF hazır" rozeti */}
                <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> {t.m_ready}
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
            {/* İçerik iki kez yan yana — animasyon -50% kaydırınca kusursuz döner */}
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center shrink-0" aria-hidden={dup === 1}>
                {t.marquee.map((item, i) => (
                  <span key={i} className="flex items-center whitespace-nowrap text-sm text-slate-600 font-medium">
                    <span className="px-6">{item}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                  </span>
                ))}
              </div>
            ))}
          </div>
          {/* Kenar gölgeleri (fade) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/80 to-transparent" />
        </div>
      </section>

      {/* Nasıl Çalışır — 4 adım */}
      <section id="how" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
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

      {/* Şablon önizleme */}
      <section id="templates" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">{t.tpl_title}</h2>
        <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">{t.tpl_sub}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { variant: "standard", theme: "slate", label: t.tpl_minimal },
            { variant: "band", theme: "blue", label: t.tpl_consultant },
            { variant: "sidebar", theme: "violet", label: t.tpl_agency },
            { variant: "letterhead", theme: "emerald", label: t.tpl_corporate },
          ].map((tpl, i) => (
            <div key={i} className="iv-reveal" style={{ animationDelay: `${i * 0.06}s` }}>
              <TemplateThumb
                label={tpl.label}
                onClick={() => setOpenTpl(tpl.variant)}
                html={renderInvoiceHTML({ variant: tpl.variant, theme: tpl.theme, lang, docType: "invoice", qrMode: "off", taxMode: "normal" })}
              />
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href={APP_URL} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white font-semibold px-6 py-3 hover:bg-slate-50 transition-colors">
            {t.tpl_cta} <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Şablon büyütme modal'ı */}
        {openTpl && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8" onClick={() => setOpenTpl(null)}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative bg-slate-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setOpenTpl(null)} className="sticky top-3 left-full ml-[-3rem] z-10 flex items-center justify-center h-9 w-9 rounded-full bg-white shadow-lg text-slate-600 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
              <div className="p-4 sm:p-8 -mt-12">
                <div className="bg-white shadow-xl mx-auto" style={{ maxWidth: "794px" }}
                  dangerouslySetInnerHTML={{ __html: renderInvoiceHTML({ variant: openTpl, theme: openTpl === "band" ? "blue" : openTpl === "sidebar" ? "violet" : openTpl === "letterhead" ? "emerald" : "slate", lang, docType: "invoice", qrMode: "off", taxMode: "normal" }) }} />
                <p className="text-center text-sm text-slate-500 mt-6">
                  {lang === "TR" ? "Bu, 25 hazır şablondan biri. Uygulamada rengini ve dilini değiştirebilirsin." : "One of 25 ready templates. You can change its color and language in the app."}
                </p>
                <div className="text-center mt-4">
                  <a href={APP_URL} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white font-semibold px-6 py-2.5 hover:bg-blue-700">
                    {t.hero_cta} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Kimler için? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-3 iv-reveal">{t.who_title}</h2>
        <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto iv-reveal">{t.who_sub}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.who_list.map((who, i) => (
            <div key={i} className="iv-reveal flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3.5 hover:border-blue-300 hover:shadow-sm transition-all" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="h-4 w-4" /></div>
              <span className="text-sm font-medium text-slate-700">{who}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sadelik / değer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="iv-reveal">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">{t.val_title}</h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-6">{t.val_text}</p>
            <div className="space-y-3">
              {[t.val_p1, t.val_p2, t.val_p3].map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check className="h-3.5 w-3.5" /></div>
                  <span className="text-slate-700">{p}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Karşılaştırma kartı */}
          <div className="iv-reveal rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
            <div className="pb-5 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 shrink-0 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center"><X className="h-4 w-4" /></div>
                <p className="text-sm font-medium text-slate-400">{t.val_card_not}</p>
              </div>
              <div className="space-y-1.5 pl-9 text-sm text-slate-400">
                <p className="flex items-center gap-2"><X className="h-3.5 w-3.5" /> {lang === "TR" ? "Fazla modül ve ayar" : "Too many modules"}</p>
                <p className="flex items-center gap-2"><X className="h-3.5 w-3.5" /> {lang === "TR" ? "Uzun kurulum" : "Long setup"}</p>
                <p className="flex items-center gap-2"><X className="h-3.5 w-3.5" /> {lang === "TR" ? "Karmaşık arayüz" : "Complex interface"}</p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Sparkles className="h-4 w-4" /></div>
                <p className="text-sm font-bold text-slate-900">Invoyca</p>
              </div>
              <div className="space-y-1.5 pl-9 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> {lang === "TR" ? "Hızlı fatura oluşturma" : "Fast invoicing"}</p>
                <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> {lang === "TR" ? "PDF çıktısı" : "PDF output"}</p>
                <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> {lang === "TR" ? "Çok dil ve para birimi" : "Multi-language & currency"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fiyatlar — Early Access + Future Pro */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">{t.pr_title}</h2>
        <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">{t.pr_sub}</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Early Access — vurgulu */}
          <div className="rounded-3xl bg-white border-2 border-blue-500 p-8 relative shadow-lg">
            <span className="absolute -top-3 left-8 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">2026</span>
            <p className="text-sm font-semibold text-blue-600 mb-1">{t.pr_ea_name}</p>
            <p className="text-4xl font-bold text-slate-900 mb-6">{t.pr_ea_price}</p>
            <ul className="space-y-3 mb-8">
              {t.pr_ea_feats.map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" /> {feat}
                </li>
              ))}
            </ul>
            <a href={APP_URL} className="block text-center rounded-xl bg-blue-600 text-white font-semibold px-6 py-3 hover:bg-blue-700 transition-colors">
              {t.pr_ea_cta}
            </a>
          </div>
          {/* Future Pro — soluk */}
          <div className="rounded-3xl bg-slate-50 border border-slate-200 p-8 relative">
            <p className="text-sm font-semibold text-slate-500 mb-1">{t.pr_fp_name}</p>
            <p className="text-2xl font-bold text-slate-400 mb-2">{t.pr_fp_price}</p>
            <p className="text-xs text-slate-400 mb-6">{lang === "TR" ? "Daha gelişmiş kullanım için planlanan özellikler:" : "Planned features for more advanced use:"}</p>
            <ul className="space-y-3 mb-8">
              {t.pr_fp_feats.map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-500">
                  <Check className="h-4 w-4 text-slate-300 shrink-0" /> {feat}
                </li>
              ))}
            </ul>
            <a href={APP_URL} className="block text-center rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold px-6 py-3 hover:bg-slate-50 transition-colors">
              {t.pr_fp_cta}
            </a>
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
            { q: t.faq_q6, a: t.faq_a6 },
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-10 sm:p-16 text-center text-white">
          {/* Yumuşak radyal parıltı */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <h2 className="relative text-3xl font-bold mb-3">{t.fcta_title}</h2>
          <p className="relative text-blue-100 mb-8 max-w-xl mx-auto">{t.fcta_sub}</p>
          <div className="relative flex flex-wrap items-center justify-center gap-3">
            <a href={APP_URL} className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-700 font-semibold px-8 py-3 hover:bg-blue-50 transition-colors">
              {t.fcta_primary} <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#features" className="inline-flex items-center gap-2 rounded-xl border border-white/40 text-white font-semibold px-8 py-3 hover:bg-white/10 transition-colors">
              {t.fcta_secondary}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Marka + açıklama */}
            <div className="lg:col-span-2 max-w-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50">
                  <Logo size={20} />
                </div>
                <span className="font-bold text-slate-900">Invoyca</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{t.foot_desc}</p>
              <a href="mailto:contact@invoyca.com" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 mt-4">
                <Mail className="h-4 w-4" /> contact@invoyca.com
              </a>
            </div>
            {/* Ürün linkleri */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">{t.nav_features}</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#features" className="hover:text-blue-600">{t.nav_features}</a></li>
                <li><a href="#templates" className="hover:text-blue-600">{t.nav_templates}</a></li>
                <li><a href="#how" className="hover:text-blue-600">{t.nav_how}</a></li>
              </ul>
            </div>
            {/* Diğer linkler */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Invoyca</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#pricing" className="hover:text-blue-600">{t.nav_pricing}</a></li>
                <li><a href="#faq" className="hover:text-blue-600">{t.nav_faq}</a></li>
                <li><a href="/privacy" className="hover:text-blue-600">{t.foot_privacy}</a></li>
                <li><a href="/terms" className="hover:text-blue-600">{t.foot_terms}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-400">© 2026 Invoyca. {t.foot_rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Şablon küçük önizlemesi — gerçek HTML'i A4 oranında karta sığdırır (hepsi aynı boy)
function TemplateThumb({ html, onClick, label }: { html: string; onClick: () => void; label: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const measure = () => {
      if (!boxRef.current) return;
      const boxW = boxRef.current.clientWidth; // kartın genişliği
      setScale(boxW / 794);                    // A4 genişliği 794px → ölçek
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      {/* Kart A4 oranında SABİT — tüm şablonlar aynı boyutta görünür */}
      <div ref={boxRef} className="relative rounded-xl bg-white border border-slate-200 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1.5 transition-all overflow-hidden" style={{ aspectRatio: "794 / 1123" }}>
        <div className="absolute top-0 left-0 origin-top-left pointer-events-none" style={{ width: "794px", transform: `scale(${scale})` }}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-full p-2.5 shadow-lg">
            <Search className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </div>
      <p className="text-center text-sm font-medium text-slate-700 mt-3">{label}</p>
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
