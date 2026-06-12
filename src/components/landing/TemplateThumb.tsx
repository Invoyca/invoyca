"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

// Şablon küçük önizlemesi — gerçek HTML'i A4 oranında karta sığdırır (hepsi aynı boy)
export function TemplateThumb({ html, onClick, label }: { html: string; onClick: () => void; label: string }) {
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
