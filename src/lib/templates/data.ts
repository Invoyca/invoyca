// Fatura şablon sistemi — tipler ve sabitler

export type ThemeId = "blue" | "slate" | "emerald" | "violet" | "rose";
export type TaxMode = "normal" | "reverse" | "exempt";
export type QrMode = "verify" | "pay" | "off";
export type DocType = "invoice" | "proforma" | "commercial" | "quote";
export type Lang = "TR" | "EN" | "DE" | "NL" | "FR" | "ES" | "IT";

export type FamilyId = "classic" | "modern" | "minimal" | "compact" | "bold";

export const FAMILIES: Record<FamilyId, { name: string; variants: string[] }> = {
  classic: { name: "Classic", variants: ["standard", "bordered", "centered", "letterhead", "detailed"] },
  modern: { name: "Modern", variants: ["band", "sidebar", "split", "card", "accent"] },
  minimal: { name: "Minimal", variants: ["mono", "wide", "line", "corner", "serif"] },
  compact: { name: "Compact", variants: ["dense", "grid", "header", "twin", "receipt"] },
  bold: { name: "Bold", variants: ["block", "dark", "diagonal", "stamp", "frame"] },
};

export const THEMES: { id: ThemeId; color: string; light: string }[] = [
  { id: "blue", color: "#1D4ED8", light: "#EFF4FF" },
  { id: "slate", color: "#0F172A", light: "#F1F5F9" },
  { id: "emerald", color: "#059669", light: "#ECFDF5" },
  { id: "violet", color: "#7C3AED", light: "#F5F3FF" },
  { id: "rose", color: "#E11D48", light: "#FFF1F3" },
];

export const VARIANT_NAMES: Record<string, string> = {
  standard: "Classic Standard", bordered: "Classic Bordered", centered: "Classic Centered", letterhead: "Classic Letterhead", detailed: "Classic Detailed",
  band: "Modern Band", sidebar: "Modern Sidebar", split: "Modern Split", card: "Modern Card", accent: "Modern Accent",
  mono: "Minimal Mono", wide: "Minimal Wide", line: "Minimal Line", corner: "Minimal Corner", serif: "Minimal Serif",
  dense: "Compact Dense", grid: "Compact Grid", header: "Compact Header", twin: "Compact Twin", receipt: "Compact Receipt",
  block: "Bold Block", dark: "Bold Dark", diagonal: "Bold Diagonal", stamp: "Bold Stamp", frame: "Bold Frame",
};

// Şablon önizlemesi için örnek fatura verisi (placeholder, gerçek dışı)
export const SAMPLE = {
  sender: { name: "North Example Studio", addr: ["24 Example Street", "London EX1 2AB", "United Kingdom"], tax: "000000000", vat: "GB000000000", email: "billing@example.com" },
  client: { name: "Bright Sample Company", addr: ["48 Sample Avenue", "Amsterdam 1000 AA", "The Netherlands"], vat: "NL000000000B00", email: "finance@example.org" },
  meta: { no: "2026-0042", issue: "06.06.2026", due: "06.07.2026", ref: "PRJ-2026-118" },
  bank: { name: "Example Bank", iban: "GB00 EXMP 0000 0000 0000 00", swift: "EXMPGB00XXX" },
  items: [
    ["Web tasarım", "proje", 1, "€2.000,00", "€2.000,00"],
    ["Aylık bakım", "ay", 3, "€150,00", "€450,00"],
    ["Logo tasarımı", "proje", 1, "€500,00", "€500,00"],
  ] as [string, string, number, string, string][],
  subtotal: "€2.950,00", vat: "€590,00", total: "€3.540,00", totalReverse: "€2.950,00",
};

// Çok dilli fatura içerik etiketleri
export const TPL_LABELS: Record<Lang, Record<string, string>> = {
  TR: { invoice: "FATURA", proforma: "PROFORMA FATURA", commercial: "TİCARİ FATURA", quote: "TEKLİF", from: "Gönderen", billto: "Alıcı", invno: "Fatura No", issue: "Tarih", due: "Vade", desc: "Açıklama", qty: "Adet", price: "Fiyat", amount: "Tutar", subtotal: "Ara Toplam", vat: "KDV %20", total: "GENEL TOPLAM", paid: "Ödenecek", payinfo: "Ödeme", notes: "Not", notes_val: "Hizmetler sözleşmeye uygun teslim edilmiştir.", scan: "Ödemek için tarayın", scan_verify: "Doğrulamak için tarayın", reverse: "Tevkifat", exempt: "Muaf", rc_note: "KDV tevkifatı — Madde 196, 2006/112/EC. KDV alıcı tarafından beyan edilecektir.", ex_note: "KDV'den muaf ihracat teslimi.", vkn: "VKN", vatid: "VAT" },
  EN: { invoice: "INVOICE", proforma: "PROFORMA INVOICE", commercial: "COMMERCIAL INVOICE", quote: "QUOTE", from: "From", billto: "Bill To", invno: "Invoice No", issue: "Date", due: "Due", desc: "Description", qty: "Qty", price: "Price", amount: "Amount", subtotal: "Subtotal", vat: "VAT 20%", total: "TOTAL DUE", paid: "Amount Due", payinfo: "Payment", notes: "Notes", notes_val: "All services delivered as agreed.", scan: "Scan to pay", scan_verify: "Scan to verify", reverse: "Reverse charge", exempt: "Exempt", rc_note: "VAT reverse charge — Article 196, Directive 2006/112/EC.", ex_note: "VAT-exempt export supply.", vkn: "Tax ID", vatid: "VAT" },
  DE: { invoice: "RECHNUNG", proforma: "PROFORMA-RECHNUNG", commercial: "HANDELSRECHNUNG", quote: "ANGEBOT", from: "Von", billto: "Rechnung an", invno: "Rechnungsnr.", issue: "Datum", due: "Fällig", desc: "Beschreibung", qty: "Menge", price: "Preis", amount: "Betrag", subtotal: "Zwischensumme", vat: "MwSt. 19%", total: "GESAMTBETRAG", paid: "Zu zahlen", payinfo: "Zahlung", notes: "Anmerkungen", notes_val: "Alle Leistungen wie vereinbart erbracht.", scan: "Zum Bezahlen scannen", scan_verify: "Zum Verifizieren scannen", reverse: "Reverse Charge", exempt: "Steuerfrei", rc_note: "Steuerschuldnerschaft des Leistungsempfängers (§13b UStG).", ex_note: "Steuerfreie Ausfuhrlieferung.", vkn: "St.-Nr.", vatid: "USt-IdNr." },
  NL: { invoice: "FACTUUR", proforma: "PROFORMAFACTUUR", commercial: "HANDELSFACTUUR", quote: "OFFERTE", from: "Van", billto: "Factuur aan", invno: "Factuurnr.", issue: "Datum", due: "Vervaldatum", desc: "Omschrijving", qty: "Aantal", price: "Prijs", amount: "Bedrag", subtotal: "Subtotaal", vat: "Btw 21%", total: "TOTAAL", paid: "Te betalen", payinfo: "Betaling", notes: "Opmerkingen", notes_val: "Alle diensten zoals afgesproken geleverd.", scan: "Scan om te betalen", scan_verify: "Scan om te verifiëren", reverse: "Btw verlegd", exempt: "Vrijgesteld", rc_note: "Btw verlegd — Artikel 196, Richtlijn 2006/112/EG.", ex_note: "Btw-vrije exportlevering.", vkn: "BTW-nr.", vatid: "Btw-id" },
  FR: { invoice: "FACTURE", proforma: "FACTURE PROFORMA", commercial: "FACTURE COMMERCIALE", quote: "DEVIS", from: "De", billto: "Facturer à", invno: "N° facture", issue: "Date", due: "Échéance", desc: "Description", qty: "Qté", price: "Prix", amount: "Montant", subtotal: "Sous-total", vat: "TVA 20%", total: "TOTAL", paid: "Montant dû", payinfo: "Paiement", notes: "Remarques", notes_val: "Tous les services livrés comme convenu.", scan: "Scanner pour payer", scan_verify: "Scanner pour vérifier", reverse: "Autoliquidation", exempt: "Exonéré", rc_note: "Autoliquidation de la TVA — Article 196, Directive 2006/112/CE.", ex_note: "Livraison à l'export exonérée de TVA.", vkn: "N° fiscal", vatid: "N° TVA" },
  ES: { invoice: "FACTURA", proforma: "FACTURA PROFORMA", commercial: "FACTURA COMERCIAL", quote: "PRESUPUESTO", from: "De", billto: "Facturar a", invno: "N° factura", issue: "Fecha", due: "Vencimiento", desc: "Descripción", qty: "Cant.", price: "Precio", amount: "Importe", subtotal: "Subtotal", vat: "IVA 21%", total: "TOTAL", paid: "Importe a pagar", payinfo: "Pago", notes: "Notas", notes_val: "Todos los servicios entregados según lo acordado.", scan: "Escanear para pagar", scan_verify: "Escanear para verificar", reverse: "Inv. sujeto pasivo", exempt: "Exento", rc_note: "Inversión del sujeto pasivo — Artículo 196, Directiva 2006/112/CE.", ex_note: "Entrega de exportación exenta de IVA.", vkn: "NIF/CIF", vatid: "N° IVA" },
  IT: { invoice: "FATTURA", proforma: "FATTURA PROFORMA", commercial: "FATTURA COMMERCIALE", quote: "PREVENTIVO", from: "Da", billto: "Fatturare a", invno: "N° fattura", issue: "Data", due: "Scadenza", desc: "Descrizione", qty: "Qtà", price: "Prezzo", amount: "Importo", subtotal: "Subtotale", vat: "IVA 22%", total: "TOTALE", paid: "Importo dovuto", payinfo: "Pagamento", notes: "Note", notes_val: "Tutti i servizi forniti come concordato.", scan: "Scansiona per pagare", scan_verify: "Scansiona per verificare", reverse: "Inversione contabile", exempt: "Esente", rc_note: "Inversione contabile — Articolo 196, Direttiva 2006/112/CE.", ex_note: "Cessione all'esportazione esente IVA.", vkn: "Cod. Fisc.", vatid: "P. IVA" },
};
