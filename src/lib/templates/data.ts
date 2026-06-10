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
  standard: "Classic Business", bordered: "Formal Frame", centered: "EU / Reverse Charge", letterhead: "Corporate Header", detailed: "Tax Focused",
  band: "Startup Clean", sidebar: "Agency Sidebar", split: "Service Invoice", card: "Subscription", accent: "Payment Link",
  mono: "Minimal Table", wide: "White Space Premium", line: "Clean Line", corner: "Signature Minimal", serif: "Monochrome",
  dense: "Product List", grid: "Dense Service", header: "Small Business", twin: "Inventory", receipt: "One Page Max",
  block: "Premium Bold", dark: "Large Total", diagonal: "Brand Statement", stamp: "Bold Accent", frame: "Executive",
};

// Her şablonun "en uygun kullanım" açıklaması (kullanıcıya rehber)
export const VARIANT_BESTFOR: Record<string, string> = {
  standard: "Geleneksel şirketler, danışmanlık, B2B faturalar — en güvenli seçim",
  bordered: "Hukuk, mühendislik, mimarlık — resmi, çerçeveli belge görünümü",
  letterhead: "Orta ölçekli şirketler, üreticiler, ajanslar — güçlü kurumsal başlık",
  detailed: "Muhasebe odaklı, çok KDV oranlı, indirimli, tevkifatlı detaylı faturalar",
  centered: "Uluslararası B2B, AB sınır ötesi hizmet, reverse charge KDV senaryoları",
  band: "Startup, SaaS, yazılım ve dijital hizmetler — hafif, modern, temiz",
  sidebar: "Yaratıcı ajanslar, marka stüdyoları, tasarımcılar — dikey kenar çubuğu",
  split: "Danışman, mühendis, yazılımcı — saatlik/hizmet bazlı, dönem ve saat odaklı",
  card: "Abonelik, retainer, aylık paket, hosting — fatura dönemi ve ödenecek tutar belirgin",
  accent: "Freelancer, online hizmet — hızlı ödeme odaklı, ödeme kutusu öne çıkar",
  line: "Freelancer, danışman, mühendis, tasarımcı — en dengeli minimal, ince çizgiler",
  wide: "Butik stüdyo, premium danışman, fotoğrafçı, mimar — bol boşluk, editoryal",
  mono: "Küçük şirket, danışman, ürün satıcısı — tablo merkezli, sade ve pratik",
  corner: "Danışman, küçük stüdyo, özel proje — imza/onay alanı içeren",
  serif: "Ciddi şirketler, hukuk, finans — neredeyse renksiz, tipografi odaklı, siyah-beyaz baskıda mükemmel",
  dense: "Perakende, toptan, ürün satışı, parça tedariki — çok satırlı ürün faturaları",
  grid: "Danışman, mühendis, ajans, bakım ekibi — çok görev/hizmet satırı",
  header: "Küçük dükkan, esnaf, yerel hizmet — basit, anlaşılır, teknik olmayan kullanıcı dostu",
  twin: "Stok bazlı işletme, yedek parça, ekipman satışı, depo — SKU/ürün kodu odaklı",
  receipt: "Büyük faturalar, çok kalemli detaylı dökümler — tek sayfaya maksimum bilgi",
  block: "Premium ajanslar, danışmanlar, yaratıcı stüdyolar — güçlü hiyerarşi, kendinden emin",
  dark: "Freelancer, küçük işletme — ödenecek tutar ana odak, net ödeme iletişimi",
  diagonal: "Ajanslar, stüdyolar, güçlü marka kimliği olan modern şirketler",
  stamp: "Modern işletmeler, ajanslar — temiz durum rozeti, büyük tutar vurgusu",
  frame: "Yönetim danışmanları, kurumsal danışmanlar, yüksek değerli B2B — ciddi, üst düzey",
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
  TR: { invoice: "FATURA", proforma: "PROFORMA FATURA", commercial: "TİCARİ FATURA", quote: "TEKLİF", from: "Gönderen", billto: "Alıcı", invno: "Fatura No", issue: "Tarih", due: "Vade", desc: "Açıklama", unit: "Birim", qty: "Adet", price: "Fiyat", amount: "Tutar", subtotal: "Ara Toplam", vat: "KDV %20", total: "GENEL TOPLAM", paid: "Ödenecek", payinfo: "Ödeme", bank: "Banka", notes: "Not", notes_val: "Hizmetler sözleşmeye uygun teslim edilmiştir.", scan: "Ödemek için tarayın", scan_verify: "Doğrulamak için tarayın", reverse: "Tevkifat", exempt: "Muaf", rc_note: "KDV tevkifatı — Madde 196, 2006/112/EC. KDV alıcı tarafından beyan edilecektir.", ex_note: "KDV'den muaf ihracat teslimi.", vkn: "VKN", vatid: "VAT", ref: "Referans", terms: "Şartlar", terms_val: "Ödeme 30 gün içinde yapılmalıdır.", thanks: "Teşekkür ederiz!" },
  EN: { invoice: "INVOICE", proforma: "PROFORMA INVOICE", commercial: "COMMERCIAL INVOICE", quote: "QUOTE", from: "From", billto: "Bill To", invno: "Invoice No", issue: "Date", due: "Due", desc: "Description", unit: "Unit", qty: "Qty", price: "Price", amount: "Amount", subtotal: "Subtotal", vat: "VAT 20%", total: "TOTAL DUE", paid: "Amount Due", payinfo: "Payment", bank: "Bank", notes: "Notes", notes_val: "All services delivered as agreed.", scan: "Scan to pay", scan_verify: "Scan to verify", reverse: "Reverse charge", exempt: "Exempt", rc_note: "VAT reverse charge — Article 196, Directive 2006/112/EC.", ex_note: "VAT-exempt export supply.", vkn: "Tax ID", vatid: "VAT", ref: "Reference", terms: "Terms", terms_val: "Payment due within 30 days.", thanks: "Thank you!" },
  DE: { invoice: "RECHNUNG", proforma: "PROFORMA-RECHNUNG", commercial: "HANDELSRECHNUNG", quote: "ANGEBOT", from: "Von", billto: "Rechnung an", invno: "Rechnungsnr.", issue: "Datum", due: "Fällig", desc: "Beschreibung", unit: "Einheit", qty: "Menge", price: "Preis", amount: "Betrag", subtotal: "Zwischensumme", vat: "MwSt. 19%", total: "GESAMTBETRAG", paid: "Zu zahlen", payinfo: "Zahlung", bank: "Bank", notes: "Anmerkungen", notes_val: "Alle Leistungen wie vereinbart erbracht.", scan: "Zum Bezahlen scannen", scan_verify: "Zum Verifizieren scannen", reverse: "Reverse Charge", exempt: "Steuerfrei", rc_note: "Steuerschuldnerschaft des Leistungsempfängers (§13b UStG).", ex_note: "Steuerfreie Ausfuhrlieferung.", vkn: "St.-Nr.", vatid: "USt-IdNr.", ref: "Referenz", terms: "Bedingungen", terms_val: "Zahlung innerhalb von 30 Tagen.", thanks: "Vielen Dank!" },
  NL: { invoice: "FACTUUR", proforma: "PROFORMAFACTUUR", commercial: "HANDELSFACTUUR", quote: "OFFERTE", from: "Van", billto: "Factuur aan", invno: "Factuurnr.", issue: "Datum", due: "Vervaldatum", desc: "Omschrijving", unit: "Eenheid", qty: "Aantal", price: "Prijs", amount: "Bedrag", subtotal: "Subtotaal", vat: "Btw 21%", total: "TOTAAL", paid: "Te betalen", payinfo: "Betaling", bank: "Bank", notes: "Opmerkingen", notes_val: "Alle diensten zoals afgesproken geleverd.", scan: "Scan om te betalen", scan_verify: "Scan om te verifiëren", reverse: "Btw verlegd", exempt: "Vrijgesteld", rc_note: "Btw verlegd — Artikel 196, Richtlijn 2006/112/EG.", ex_note: "Btw-vrije exportlevering.", vkn: "BTW-nr.", vatid: "Btw-id", ref: "Referentie", terms: "Voorwaarden", terms_val: "Betaling binnen 30 dagen.", thanks: "Bedankt!" },
  FR: { invoice: "FACTURE", proforma: "FACTURE PROFORMA", commercial: "FACTURE COMMERCIALE", quote: "DEVIS", from: "De", billto: "Facturer à", invno: "N° facture", issue: "Date", due: "Échéance", desc: "Description", unit: "Unité", qty: "Qté", price: "Prix", amount: "Montant", subtotal: "Sous-total", vat: "TVA 20%", total: "TOTAL", paid: "Montant dû", payinfo: "Paiement", bank: "Banque", notes: "Remarques", notes_val: "Tous les services livrés comme convenu.", scan: "Scanner pour payer", scan_verify: "Scanner pour vérifier", reverse: "Autoliquidation", exempt: "Exonéré", rc_note: "Autoliquidation de la TVA — Article 196, Directive 2006/112/CE.", ex_note: "Livraison à l'export exonérée de TVA.", vkn: "N° fiscal", vatid: "N° TVA", ref: "Référence", terms: "Conditions", terms_val: "Paiement sous 30 jours.", thanks: "Merci !" },
  ES: { invoice: "FACTURA", proforma: "FACTURA PROFORMA", commercial: "FACTURA COMERCIAL", quote: "PRESUPUESTO", from: "De", billto: "Facturar a", invno: "N° factura", issue: "Fecha", due: "Vencimiento", desc: "Descripción", unit: "Unidad", qty: "Cant.", price: "Precio", amount: "Importe", subtotal: "Subtotal", vat: "IVA 21%", total: "TOTAL", paid: "Importe a pagar", payinfo: "Pago", bank: "Banco", notes: "Notas", notes_val: "Todos los servicios entregados según lo acordado.", scan: "Escanear para pagar", scan_verify: "Escanear para verificar", reverse: "Inv. sujeto pasivo", exempt: "Exento", rc_note: "Inversión del sujeto pasivo — Artículo 196, Directiva 2006/112/CE.", ex_note: "Entrega de exportación exenta de IVA.", vkn: "NIF/CIF", vatid: "N° IVA", ref: "Referencia", terms: "Condiciones", terms_val: "Pago en un plazo de 30 días.", thanks: "¡Gracias!" },
  IT: { invoice: "FATTURA", proforma: "FATTURA PROFORMA", commercial: "FATTURA COMMERCIALE", quote: "PREVENTIVO", from: "Da", billto: "Fatturare a", invno: "N° fattura", issue: "Data", due: "Scadenza", desc: "Descrizione", unit: "Unità", qty: "Qtà", price: "Prezzo", amount: "Importo", subtotal: "Subtotale", vat: "IVA 22%", total: "TOTALE", paid: "Importo dovuto", payinfo: "Pagamento", bank: "Banca", notes: "Note", notes_val: "Tutti i servizi forniti come concordato.", scan: "Scansiona per pagare", scan_verify: "Scansiona per verificare", reverse: "Inversione contabile", exempt: "Esente", rc_note: "Inversione contabile — Articolo 196, Direttiva 2006/112/CE.", ex_note: "Cessione all'esportazione esente IVA.", vkn: "Cod. Fisc.", vatid: "P. IVA", ref: "Riferimento", terms: "Condizioni", terms_val: "Pagamento entro 30 giorni.", thanks: "Grazie!" },
};
