"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { LANGS } from "@/lib/i18n";

export function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{lang}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white shadow-xl py-1 z-50">
          {LANGS.map(({ code, name }) => (
            <button
              key={code}
              onClick={() => {
                setLang(code);
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-sm hover:bg-slate-50 text-slate-700 text-left"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
