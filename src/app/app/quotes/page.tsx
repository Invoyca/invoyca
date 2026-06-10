// SERVER COMPONENT — teklifleri sunucuda çeker.
import { listInvoices } from "../invoices/actions";
import QuotesClient from "./QuotesClient";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const res = await listInvoices("QUOTE").catch(() => ({ ok: false, invoices: [] as any[] }));
  const initialQuotes = res.ok ? (res.invoices || []) : [];
  return <QuotesClient initialQuotes={initialQuotes} />;
}
