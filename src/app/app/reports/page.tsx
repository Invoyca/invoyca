// SERVER COMPONENT — rapor verisini sunucuda çeker.
import { listInvoices } from "../invoices/actions";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const res = await listInvoices().catch(() => ({ ok: false, invoices: [] as any[] }));
  const initialInvoices = res.ok ? (res.invoices || []) : [];
  return <ReportsClient initialInvoices={initialInvoices} />;
}
