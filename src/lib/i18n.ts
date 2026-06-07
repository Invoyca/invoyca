// Invoyca çok dil sistemi
// 7 dil: TR, EN, DE, NL, FR, ES, IT
// Kullanım: const t = useTranslations(); t("nav_dashboard")

export type Lang = "TR" | "EN" | "DE" | "NL" | "FR" | "ES" | "IT";

export const LANGS: { code: Lang; name: string }[] = [
  { code: "TR", name: "Türkçe" },
  { code: "EN", name: "English" },
  { code: "DE", name: "Deutsch" },
  { code: "NL", name: "Nederlands" },
  { code: "FR", name: "Français" },
  { code: "ES", name: "Español" },
  { code: "IT", name: "Italiano" },
];

// Sloganlar (transcreation — her dilde özgün, birebir çeviri değil)
export const SLOGANS: Record<Lang, string> = {
  TR: "Dünyaya fatura kesmenin en kolay yolu",
  EN: "Invoicing without borders",
  DE: "Rechnungen, die jede Sprache sprechen",
  NL: "Factureren zonder grenzen",
  FR: "La facture qui parle toutes les langues",
  ES: "Facturas que hablan el idioma de tu cliente",
  IT: "Fatture senza confini",
};

type Dict = Record<string, string>;

// Ortak arayüz metinleri (sidebar, topbar, genel)
const COMMON: Record<Lang, Dict> = {
  TR: {
    nav_dashboard: "Dashboard", nav_invoices: "Faturalar", nav_quotes: "Teklifler",
    nav_clients: "Müşteriler", nav_products: "Ürünler", nav_recurring: "Tekrar Edenler",
    nav_reports: "Raporlar", nav_templates: "Şablonlar", nav_settings: "Ayarlar",
    free_plan: "Sınırsız Erişim", plan_usage: "2026 boyunca ücretsiz ve sınırsız", upgrade: "Tüm özellikler açık",
    new_invoice: "Yeni Fatura", search: "Ara...", logout: "Çıkış Yap",
  },
  EN: {
    nav_dashboard: "Dashboard", nav_invoices: "Invoices", nav_quotes: "Quotes",
    nav_clients: "Clients", nav_products: "Products", nav_recurring: "Recurring",
    nav_reports: "Reports", nav_templates: "Templates", nav_settings: "Settings",
    free_plan: "Unlimited Access", plan_usage: "Free & unlimited throughout 2026", upgrade: "All features unlocked",
    new_invoice: "New Invoice", search: "Search...", logout: "Log out",
  },
  DE: {
    nav_dashboard: "Dashboard", nav_invoices: "Rechnungen", nav_quotes: "Angebote",
    nav_clients: "Kunden", nav_products: "Produkte", nav_recurring: "Wiederkehrend",
    nav_reports: "Berichte", nav_templates: "Vorlagen", nav_settings: "Einstellungen",
    free_plan: "Unbegrenzt", plan_usage: "2026 kostenlos & unbegrenzt", upgrade: "Alle Funktionen frei",
    new_invoice: "Neue Rechnung", search: "Suchen...", logout: "Abmelden",
  },
  NL: {
    nav_dashboard: "Dashboard", nav_invoices: "Facturen", nav_quotes: "Offertes",
    nav_clients: "Klanten", nav_products: "Producten", nav_recurring: "Terugkerend",
    nav_reports: "Rapporten", nav_templates: "Sjablonen", nav_settings: "Instellingen",
    free_plan: "Onbeperkt", plan_usage: "Heel 2026 gratis & onbeperkt", upgrade: "Alle functies vrij",
    new_invoice: "Nieuwe factuur", search: "Zoeken...", logout: "Uitloggen",
  },
  FR: {
    nav_dashboard: "Tableau de bord", nav_invoices: "Factures", nav_quotes: "Devis",
    nav_clients: "Clients", nav_products: "Produits", nav_recurring: "Récurrents",
    nav_reports: "Rapports", nav_templates: "Modèles", nav_settings: "Paramètres",
    free_plan: "Accès illimité", plan_usage: "Gratuit et illimité durant 2026", upgrade: "Toutes fonctions ouvertes",
    new_invoice: "Nouvelle facture", search: "Rechercher...", logout: "Déconnexion",
  },
  ES: {
    nav_dashboard: "Panel", nav_invoices: "Facturas", nav_quotes: "Presupuestos",
    nav_clients: "Clientes", nav_products: "Productos", nav_recurring: "Recurrentes",
    nav_reports: "Informes", nav_templates: "Plantillas", nav_settings: "Ajustes",
    free_plan: "Acceso ilimitado", plan_usage: "Gratis e ilimitado durante 2026", upgrade: "Todo desbloqueado",
    new_invoice: "Nueva factura", search: "Buscar...", logout: "Cerrar sesión",
  },
  IT: {
    nav_dashboard: "Dashboard", nav_invoices: "Fatture", nav_quotes: "Preventivi",
    nav_clients: "Clienti", nav_products: "Prodotti", nav_recurring: "Ricorrenti",
    nav_reports: "Report", nav_templates: "Modelli", nav_settings: "Impostazioni",
    free_plan: "Accesso illimitato", plan_usage: "Gratis e illimitato per tutto il 2026", upgrade: "Tutto sbloccato",
    new_invoice: "Nuova fattura", search: "Cerca...", logout: "Esci",
  },
};

export function getDict(lang: Lang): Dict {
  return COMMON[lang] || COMMON.EN;
}

// Basit çeviri fonksiyonu
export function translate(lang: Lang, key: string): string {
  const dict = getDict(lang);
  return dict[key] ?? key;
}
