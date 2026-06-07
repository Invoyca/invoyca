// Fatura hesaplama mantığı — saf fonksiyonlar (test edilebilir, UI'dan bağımsız)

export type LineItem = {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // yüzde, örn. 20
};

export type TaxMode = "normal" | "reverse" | "exempt";

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  vatTotal: number;
  total: number;
};

// Tek kalem tutarı (KDV hariç)
export function lineAmount(item: LineItem): number {
  return round2(item.quantity * item.unitPrice);
}

// Fatura toplamları.
// KDV her kalem için ayrı hesaplanır ve ayrı ayrı yuvarlanır (kuruş tutarlılığı).
// İndirim, KDV matrahına orantısal yansıtılır (kalem bazında), böylece karışık
// KDV oranlı + indirimli faturalarda resmi belgelerle uyumlu kalır.
export function calcTotals(items: LineItem[], discount: number, taxMode: TaxMode): InvoiceTotals {
  const subtotal = round2(items.reduce((sum, it) => sum + lineAmount(it), 0));
  const discountClamped = Math.max(0, Math.min(discount, subtotal));
  const ratio = subtotal > 0 ? (subtotal - discountClamped) / subtotal : 0;

  let vatTotal = 0;
  if (taxMode === "normal") {
    // Her kalem: (kalem tutarı × indirim oranı) × kalemin KDV oranı, kalem bazında yuvarla
    vatTotal = round2(
      items.reduce((sum, it) => {
        const base = round2(lineAmount(it) * ratio);
        return sum + round2(base * (it.vatRate / 100));
      }, 0)
    );
  }
  // reverse charge ve exempt: KDV = 0

  const afterDiscount = round2(subtotal - discountClamped);
  const total = round2(afterDiscount + vatTotal);
  return { subtotal, discount: round2(discountClamped), vatTotal, total };
}

// Para formatı — her para birimi kendi yerel biçimiyle gösterilir.
// EUR → 1.234,56 (de-DE) · USD → 1,234.56 (en-US) · GBP → 1,234.56 (en-GB) · TRY → 1.234,56 (tr-TR)
export function formatMoney(amount: number, currency: string): string {
  const locales: Record<string, string> = {
    EUR: "de-DE", USD: "en-US", GBP: "en-GB", TRY: "tr-TR",
  };
  const locale = locales[currency] || "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Bilinmeyen para birimi — sembolsüz sayı
    return amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
