// Frontend bileşenleri arası veri akışı için ortak "view model" tipleri.
// Server action'lardan dönen ve client component'lere prop/state olarak geçen
// verilerin şekli. `any[]` yerine bunları kullan → derleme zamanı tip güvenliği.

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
export type Currency = "EUR" | "USD" | "GBP" | "TRY";
export type AppLang = "TR" | "EN" | "DE" | "NL" | "FR" | "ES" | "IT";

// Listelerde ve dashboard'da gösterilen fatura satırı
export type InvoiceListItem = {
  id: string;
  number: string;
  status: InvoiceStatus;
  type?: string;
  currency: Currency | string;
  total: number | string;
  issueDate: string | Date | null;
  dueDate?: string | Date | null;
  paidAt?: string | Date | null;
  clientId?: string | null;
  // İlişki ya da snapshot'tan gelen müşteri adı
  client?: { id?: string; name?: string | null; email?: string | null; country?: string | null } | null;
  clientNameSnap?: string | null;
};

// Müşteri (liste + form)
export type ClientVM = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  vatId?: string | null;
  preferredLanguage?: string | null;
  isArchived?: boolean;
  _count?: { invoices: number };
};

// Ürün / hizmet (liste + form)
export type ProductVM = {
  id: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  unitPrice: number | string;
  vatRate: number | string;
  currency: Currency | string;
  isArchived?: boolean;
};

// Fatura geçmişi olayı (detay sayfası)
export type HistoryEvent = {
  id?: string;
  action: string;
  detail?: string | null;
  createdAt: string | Date;
};
