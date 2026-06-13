// Faturalama/abonelik dönem mantığı.
// 2026: erken erişim — temel özellikler ücretsiz (lansman dönemi)
// 2027: abonelik başlar (Free/Starter/Pro/Business)

// Aboneliğin başlayacağı tarih. Bu tarihe kadar erken erişim dönemi.
export const BILLING_START = new Date("2027-01-01T00:00:00Z");

export function isPromoPeriod(now: Date = new Date()): boolean {
  return now < BILLING_START;
}

// Plan limitleri (2027.de aktif olacak). Erken erişim döneminde uygulanmaz.
export type PlanLimits = { invoicesPerMonth: number | "unlimited"; templates: "all" | number };

export function getLimits(plan: string, now: Date = new Date()): PlanLimits {
  if (isPromoPeriod(now)) {
    return { invoicesPerMonth: "unlimited", templates: "all" };
  }
  switch (plan) {
    case "STARTER": return { invoicesPerMonth: 50, templates: "all" };
    case "PRO":
    case "BUSINESS": return { invoicesPerMonth: "unlimited", templates: "all" };
    default: return { invoicesPerMonth: 3, templates: 1 }; // FREE
  }
}

// UI'da gösterilecek promosyon rozeti metni (çok dilli)
export const PROMO_BADGE: Record<string, string> = {
  TR: "2026 Erken Erişim — temel özellikler ücretsiz",
  EN: "2026 Early Access — core features free",
  DE: "2026 Early Access — Kernfunktionen kostenlos",
  NL: "2026 Early Access — kernfuncties gratis",
  FR: "2026 Accès anticipé — fonctions de base gratuites",
  ES: "2026 Acceso anticipado — funciones básicas gratis",
  IT: "2026 Accesso anticipato — funzioni base gratuite",
};
