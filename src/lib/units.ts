// Fatura kalemi birimleri — kod-bazlı, 7 dilde.
// Veride birim KODU saklanır (örn. "piece"), faturada seçilen DİLE göre gösterilir.
// Böylece İngilizce kesilen faturada "adet" yerine "pcs" görünür.

export type UnitCode =
  | "piece" | "hour" | "day" | "week" | "month" | "year"
  | "service" | "project" | "kg" | "liter" | "meter" | "m2" | "license" | "user";

// Birim kodu → 7 dilde etiket
export const UNIT_LABELS: Record<UnitCode, Record<string, string>> = {
  piece:   { TR: "adet",    EN: "pcs",      DE: "Stück",    NL: "stuks",    FR: "pièce",    ES: "ud.",      IT: "pz" },
  hour:    { TR: "saat",    EN: "hour",     DE: "Std.",     NL: "uur",      FR: "heure",    ES: "hora",     IT: "ora" },
  day:     { TR: "gün",     EN: "day",      DE: "Tag",      NL: "dag",      FR: "jour",     ES: "día",      IT: "giorno" },
  week:    { TR: "hafta",   EN: "week",     DE: "Woche",    NL: "week",     FR: "semaine",  ES: "semana",   IT: "settimana" },
  month:   { TR: "ay",      EN: "month",    DE: "Monat",    NL: "maand",    FR: "mois",     ES: "mes",      IT: "mese" },
  year:    { TR: "yıl",     EN: "year",     DE: "Jahr",     NL: "jaar",     FR: "an",       ES: "año",      IT: "anno" },
  service: { TR: "hizmet",  EN: "service",  DE: "Leistung", NL: "dienst",   FR: "service",  ES: "servicio", IT: "servizio" },
  project: { TR: "proje",   EN: "project",  DE: "Projekt",  NL: "project",  FR: "projet",   ES: "proyecto", IT: "progetto" },
  kg:      { TR: "kg",      EN: "kg",       DE: "kg",       NL: "kg",       FR: "kg",       ES: "kg",       IT: "kg" },
  liter:   { TR: "litre",   EN: "liter",    DE: "Liter",    NL: "liter",    FR: "litre",    ES: "litro",    IT: "litro" },
  meter:   { TR: "metre",   EN: "meter",    DE: "Meter",    NL: "meter",    FR: "mètre",    ES: "metro",    IT: "metro" },
  m2:      { TR: "m²",      EN: "m²",       DE: "m²",       NL: "m²",       FR: "m²",       ES: "m²",       IT: "m²" },
  license: { TR: "lisans",  EN: "license",  DE: "Lizenz",   NL: "licentie", FR: "licence",  ES: "licencia", IT: "licenza" },
  user:    { TR: "kullanıcı",EN: "user",    DE: "Nutzer",   NL: "gebruiker",FR: "utilisateur",ES: "usuario",IT: "utente" },
};

// Editörde dropdown sırası
export const UNIT_ORDER: UnitCode[] = [
  "piece", "hour", "day", "week", "month", "year",
  "service", "project", "license", "user", "kg", "liter", "meter", "m2",
];

// Bir birim kodunu seçilen dilde göster. Bilinmeyen/serbest metin ise olduğu gibi döndür.
export function unitLabel(code: string, lang: string): string {
  const u = UNIT_LABELS[code as UnitCode];
  if (u) return u[lang] || u.EN;
  return code; // eski/serbest girilmiş birimler için geriye dönük uyumluluk
}

// Eski Türkçe serbest metin birimleri koda çevir (geriye dönük uyumluluk / göç)
export function normalizeUnit(raw: string): string {
  const map: Record<string, UnitCode> = {
    "adet": "piece", "saat": "hour", "gün": "day", "gun": "day", "hafta": "week",
    "ay": "month", "yıl": "year", "yil": "year", "hizmet": "service", "proje": "project",
    "litre": "liter", "metre": "meter", "lisans": "license", "kullanıcı": "user",
  };
  return map[raw?.toLowerCase?.()] || raw || "piece";
}
