// SERVER COMPONENT — fatura + müşteri verisini sunucuda çeker, dashboard dolu gelir.
// Karşılama adı/guest durumu client tarafında (tarayıcı oturumu) belirlenir.
import { listInvoices } from "../invoices/actions";
import { listClients } from "../data-actions";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // İki sorguyu paralel çek (daha hızlı)
  const [invRes, cliRes] = await Promise.all([
    listInvoices().catch(() => ({ ok: false, invoices: [] as any[] })),
    listClients().catch(() => ({ ok: false, clients: [] as any[] })),
  ]);
  const initialInvoices = invRes.ok ? (invRes.invoices || []) : [];
  const clientCount = cliRes.ok ? (cliRes.clients || []).length : 0;
  return <DashboardClient initialInvoices={initialInvoices} clientCount={clientCount} />;
}
