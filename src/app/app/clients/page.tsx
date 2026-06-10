// SERVER COMPONENT — müşterileri sunucuda çeker, sayfa dolu gelir.
import { listClients } from "../data-actions";
import ClientsClient from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const res = await listClients().catch(() => ({ ok: false, clients: [] as any[] }));
  const initialClients = res.ok ? (res.clients || []) : [];
  return <ClientsClient initialClients={initialClients} />;
}
