"use client";

import { useRef, useState, useEffect } from "react";

// A4 önizlemeyi mobil ekrana ölçekleyerek gösterir.
// new/page.tsx'ten BİREBİR çıkarıldı (davranış değişmedi).
export function MobilePreview({ html }: { html: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const measure = () => {
      const w = wrapRef.current?.clientWidth || 0;
      if (w > 0) setScale(w / 794);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  return (
    // Dış sarmalayıcı: genişliği ekrana göre (%100). Bunu ölçüyoruz.
    <div ref={wrapRef} className="w-full">
      {scale > 0 && (
        // Görünen kutu: scale'li A4 yüksekliği kadar yer kaplar (taşma/boşluk yok)
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ height: 794 * 1.414 * scale }}>
          <div style={{ width: 794, height: 794 * 1.414, transform: `scale(${scale})`, transformOrigin: "top left" }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </div>
  );
}
