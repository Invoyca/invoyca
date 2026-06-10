// SERVER COMPONENT — veriyi sunucuda çeker, sayfa render edilmeden hazır olur.
// Böylece "önce boş sonra dolu" titremesi olmaz; içerik dolu gelir.
import { listInvoices } from "./actions";
import InvoicesClient from "./InvoicesClient";

// Her istekte taze veri (build sırasında değil, çalışma zamanında çekilir)
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const res = await listInvoices().catch(() => ({ ok: false, invoices: [] as any[] }));
  const initialInvoices = res.ok ? (res.invoices || []) : [];
  return <InvoicesClient initialInvoices={initialInvoices} />;
}
