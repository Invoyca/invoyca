// SERVER COMPONENT — müşteri + faturalarını sunucuda çeker, sahiplik kontrollü.
import { notFound } from "next/navigation";
import { getClientDetail } from "../../data-actions";
import ClientDetailClient from "./ClientDetailClient";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getClientDetail(id).catch(() => ({ ok: false, client: null, invoices: [] as any[] }));
  if (!res.ok || !res.client) notFound();

  return <ClientDetailClient client={res.client as any} invoices={res.invoices || []} />;
}
