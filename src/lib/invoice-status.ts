// Fatura durum mantığı (state machine).
// Hangi durumdan hangi duruma geçilebilir ve hangi fatura silinebilir.
// Ticari doğruluk: Ödenmiş fatura silinmez/değişmez; gönderilmiş fatura iptal edilir, silinmez.

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

// Her durumdan izin verilen geçişler
const TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],            // taslak gönderilebilir veya iptal edilebilir
  SENT: ["PAID", "OVERDUE", "CANCELLED"],  // gönderildi → ödendi/gecikti/iptal
  OVERDUE: ["PAID", "CANCELLED"],          // gecikmiş → ödendi/iptal
  PAID: [],                                // ödenmiş kilitli (değişmez)
  CANCELLED: [],                           // iptal kilitli
};

// Bir geçiş geçerli mi?
export function canTransition(from: string, to: string): boolean {
  const f = String(from || "").toUpperCase() as InvoiceStatus;
  const t = String(to || "").toUpperCase() as InvoiceStatus;
  if (f === t) return true; // aynı duruma "geçiş" zararsız
  return (TRANSITIONS[f] || []).includes(t);
}

// Bir fatura silinebilir mi? Sadece taslak (DRAFT) gerçekten silinir.
export function canDelete(status: string): boolean {
  return String(status || "").toUpperCase() === "DRAFT";
}

// Silme yerine iptal mi edilmeli? (gönderilmiş/gecikmiş faturalar)
export function shouldCancelInsteadOfDelete(status: string): boolean {
  const s = String(status || "").toUpperCase();
  return s === "SENT" || s === "OVERDUE";
}

// Fatura düzenlenebilir mi? Ödenmiş/iptal edilmiş düzenlenemez.
export function canEdit(status: string): boolean {
  const s = String(status || "").toUpperCase();
  return s === "DRAFT" || s === "SENT" || s === "OVERDUE";
}

// Bir durumdan ulaşılabilecek sonraki durumlar (UI'da buton göstermek için)
export function nextStatuses(status: string): InvoiceStatus[] {
  const s = String(status || "").toUpperCase() as InvoiceStatus;
  return TRANSITIONS[s] || [];
}
