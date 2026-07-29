import { getAnalyticsData } from '../actions';
import { AnalyticsClient } from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  const mappedActivity = data.recentActivity.map((act) => ({
    id: act.id,
    action: act.action,
    entity: act.entity,
    timestamp: act.timestamp,
    user: {
      name: act.user?.name || 'System',
      role: act.user?.role || 'SYSTEM',
    },
  }));

  return (
    <AnalyticsClient
      data={{
        ...data,
        recentActivity: mappedActivity,
      }}
    />
  );
}
