// DB'den gelen Invoice kaydını (kalemler+müşteri+şirket dahil) PDF/e-posta için
// InvoiceData formatına çevirir. Para biçimlendirmesi para birimine göre yapılır.
import { InvoiceData } from "@/lib/templates/render";
import { formatMoney } from "@/lib/invoice-calc";
import { unitLabel, normalizeUnit } from "@/lib/units";

// Prisma Decimal -> number güvenli dönüşüm
function num(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v?.toNumber === "function") return v.toNumber();
  return Number(v) || 0;
}

function fmtDate(d: any): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("tr-TR"); } catch { return ""; }
}

// invoice: Prisma Invoice + { items, client, company }
export function dbInvoiceToData(invoice: any): InvoiceData {
  const cur = invoice.currency || "EUR";
  const lang = String(invoice.language || "TR");
  const company = invoice.company || {};
  const client = invoice.client || {};

  // SNAPSHOT öncelikli: fatura kesildiği andaki bilgi varsa onu kullan (sonradan
  // şirket/müşteri değişse bile eski fatura sabit kalır). Yoksa relation'a düş (eski faturalar).
  const senderAddr = invoice.senderAddress
    ? String(invoice.senderAddress).split("\n").filter(Boolean)
    : [company.address, company.city, company.country].filter(Boolean);
  const clientAddr = invoice.clientAddressSnap
    ? String(invoice.clientAddressSnap).split("\n").filter(Boolean)
    : [client.address, client.city, client.country].filter(Boolean);

  const subtotal = num(invoice.subtotal);
  const vatTotal = num(invoice.vatTotal);
  const total = num(invoice.total);
  const discount = num(invoice.discount);
  const noVat = Math.max(0, subtotal - discount);

  return {
    sender: {
      name: invoice.senderName || company.name || "",
      addr: senderAddr,
      tax: invoice.senderTaxId || company.taxId || "",
      vat: invoice.senderVatId || company.vatId || "",
      email: invoice.senderEmail || company.email || "",
    },
    client: {
      name: invoice.clientNameSnap || client.name || "",
      addr: clientAddr,
      vat: invoice.clientVatIdSnap || client.vatId || "",
      email: invoice.clientEmailSnap || client.email || "",
    },
    meta: {
      no: invoice.number || "",
      issue: fmtDate(invoice.issueDate),
      due: fmtDate(invoice.dueDate),
      ref: invoice.reference || "",
    },
    bank: {
      name: invoice.bankName || company.bankName || "",
      iban: invoice.bankIban || company.iban || "",
      swift: invoice.bankSwift || company.swift || "",
    },
    items: (invoice.items || []).map((it: any) => [
      it.description || "",
      unitLabel(normalizeUnit(it.unit || ""), lang),
      num(it.quantity),
      formatMoney(num(it.unitPrice), cur),
      formatMoney(num(it.quantity) * num(it.unitPrice), cur),
    ] as [string, string, number, string, string]),
    subtotal: formatMoney(subtotal, cur),
    vat: formatMoney(vatTotal, cur),
    total: formatMoney(total, cur),
    totalReverse: formatMoney(noVat, cur),
    // Kullanıcının girdiği serbest alanlar (PDF/HTML render bunları gösterir)
    // @ts-ignore
    subtitle: invoice.subtitle || "",
    // @ts-ignore
    userNotes: invoice.notes || "",
    // @ts-ignore
    userTerms: invoice.terms || "",
  };
}

// taxMode enum (DB: NORMAL/REVERSE/EXEMPT) -> PDF (normal/reverse/exempt)
export function dbTaxMode(m: any): "normal" | "reverse" | "exempt" {
  const s = String(m || "").toUpperCase();
  if (s === "REVERSE") return "reverse";
  if (s === "EXEMPT") return "exempt";
  return "normal";
}

// language enum (TR/EN/...) PDF lang ile aynı; docType enum -> pdf docType
export function dbDocType(t: any): "invoice" | "quote" | "proforma" | "commercial" {
  const s = String(t || "").toUpperCase();
  if (s === "QUOTE") return "quote";
  if (s === "PROFORMA") return "proforma";
  if (s === "COMMERCIAL") return "commercial";
  return "invoice";
}
