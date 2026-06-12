import { Logo } from "@/components/Logo";
import type { LDict } from "@/lib/i18n-landing";

// Hero'daki yüzen fatura görseli — tamamen statik, sadece diller arası metin değişir.
export function InvoiceMockup({ t }: { t: LDict }) {
  return (
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
  );
}
