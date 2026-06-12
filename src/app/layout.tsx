import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://invoyca.com"),
  title: {
    default: "Invoyca — Professional International Invoice Generator",
    template: "%s",
  },
  description: "Create multilingual PDF invoices for international clients. 7 languages, 4 currencies, 25 templates.",
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
