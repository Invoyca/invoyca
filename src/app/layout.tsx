import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoyca — Dünyaya fatura kesmenin en kolay yolu",
  description: "Uluslararası, çok dilli, çok para birimli faturalama platformu.",
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
