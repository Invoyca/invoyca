// Faturalama/abonelik dönem mantığı.
// 2026: herkese ÜCRETSIZ SINIRSIZ (lansman promosyonu)
// 2027: abonelik başlar (Free/Starter/Pro/Business)

// Aboneliğin başlayacağı tarih. Bu tarihe kadar her şey ücretsiz sınırsız.
export const BILLING_START = new Date("2027-01-01T00:00:00Z");

export function isPromoPeriod(now: Date = new Date()): boolean {
  return now < BILLING_START;
}

// Plan limitleri (2027'de aktif olacak). Promosyon döneminde hepsi sınırsız.
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
  TR: "2026 boyunca ücretsiz ve sınırsız",
  EN: "Free & unlimited throughout 2026",
  DE: "2026 kostenlos & unbegrenzt",
  NL: "Heel 2026 gratis & onbeperkt",
  FR: "Gratuit et illimité durant 2026",
  ES: "Gratis e ilimitado durante 2026",
  IT: "Gratis e illimitato per tutto il 2026",
};
