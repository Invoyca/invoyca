import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoyca — Yurtdışına İş Yapanlar İçin Profesyonel Fatura Oluşturucu",
  description: "Invoyca ile çok dilli PDF faturalar oluştur, EUR/USD/GBP/TRY ile çalış, reverse charge ve ödeme notlarını kolayca ekle.",
  keywords: ["fatura oluşturucu", "uluslararası fatura", "invoice generator", "PDF fatura", "reverse charge", "freelancer fatura"],
  openGraph: {
    title: "Invoyca — Professional International Invoice Generator",
    description: "Create multilingual PDF invoices, work with EUR/USD/GBP/TRY, and add reverse charge, payment and tax notes easily.",
    type: "website",
    siteName: "Invoyca",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoyca — Professional International Invoice Generator",
    description: "Create multilingual PDF invoices for international clients. 7 languages, 4 currencies, 25 templates.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
