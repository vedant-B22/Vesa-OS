'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Retrieve user record from the database to identify name and role
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    throw new Error('User record not found');
  }

  const message = await prisma.message.create({
    data: {
      projectId,
      senderId: user.id,
      content,
    },
    include: {
      sender: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  return { success: true, message };
}
