'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import { ProjectStatus, DeliverableStatus, Priority } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

// Initialize Supabase Admin Client (requires Service Role Key)
const getSupabaseAdmin = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing from env variables.');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/* --- CLIENT MANAGEMENT --- */

export async function getClients() {
  return await prisma.client.findMany({
    include: {
      users: true,
      projects: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createClientRecord(formData: FormData) {
  const name = formData.get('name') as string;
  const primaryColor = formData.get('primaryColor') as string || '#0f172a';
  const secondaryColor = formData.get('secondaryColor') as string || '#3b82f6';
  const logoUrl = formData.get('logoUrl') as string || null;

  if (!name) return { error: 'Client name is required.' };

  await prisma.client.create({
    data: { name, primaryColor, secondaryColor, logoUrl },
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function updateClientRecord(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const primaryColor = formData.get('primaryColor') as string;
  const secondaryColor = formData.get('secondaryColor') as string;
  const logoUrl = formData.get('logoUrl') as string;

  await prisma.client.update({
    where: { id },
    data: { name, primaryColor, secondaryColor, logoUrl: logoUrl || null },
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function deleteClientRecord(id: string): Promise<void> {
  // First delete associated users from Supabase if possible
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const users = await prisma.user.findMany({ where: { clientId: id } });
    for (const u of users) {
      await supabaseAdmin.auth.admin.deleteUser(u.id);
    }
  } catch (err) {
    console.error('Failed to delete client users from Supabase Auth:', err);
  }

  await prisma.client.delete({ where: { id } });
  revalidatePath('/admin');
}

/* --- CLIENT USER ONBOARDING --- */

export async function onboardClientUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const clientId = formData.get('clientId') as string;

  if (!name || !email || !password || !clientId) {
    return { error: 'All fields are required.' };
  }

  try {
    let userId = '';

    try {
      const supabaseAdmin = getSupabaseAdmin();
      
      // 1. Try to create User in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'CLIENT', clientId, name },
      });

      if (authError) return { error: authError.message };
      userId = authData.user.id;
    } catch (supabaseErr: any) {
      if (
        supabaseErr.message?.includes('fetch failed') ||
        supabaseErr.message?.includes('resolve') ||
        supabaseErr.message?.includes('network')
      ) {
        console.warn('Supabase offline during onboarding. Registering client user locally in database.');
        // Generate fallback ID
        userId = 'local-client-' + Math.random().toString(36).substring(2, 10);
      } else {
        throw supabaseErr;
      }
    }

    // Hash the client's password
    const passwordHash = hashPassword(password);

    // 2. Create User in our Prisma Database
    await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        role: 'CLIENT',
        clientId,
        passwordHash,
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An error occurred during onboarding.' };
  }
}

/* --- PROJECT MANAGEMENT --- */

export async function getProjects() {
  return await prisma.project.findMany({
    include: {
      client: true,
      deliverables: true,
      files: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProjectRecord(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string || '';
  const clientId = formData.get('clientId') as string;
  const status = (formData.get('status') as ProjectStatus) || ProjectStatus.IN_PROGRESS;
  const progress = parseInt(formData.get('progress') as string || '0', 10);
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;

  if (!name || !clientId) return { error: 'Project name and client are required.' };

  await prisma.project.create({
    data: {
      name,
      description,
      clientId,
      status,
      progress,
      startDate: startDateStr ? new Date(startDateStr) : null,
      endDate: endDateStr ? new Date(endDateStr) : null,
    },
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function updateProjectRecord(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as ProjectStatus;
  const progress = parseInt(formData.get('progress') as string || '0', 10);
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;

  await prisma.project.update({
    where: { id },
    data: {
      name,
      description,
      status,
      progress,
      startDate: startDateStr ? new Date(startDateStr) : null,
      endDate: endDateStr ? new Date(endDateStr) : null,
    },
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function deleteProjectRecord(id: string): Promise<void> {
  await prisma.project.delete({ where: { id } });
  revalidatePath('/admin');
}

/* --- DELIVERABLE MANAGEMENT --- */

export async function createDeliverableRecord(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string || '';
  const fileUrl = formData.get('fileUrl') as string;
  const fileType = formData.get('fileType') as string || 'link';

  if (!projectId || !name || !fileUrl) {
    return { error: 'Project, name, and file URL/Path are required.' };
  }

  await prisma.deliverable.create({
    data: {
      projectId,
      name,
      description,
      fileUrl,
      fileType,
      status: DeliverableStatus.PENDING_REVIEW,
      version: 1,
    },
  });

  revalidatePath('/admin');
  return { success: true };
}

/* --- MEETING MANAGEMENT --- */

export async function getMeetings() {
  return await prisma.meeting.findMany({
    include: {
      client: true,
      project: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function createMeetingRecord(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string || '';
  const clientId = formData.get('clientId') as string;
  const projectId = formData.get('projectId') as string || null;
  const scheduledAtStr = formData.get('scheduledAt') as string;
  const googleMeetLink = formData.get('googleMeetLink') as string || '';

  if (!title || !clientId || !scheduledAtStr) {
    return { error: 'Title, client, and schedule date are required.' };
  }

  await prisma.meeting.create({
    data: {
      title,
      description,
      clientId,
      projectId: projectId || null,
      scheduledAt: new Date(scheduledAtStr),
      googleMeetLink,
    },
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function deleteMeetingRecord(id: string): Promise<void> {
  await prisma.meeting.delete({ where: { id } });
  revalidatePath('/admin');
}
