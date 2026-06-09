// Dünya ülkeleri — ISO 3166-1 alpha-2 kodları.
// Ülke ADLARI ayrıca tutulmaz; Intl.DisplayNames ile seçili dile göre otomatik üretilir.
// Böylece 7 dilde (ve fazlası) ülke adı otomatik, ekstra çeviri gerekmez.

export const COUNTRY_CODES = [
  "TR","DE","NL","FR","ES","IT","GB","US","AT","BE","BG","HR","CY","CZ","DK","EE","FI",
  "GR","HU","IE","LV","LT","LU","MT","PL","PT","RO","SK","SI","SE","CH","NO","IS","LI",
  "AL","AD","AM","AZ","BY","BA","GE","KZ","XK","MD","MC","ME","MK","RU","SM","RS","UA","VA",
  "CA","MX","BR","AR","CL","CO","PE","VE","UY","PY","BO","EC","CR","PA","DO","GT","HN","SV","NI","CU","JM","TT",
  "CN","JP","KR","IN","ID","TH","VN","PH","MY","SG","HK","TW","PK","BD","LK","NP","KZ","UZ","AZ","GE","AM",
  "AE","SA","QA","KW","BH","OM","JO","LB","IL","IQ","IR","SY","YE",
  "EG","MA","DZ","TN","LY","ZA","NG","KE","ET","GH","TZ","UG","CI","CM","SN","ZW","ZM","AO","MZ",
  "AU","NZ","FJ","PG",
];

// Seçili dile göre sıralı ülke listesi döndürür: [{ code, name }]
export function getCountries(lang: string): { code: string; name: string }[] {
  // Intl dil kodu (TR→tr, EN→en ...)
  const localeMap: Record<string, string> = {
    TR: "tr", EN: "en", DE: "de", NL: "nl", FR: "fr", ES: "es", IT: "it",
  };
  const locale = localeMap[lang] || "en";

  let display: Intl.DisplayNames;
  try {
    display = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    display = new Intl.DisplayNames(["en"], { type: "region" });
  }

  // Benzersiz kodlar (listede tekrar olabilir)
  const unique = Array.from(new Set(COUNTRY_CODES));

  const list = unique.map((code) => {
    let name = code;
    try { name = display.of(code) || code; } catch { name = code; }
    return { code, name };
  });

  // İsme göre alfabetik (seçili dilde)
  list.sort((a, b) => a.name.localeCompare(b.name, locale));
  return list;
}
