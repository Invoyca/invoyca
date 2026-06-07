"use client";
import { useLang } from "@/lib/lang-context";
import { appT } from "@/lib/i18n-app";
import { PageHeader, Card } from "@/components/ui";
import { Plus, Search } from "lucide-react";

const PRODUCTS = [
  { name: "Web Tasarım", unit: "proje", price: "€2.000,00", vat: "%20" },
  { name: "Aylık Bakım", unit: "ay", price: "€150,00", vat: "%20" },
  { name: "Logo Tasarımı", unit: "proje", price: "€500,00", vat: "%20" },
  { name: "Danışmanlık", unit: "saat", price: "€120,00", vat: "%20" },
];

export default function ProductsPage() {
  const { lang } = useLang();
  const L = (tr: string, _en?: string) => appT(lang, tr);
  return (
    <div>
      <PageHeader title={L("Ürünler", "Products")} subtitle={L("Ürün ve hizmet kataloğun.", "Your product & service catalog.")}
        action={<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700"><Plus className="h-4 w-4" /> {L("Yeni Ürün", "New Product")}</button>} />
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input placeholder={L("Ara...", "Search...")} className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400 border-b border-slate-100"><tr>
              <th className="font-medium px-5 py-3">{L("Ürün / Hizmet", "Product / Service")}</th>
              <th className="font-medium px-5 py-3 hidden md:table-cell">{L("Birim", "Unit")}</th>
              <th className="font-medium px-5 py-3 hidden lg:table-cell">{L("KDV", "VAT")}</th>
              <th className="font-medium px-5 py-3 text-right">{L("Fiyat", "Price")}</th>
            </tr></thead>
            <tbody>{PRODUCTS.map((p) => (
              <tr key={p.name} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{p.name}</td>
                <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{p.unit}</td>
                <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{p.vat}</td>
                <td className="px-5 py-3 text-right font-medium">{p.price}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
