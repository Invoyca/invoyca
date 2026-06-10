// SERVER COMPONENT — ürünleri sunucuda çeker.
import { listProducts } from "../data-actions";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const res = await listProducts().catch(() => ({ ok: false, products: [] as any[] }));
  const initialProducts = res.ok ? (res.products || []) : [];
  return <ProductsClient initialProducts={initialProducts} />;
}
