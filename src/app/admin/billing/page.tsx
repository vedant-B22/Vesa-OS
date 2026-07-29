import { getInvoices, getClients } from '../actions';
import { BillingClient } from './BillingClient';

export const dynamic = 'force-dynamic';

export default async function AdminBillingPage() {
  const [invoices, clients] = await Promise.all([getInvoices(), getClients()]);

  const mappedInvoices = invoices.map((inv) => ({
    id: inv.id,
    clientId: inv.clientId,
    amount: inv.amount,
    status: inv.status,
    dueDate: inv.dueDate,
    createdAt: inv.createdAt,
    client: {
      id: inv.client?.id || '',
      name: inv.client?.name || 'Unknown Client',
    },
    payments: inv.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      status: p.status,
      createdAt: p.createdAt,
    })),
  }));

  const mappedClients = clients.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return <BillingClient initialInvoices={mappedInvoices} clients={mappedClients} />;
}
