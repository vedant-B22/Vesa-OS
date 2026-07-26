'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * Retrieves chat history for a specific project.
 */
export async function getChatMessages(projectId: string) {
  return await prisma.message.findMany({
    where: { projectId },
    include: {
      sender: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Persists a new chat message into the database.
 */
export async function saveChatMessage(projectId: string, content: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const message = await prisma.message.create({
    data: {
      projectId,
      content,
      senderId: user.id,
    },
  });

  return { success: true, message };
}
