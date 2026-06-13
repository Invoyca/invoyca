// SERVER COMPONENT — fatura + müşteri + ürün + şirket verisini sunucuda çeker.
// Yeni kullanıcı (fatura yok) için onboarding, aktif kullanıcı için operasyon paneli gösterir.
import { listInvoices } from "../invoices/actions";
import { listClients, listProducts, getAccountInfo } from "../data-actions";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Sorguları paralel çek (daha hızlı)
  const [invRes, cliRes, prodRes, accRes] = await Promise.all([
    listInvoices().catch(() => ({ ok: false, invoices: [] as any[] })),
    listClients().catch(() => ({ ok: false, clients: [] as any[] })),
    listProducts().catch(() => ({ ok: false, products: [] as any[] })),
    getAccountInfo().catch(() => ({ ok: false } as any)),
  ]);
  const initialInvoices = invRes.ok ? (invRes.invoices || []) : [];
  const clientCount = cliRes.ok ? (cliRes.clients || []).length : 0;
  const productCount = (prodRes as any).ok ? ((prodRes as any).products || []).length : 0;
  // Şirket bilgisi "tamamlandı" sayılır: ad + adres dolu
  const company = (accRes as any).ok ? (accRes as any).company : null;
  const companyComplete = !!(company && company.name && company.address);

  return (
    <DashboardClient
      initialInvoices={initialInvoices}
      clientCount={clientCount}
      productCount={productCount}
      companyComplete={companyComplete}
    />
  );
}
