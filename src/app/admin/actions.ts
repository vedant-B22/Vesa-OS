'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import { ProjectStatus, DeliverableStatus, Priority, InvoiceStatus, Role } from '@prisma/client';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

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

    const client = await prisma.client.create({
      data: { name, primaryColor, secondaryColor, logoUrl },
    });

    await logActivity(`Created client company: "${name}"`, 'Client', { clientId: client.id });
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

    await logActivity(`Updated client profile: "${name}"`, 'Client', { clientId: id });
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateClientRecord:", err);
    return { error: err.message || 'Failed to update client.' };
  }
}

export async function deleteClientRecord(id: string) {
  try {
    const client = await prisma.client.findUnique({ where: { id } });
    const name = client?.name || id;

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
    await logActivity(`Deleted client company: "${name}"`, 'Client', { clientId: id });
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

    await logActivity(`Onboarded client user account: "${name}" (${email})`, 'User', { userId, email });
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
        tasks: true,
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

    const project = await prisma.project.create({
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

    await logActivity(`Created project: "${name}"`, 'Project', { projectId: project.id });
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

    await logActivity(`Updated project metrics: "${name}" (${progress}%)`, 'Project', { projectId: id });
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateProjectRecord:", err);
    return { error: err.message || 'Failed to update project.' };
  }
}

export async function deleteProjectRecord(id: string): Promise<void> {
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    const name = project?.name || id;

    await prisma.project.delete({ where: { id } });
    await logActivity(`Deleted project: "${name}"`, 'Project', { projectId: id });
    revalidatePath('/admin');
  } catch (err: any) {
    console.error("Error in deleteProjectRecord:", err);
  }
}

/* --- RELATIONAL TASKS --- */

export async function getProjectTasks(projectId: string) {
  try {
    return await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return [];
  }
}

export async function createTaskRecord(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const projectId = formData.get('projectId') as string;
    const priority = (formData.get('priority') as Priority) || Priority.MEDIUM;
    const dueDateStr = formData.get('dueDate') as string;

    if (!title || !projectId) return { error: 'Task title and project are required.' };

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        priority,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
      },
    });

    await logActivity(`Created task item: "${title}"`, 'Task', { taskId: task.id, projectId });
    revalidatePath('/admin/projects');
    revalidatePath('/client');
    return { success: true };
  } catch (err: any) {
    console.error('Error in createTaskRecord:', err);
    return { error: err.message || 'Failed to create task.' };
  }
}

export async function toggleTaskStatus(taskId: string) {
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { error: 'Task not found.' };

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { isCompleted: !task.isCompleted },
    });

    await logActivity(
      `Task "${task.title}" marked as ${updated.isCompleted ? 'completed' : 'incomplete'}`,
      'Task',
      { taskId, projectId: task.projectId }
    );

    revalidatePath('/admin/projects');
    revalidatePath('/client');
    return { success: true, task: updated };
  } catch (err: any) {
    console.error('Error in toggleTaskStatus:', err);
    return { error: err.message || 'Failed to toggle task status.' };
  }
}

export async function deleteTaskRecord(taskId: string) {
  try {
    const task = await prisma.task.delete({ where: { id: taskId } });
    await logActivity(`Deleted task item: "${task.title}"`, 'Task', { taskId, projectId: task.projectId });
    revalidatePath('/admin/projects');
    revalidatePath('/client');
    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteTaskRecord:', err);
    return { error: err.message || 'Failed to delete task.' };
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

    const deliverable = await prisma.deliverable.create({
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

    await logActivity(`Uploaded deliverable: "${name}"`, 'Deliverable', { deliverableId: deliverable.id, projectId });
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

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        clientId,
        projectId: projectId || null,
        scheduledAt: new Date(scheduledAtStr),
        googleMeetLink,
      },
    });

    await logActivity(`Scheduled sync meeting: "${title}"`, 'Meeting', { meetingId: meeting.id, clientId });
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error("Error in createMeetingRecord:", err);
    return { error: err.message || 'Failed to create meeting.' };
  }
}

export async function deleteMeetingRecord(id: string): Promise<void> {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    const title = meeting?.title || id;

    await prisma.meeting.delete({ where: { id } });
    await logActivity(`Cancelled sync meeting: "${title}"`, 'Meeting', { meetingId: id });
    revalidatePath('/admin');
  } catch (err: any) {
    console.error("Error in deleteMeetingRecord:", err);
  }
}

/* --- INVOICES & BILLING --- */

export async function getInvoices() {
  try {
    return await prisma.invoice.findMany({
      include: {
        client: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return [];
  }
}

export async function createInvoiceRecord(formData: FormData) {
  try {
    const clientId = formData.get('clientId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dueDateStr = formData.get('dueDate') as string;
    const status = (formData.get('status') as InvoiceStatus) || InvoiceStatus.SENT;

    if (!clientId || isNaN(amount) || !dueDateStr) {
      return { error: 'Client, amount, and due date are required.' };
    }

    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        amount,
        status,
        dueDate: new Date(dueDateStr),
      },
      include: { client: true }
    });

    await logActivity(
      `Generated invoice for client "${invoice.client.name}" ($${amount.toFixed(2)})`,
      'Invoice',
      { invoiceId: invoice.id, clientId }
    );

    revalidatePath('/admin/billing');
    return { success: true };
  } catch (err: any) {
    console.error('Error in createInvoiceRecord:', err);
    return { error: err.message || 'Failed to create invoice.' };
  }
}

export async function recordPaymentRecord(formData: FormData) {
  try {
    const invoiceId = formData.get('invoiceId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const method = formData.get('method') as string || 'Stripe';
    const status = formData.get('status') as string || 'SUCCESS';

    if (!invoiceId || isNaN(amount)) {
      return { error: 'Invoice and amount are required.' };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true }
    });
    if (!invoice) return { error: 'Invoice not found.' };

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        method,
        status,
      },
    });

    if (status === 'SUCCESS') {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.PAID },
      });
    }

    await logActivity(
      `Recorded invoice payment for "${invoice.client.name}" ($${amount.toFixed(2)})`,
      'Payment',
      { paymentId: payment.id, invoiceId }
    );

    revalidatePath('/admin/billing');
    return { success: true };
  } catch (err: any) {
    console.error('Error in recordPaymentRecord:', err);
    return { error: err.message || 'Failed to record payment.' };
  }
}

/* --- TEAM MEMBERS MANAGEMENT --- */

export async function getTeamMembers() {
  try {
    return await prisma.user.findMany({
      where: { role: Role.ADMIN },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching team members:', err);
    return [];
  }
}

export async function createTeamMemberRecord(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'All fields are required.' };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: 'A team member account with this email already exists.' };

    const passwordHash = hashPassword(password);
    const userId = 'admin-' + Math.random().toString(36).substring(2, 10);

    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        role: Role.ADMIN,
        passwordHash,
      },
    });

    await logActivity(`Added administrator user: "${name}" (${email})`, 'User', { teamUserId: user.id });
    revalidatePath('/admin/team');
    return { success: true };
  } catch (err: any) {
    console.error('Error in createTeamMemberRecord:', err);
    return { error: err.message || 'Failed to add team member.' };
  }
}

export async function deleteTeamMemberRecord(userId: string) {
  try {
    const user = await prisma.user.delete({ where: { id: userId } });
    await logActivity(`Removed administrator user: "${user.name}" (${user.email})`, 'User', { userId });
    revalidatePath('/admin/team');
    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteTeamMemberRecord:', err);
    return { error: err.message || 'Failed to delete team member.' };
  }
}

/* --- AUDIT LOG FEEDS --- */

export async function getActivityLogs() {
  try {
    return await prisma.activityLog.findMany({
      include: {
        user: {
          select: { name: true, role: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    return [];
  }
}

/* --- ANALYTICS CALCULATIONS --- */

export async function getAnalyticsData() {
  try {
    const [
      revenueSum,
      projectsCount,
      completedProjects,
      activeClients,
      tasksCount,
      completedTasks,
      voiceNotesCount,
      filesCount,
      recentActivity,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.project.count(),
      prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      prisma.client.count(),
      prisma.task.count(),
      prisma.task.count({ where: { isCompleted: true } }),
      prisma.voiceNote.count(),
      prisma.file.count(),
      prisma.activityLog.findMany({
        include: {
          user: {
            select: { name: true, role: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 6,
      }),
    ]);

    const totalRevenue = revenueSum._sum.amount || 0;

    return {
      totalRevenue,
      projectsCount,
      completedProjects,
      activeClients,
      tasksCount,
      completedTasks,
      voiceNotesCount,
      filesCount,
      recentActivity,
    };
  } catch (err) {
    console.error('Error getting analytics:', err);
    return {
      totalRevenue: 0,
      projectsCount: 0,
      completedProjects: 0,
      activeClients: 0,
      tasksCount: 0,
      completedTasks: 0,
      voiceNotesCount: 0,
      filesCount: 0,
      recentActivity: [],
    };
  }
}
