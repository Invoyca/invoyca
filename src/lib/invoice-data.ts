// Editör state'ini render motorunun beklediği InvoiceData formatına çevirir
import { LineItem, calcTotals, formatMoney, lineAmount, TaxMode } from "./invoice-calc";
import { InvoiceData } from "./templates/render";

export type EditorState = {
  sender: { name: string; addr: string; tax: string; vat: string; email: string };
  client: { name: string; addr: string; vat: string; email: string };
  meta: { no: string; issue: string; due: string; ref: string };
  bank: { name: string; iban: string; swift: string };
  items: LineItem[];
  discount: number;
  currency: string;
  taxMode: TaxMode;
};

export function toInvoiceData(s: EditorState): InvoiceData {
  const totals = calcTotals(s.items, s.discount, s.taxMode);
  const noVat = Math.max(0, totals.subtotal - totals.discount);
  return {
    sender: { name: s.sender.name, addr: s.sender.addr.split("\n"), tax: s.sender.tax, vat: s.sender.vat, email: s.sender.email },
    client: { name: s.client.name, addr: s.client.addr.split("\n"), vat: s.client.vat, email: s.client.email },
    meta: s.meta,
    bank: s.bank,
    items: s.items.map((it) => [
      it.description, it.unit, it.quantity,
      formatMoney(it.unitPrice, s.currency), formatMoney(lineAmount(it), s.currency),
    ] as [string, string, number, string, string]),
    subtotal: formatMoney(totals.subtotal, s.currency),
    vat: formatMoney(totals.vatTotal, s.currency),
    total: formatMoney(totals.total, s.currency),
    totalReverse: formatMoney(noVat, s.currency),
    // @ts-ignore — render motoru ek alan olarak okur
    vatAmount: formatMoney(totals.vatTotal, s.currency),
  };
}

export const emptyEditorState: EditorState = {
  sender: { name: "North Example Studio", addr: "24 Example Street\nLondon EX1 2AB\nUnited Kingdom", tax: "000000000", vat: "GB000000000", email: "billing@example.com" },
  client: { name: "", addr: "", vat: "", email: "" },
  meta: { no: "2026-0043", issue: new Date().toLocaleDateString("tr-TR"), due: "", ref: "" },
  bank: { name: "Example Bank", iban: "GB00 EXMP 0000 0000 0000 00", swift: "EXMPGB00XXX" },
  items: [{ description: "", unit: "adet", quantity: 1, unitPrice: 0, vatRate: 20 }],
  discount: 0,
  currency: "EUR",
  taxMode: "normal",
};
