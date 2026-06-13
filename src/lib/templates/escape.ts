// HTML escape yardımcıları — render.ts'ten BİREBİR çıkarıldı (davranış değişmedi).
// render.ts string interpolation ile HTML üretir; veri tek noktada burada temizlenir.

// XSS koruması: tüm kullanıcı kaynaklı metinler HTML'e basılmadan önce escape edilir.
export const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// Veri objesini derinlemesine escape'le (string'ler temizlenir, sayı/diğer korunur)
export const escDeep = (val: any): any => {
  if (typeof val === "string") return esc(val);
  if (Array.isArray(val)) return val.map(escDeep);
  if (val && typeof val === "object") {
    const out: any = {};
    for (const k of Object.keys(val)) out[k] = escDeep(val[k]);
    return out;
  }
  return val; // sayı, boolean, null
};
