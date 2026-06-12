// Basit, tekrar kullanılabilir doğrulama yardımcıları (sunucu tarafı).
// Form alanları için ortak kurallar — müşteri, ürün vb. her yerde aynı.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(e?: string | null): boolean {
  if (!e) return true; // boş = opsiyonel, geçerli say
  return EMAIL_RE.test(e.trim());
}

// IBAN: ülke kodu (2 harf) + 2 rakam + 11-30 alfanümerik. Boşlukları yok say.
export function isValidIban(iban?: string | null): boolean {
  if (!iban) return true;
  const s = iban.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s);
}

// Negatif olmayan sonlu sayı
export function isNonNegativeNumber(n: unknown): boolean {
  return typeof n === "number" && isFinite(n) && n >= 0;
}

// 0–100 arası (KDV oranı vb.)
export function isPercent(n: unknown): boolean {
  return typeof n === "number" && isFinite(n) && n >= 0 && n <= 100;
}

// Sunucu action'larında kullanmak için: ilk hatayı döndür (yoksa null)
export function validateClientInput(input: { name?: string; email?: string | null }): string | null {
  if (!input.name?.trim()) return "Müşteri adı gerekli.";
  if (!isValidEmail(input.email)) return "Geçerli bir e-posta girin.";
  return null;
}

export function validateProductInput(input: { name?: string; unitPrice?: number; vatRate?: number }): string | null {
  if (!input.name?.trim()) return "Ürün adı gerekli.";
  if (input.unitPrice != null && !isNonNegativeNumber(input.unitPrice)) return "Fiyat negatif olamaz.";
  if (input.vatRate != null && !isPercent(input.vatRate)) return "KDV oranı 0–100 arasında olmalı.";
  return null;
}

// QR/resim güvenliği: yalnızca PNG/JPEG/WEBP base64 data URL kabul et.
// SVG ve harici URL'lere izin verme (SVG içinde script → XSS riski).
export function isSafeImageDataUrl(s?: string | null): boolean {
  if (!s) return false;
  return /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/.test(s);
}

// Güvenli değilse boş döndür (kaydetmeyi engellemek yerine resmi düşür)
export function sanitizeImageDataUrl(s?: string | null): string | null {
  return isSafeImageDataUrl(s) ? (s as string) : null;
}
