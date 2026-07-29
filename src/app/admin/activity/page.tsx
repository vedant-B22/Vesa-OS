import { getActivityLogs } from '../actions';
import { ActivityClient } from './ActivityClient';

export const dynamic = 'force-dynamic';

export default async function AdminActivityPage() {
  const logs = await getActivityLogs();

  const mappedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    metadata: log.metadata,
    timestamp: log.timestamp,
    user: {
      name: log.user.name,
      role: log.user.role,
      email: log.user.email,
    },
  }));

  return <ActivityClient logs={mappedLogs} />;
}
