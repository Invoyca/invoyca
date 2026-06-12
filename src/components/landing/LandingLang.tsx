"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { LANGS, Lang } from "@/lib/i18n";

// Dil değiştirici — seçim route'u değiştirir (SEO için ayrı URL)
export function LandingLang({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
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
