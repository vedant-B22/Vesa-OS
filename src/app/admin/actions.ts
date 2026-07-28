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
  try {
    return await prisma.client.findMany({
      include: {
        users: true,
        projects: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching clients:', err);
    return [];
  }
}

export async function createClientRecord(formData: FormData) {
  try {
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
  } catch (err: any) {
    console.error("Error in createClientRecord:", err);
    return { error: err.message || 'Failed to create client.' };
  }
}

export async function updateClientRecord(id: string, formData: FormData) {
  try {
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
  } catch (err: any) {
    console.error("Error in updateClientRecord:", err);
    return { error: err.message || 'Failed to update client.' };
  }
}

export async function deleteClientRecord(id: string) {
  try {
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
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteClientRecord:", err);
    return { error: err.message || 'Failed to delete client.' };
  }
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address format.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  try {
    // Check if user already exists in local DB
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return { error: 'An account with this email address already exists.' };
    }

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

      if (authError) {
        // Handle database offline or network errors by falling back to local creation
        if (
          authError.message.includes('fetch failed') ||
          authError.message.includes('network') ||
          authError.message.includes('resolve') ||
          authError.message.includes('AuthRetryableFetchError')
        ) {
          console.warn('Supabase offline/paused during onboarding (returned in error). Registering client user locally.');
          userId = 'local-client-' + Math.random().toString(36).substring(2, 10);
        } else {
          return { error: authError.message };
        }
      } else if (authData?.user) {
        userId = authData.user.id;
      }
    } catch (supabaseErr: any) {
      if (
        supabaseErr.message?.includes('fetch failed') ||
        supabaseErr.message?.includes('resolve') ||
        supabaseErr.message?.includes('network')
      ) {
        console.warn('Supabase offline during onboarding (thrown error). Registering client user locally in database.');
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
    console.error('Error in onboardClientUser:', err);
    return { error: err.message || 'An error occurred during onboarding.' };
  }
}

/* --- PROJECT MANAGEMENT --- */

export async function getProjects() {
  try {
    return await prisma.project.findMany({
      include: {
        client: true,
        deliverables: true,
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching projects:', err);
    return [];
  }
}

export async function createProjectRecord(formData: FormData) {
  try {
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
  } catch (err: any) {
    console.error("Error in createProjectRecord:", err);
    return { error: err.message || 'Failed to create project.' };
  }
}

export async function updateProjectRecord(id: string, formData: FormData) {
  try {
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
  } catch (err: any) {
    console.error("Error in updateProjectRecord:", err);
    return { error: err.message || 'Failed to update project.' };
  }
}

export async function deleteProjectRecord(id: string): Promise<void> {
  try {
    await prisma.project.delete({ where: { id } });
    revalidatePath('/admin');
  } catch (err: any) {
    console.error("Error in deleteProjectRecord:", err);
  }
}

/* --- DELIVERABLE MANAGEMENT --- */

export async function createDeliverableRecord(formData: FormData) {
  try {
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
  } catch (err: any) {
    console.error("Error in createDeliverableRecord:", err);
    return { error: err.message || 'Failed to create deliverable.' };
  }
}

/* --- MEETING MANAGEMENT --- */

export async function getMeetings() {
  try {
    return await prisma.meeting.findMany({
      include: {
        client: true,
        project: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  } catch (err) {
    console.error('Error fetching meetings:', err);
    return [];
  }
}

export async function createMeetingRecord(formData: FormData) {
  try {
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
  } catch (err: any) {
    console.error("Error in createMeetingRecord:", err);
    return { error: err.message || 'Failed to create meeting.' };
  }
}

export async function deleteMeetingRecord(id: string): Promise<void> {
  try {
    await prisma.meeting.delete({ where: { id } });
    revalidatePath('/admin');
  } catch (err: any) {
    console.error("Error in deleteMeetingRecord:", err);
  }
}
