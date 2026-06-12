import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingClient from "@/components/landing/LandingClient";
import { LANDING_SEO, LOCALES, SITE_URL, type Locale } from "@/lib/landing-seo";

// Statik olarak tüm dilleri üret (SEO için her dil ayrı sayfa)
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Her dil için ayrı title/description + hreflang alternatifleri
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const seo = LANDING_SEO[locale as Locale];
  if (!seo) return {};

  // hreflang: her dil için alternatif URL
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${SITE_URL}/${l}`;
  languages["x-default"] = `${SITE_URL}/en`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${SITE_URL}/${locale}`,
      siteName: "Invoyca",
      locale: seo.ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as Locale)) notFound();
  return <LandingClient locale={locale} />;
}
