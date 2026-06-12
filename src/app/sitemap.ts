import type { MetadataRoute } from "next";
import { LOCALES, SITE_URL } from "@/lib/landing-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Her dil sayfası + hreflang alternatifleri
  const localePages: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: locale === "en" ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}`])),
    },
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...localePages, ...staticPages];
}
