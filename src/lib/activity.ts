import { prisma } from './db';
import { getCurrentUser } from './auth';

/**
 * Creates an activity log entry for the current user.
 * Silently catches errors to ensure business logic never fails due to log write issues.
 */
export async function logActivity(action: string, entity: string, metadata?: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn(`Unauthenticated activity log attempt: ${action} on ${entity}`);
      return;
    }

    const metadataStr = metadata ? JSON.stringify(metadata) : null;

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        entity,
        metadata: metadataStr,
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
