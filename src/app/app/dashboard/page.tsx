// SERVER COMPONENT — fatura verisini sunucuda çeker, dashboard dolu gelir.
// Karşılama adı/guest durumu client tarafında (tarayıcı oturumu) belirlenir.
import { listInvoices } from "../invoices/actions";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const res = await listInvoices().catch(() => ({ ok: false, invoices: [] as any[] }));
  const initialInvoices = res.ok ? (res.invoices || []) : [];
  return <DashboardClient initialInvoices={initialInvoices} />;
}
