import { getProjects, getClients } from '../actions';
import { AdminProjectsClient } from './AdminProjectsClient';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);

  // Map database projects to component typing structures
  const mappedProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    progress: p.progress,
    startDate: p.startDate,
    endDate: p.endDate,
    client: {
      id: p.client.id,
      name: p.client.name,
    },
    tasks: p.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      isCompleted: t.isCompleted,
      priority: t.priority,
      dueDate: t.dueDate,
    })),
  }));

  const mappedClients = clients.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return <AdminProjectsClient initialProjects={mappedProjects} clients={mappedClients} />;
}
