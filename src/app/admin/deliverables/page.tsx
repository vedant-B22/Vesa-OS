import { getProjects } from '../actions';
import { prisma } from '@/lib/db';
import AdminDeliverablesClient from './AdminDeliverablesClient';

export const dynamic = 'force-dynamic';

export default async function AdminDeliverablesPage() {
  const [projects, deliverables] = await Promise.all([
    getProjects(),
    prisma.deliverable.findMany({
      include: {
        project: {
          include: { client: true },
        },
        revisionRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <AdminDeliverablesClient
      initialDeliverables={deliverables}
      projects={projects}
    />
  );
}
