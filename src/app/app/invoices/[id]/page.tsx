// SERVER COMPONENT — fatura detayını + geçmişini sunucuda çeker, sahiplik kontrollü.
import { notFound } from "next/navigation";
import { getInvoice, getInvoiceHistory } from "../actions";
import InvoiceDetailClient from "./InvoiceDetailClient";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invRes, histRes] = await Promise.all([
    getInvoice(id).catch(() => ({ ok: false, invoice: null })),
    getInvoiceHistory(id).catch(() => ({ ok: false, events: [] as any[] })),
  ]);
  if (!invRes.ok || !invRes.invoice) notFound();

  return (
    <InvoiceDetailClient
      invoice={invRes.invoice as any}
      history={histRes.ok ? (histRes.events || []) : []}
    />
  );
}
