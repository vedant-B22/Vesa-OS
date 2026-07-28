import { getClients } from '../actions';
import AdminClientsClient from './AdminClientsClient';

export const dynamic = 'force-dynamic';

export default async function AdminClientsPage() {
  const clients = await getClients();

  return <AdminClientsClient initialClients={clients} />;
}
