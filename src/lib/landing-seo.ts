// Her dil (locale) için SEO başlık/açıklama/anahtar kelimeler.
// Route bazlı i18n için /[locale]/page.tsx generateMetadata burada kullanır.

export const LOCALES = ["tr", "en", "de", "nl", "fr", "es", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const SITE_URL = "https://invoyca.com";

type Seo = { title: string; description: string; keywords: string[]; ogLocale: string };

export const LANDING_SEO: Record<Locale, Seo> = {
  tr: {
    title: "Invoyca — Yurt Dışına Fatura Kesenler İçin Fatura Oluşturucu",
    description: "Çok dilli profesyonel PDF faturalar oluştur. EUR/USD/GBP/TRY ile çalış, reverse charge ve ödeme notlarını kolayca ekle. 2026 erken erişim ücretsiz.",
    keywords: ["fatura oluşturucu", "yurt dışı fatura", "uluslararası fatura", "PDF fatura", "reverse charge fatura", "freelancer fatura", "ihracat faturası"],
    ogLocale: "tr_TR",
  },
  en: {
    title: "Invoyca — Invoice Generator for International Clients",
    description: "Create professional multilingual PDF invoices. Work with EUR/USD/GBP/TRY and add reverse charge, payment and tax notes easily. Free during 2026 early access.",
    keywords: ["invoice generator", "international invoice", "PDF invoice", "reverse charge invoice", "freelancer invoice", "invoice for foreign clients"],
    ogLocale: "en_US",
  },
  de: {
    title: "Invoyca — Rechnung erstellen für internationale Kunden",
    description: "Erstelle professionelle mehrsprachige PDF-Rechnungen. Arbeite mit EUR/USD/GBP/TRY und füge Reverse-Charge-, Zahlungs- und Steuernotizen einfach hinzu.",
    keywords: ["rechnung erstellen", "rechnung schreiben", "internationale rechnung", "PDF rechnung", "reverse charge rechnung", "freelancer rechnung"],
    ogLocale: "de_DE",
  },
  nl: {
    title: "Invoyca — Factuur maken voor internationale klanten",
    description: "Maak professionele meertalige PDF-facturen. Werk met EUR/USD/GBP/TRY en voeg eenvoudig btw-verlegging, betaling en notities toe.",
    keywords: ["factuur maken", "factuur opstellen", "internationale factuur", "PDF factuur", "btw verlegging factuur", "freelance factuur"],
    ogLocale: "nl_NL",
  },
  fr: {
    title: "Invoyca — Créateur de factures pour clients internationaux",
    description: "Créez des factures PDF professionnelles et multilingues. Travaillez en EUR/USD/GBP/TRY et ajoutez facilement TVA, autoliquidation et notes de paiement.",
    keywords: ["créer une facture", "facture internationale", "facture PDF", "facture autoliquidation", "facture freelance", "générateur de factures"],
    ogLocale: "fr_FR",
  },
  es: {
    title: "Invoyca — Generador de facturas para clientes internacionales",
    description: "Crea facturas PDF profesionales y multilingües. Trabaja con EUR/USD/GBP/TRY y añade IVA, inversión del sujeto pasivo y notas de pago fácilmente.",
    keywords: ["crear factura", "generador de facturas", "factura internacional", "factura PDF", "factura inversión sujeto pasivo", "factura freelance"],
    ogLocale: "es_ES",
  },
  it: {
    title: "Invoyca — Generatore di fatture per clienti internazionali",
    description: "Crea fatture PDF professionali e multilingue. Lavora con EUR/USD/GBP/TRY e aggiungi facilmente IVA, inversione contabile e note di pagamento.",
    keywords: ["creare fattura", "generatore di fatture", "fattura internazionale", "fattura PDF", "fattura inversione contabile", "fattura freelance"],
    ogLocale: "it_IT",
  },
};
