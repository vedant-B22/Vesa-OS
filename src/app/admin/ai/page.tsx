import { getProjects, getClients } from '../actions';
import { AIWorkspaceClient } from './AIWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function AdminAIPage() {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);

  const mappedProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const mappedClients = clients.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return <AIWorkspaceClient projects={mappedProjects} clients={mappedClients} />;
}
