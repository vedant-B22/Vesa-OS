'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { analyzeFeedback, transcribeVoiceNote } from '@/lib/ai';
import { DeliverableStatus, RevisionStatus, Priority } from '@prisma/client';

/**
 * Asserts that the current session is an authenticated client user
 * and returns their clientId.
 */
async function assertClientSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.user_metadata?.role !== 'CLIENT') {
    throw new Error('Unauthorized access');
  }

  const clientId = user.user_metadata?.clientId;
  if (!clientId) {
    throw new Error('Client organization context not found.');
  }

  return { clientId, userId: user.id };
}

/* --- CLIENT CONTEXT READS --- */

export async function getClientBranding() {
  try {
    const { clientId } = await assertClientSession();
    return await prisma.client.findUnique({
      where: { id: clientId },
    });
  } catch {
    return null;
  }
}

export async function getClientWorkspaceData() {
  const { clientId } = await assertClientSession();

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  const projects = await prisma.project.findMany({
    where: { clientId },
    include: {
      deliverables: {
        orderBy: { createdAt: 'desc' },
      },
      files: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const meetings = await prisma.meeting.findMany({
    where: { clientId },
    orderBy: { scheduledAt: 'asc' },
  });

  return { client, projects, meetings };
}

/* --- DELIVERABLE ACTIONS --- */

export async function approveClientDeliverable(deliverableId: string) {
  const { clientId } = await assertClientSession();

  // Validate the deliverable belongs to this client's project
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { project: true },
  });

  if (!deliverable || deliverable.project.clientId !== clientId) {
    throw new Error('Access Denied');
  }

  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: DeliverableStatus.APPROVED },
  });

  // Create notification for admin users
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Deliverable Approved',
        content: `Deliverable "${deliverable.name}" for project "${deliverable.project.name}" has been approved.`,
        link: `/admin/deliverables`,
      },
    });
  }

  revalidatePath('/client');
  return { success: true };
}

/* --- AI FEEDBACK & REVISION ACTIONS --- */

export async function analyzeRawFeedbackAction(deliverableId: string, rawFeedback: string) {
  const { clientId } = await assertClientSession();

  // Validate ownership
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { project: true },
  });

  if (!deliverable || deliverable.project.clientId !== clientId) {
    throw new Error('Access Denied');
  }

  const analysis = await analyzeFeedback(rawFeedback);
  return { success: true, analysis };
}

export async function submitStructuredRevisionAction(
  deliverableId: string,
  rawFeedback: string,
  analysisData: any, // AI analyzed questions/styles
  answers: Record<string, string> // Client questionnaire responses
) {
  const { clientId } = await assertClientSession();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { project: true },
  });

  if (!deliverable || deliverable.project.clientId !== clientId) {
    throw new Error('Access Denied');
  }

  // Generate structured brief JSON
  const structuredBrief = {
    elementsToImprove: analysisData.elementsToImprove,
    suggestedStyle: analysisData.suggestedStyle,
    originalFeedback: rawFeedback,
    followUpQuestionsAnswers: Object.entries(answers).map(([question, answer]) => ({
      question,
      answer,
    })),
    submittedAt: new Date().toISOString(),
  };

  // 1. Create Revision Request Record
  await prisma.revisionRequest.create({
    data: {
      deliverableId,
      feedbackRaw: rawFeedback,
      structuredBrief,
      status: RevisionStatus.OPEN,
    },
  });

  // 2. Set Deliverable status to Revision Requested
  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: DeliverableStatus.REVISION_REQUESTED },
  });

  // 3. Notify Admin Users
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Revision Requested',
        content: `Revision requested on "${deliverable.name}" for client project "${deliverable.project.name}".`,
        link: `/admin/deliverables`,
      },
    });
  }

  revalidatePath('/client');
  return { success: true };
}

/* --- VOICE NOTES ACTIONS --- */

export async function uploadClientVoiceNoteAction(
  projectId: string,
  audioBase64: string,
  mimeType: string
) {
  const { clientId } = await assertClientSession();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.clientId !== clientId) {
    throw new Error('Access Denied');
  }

  // Perform AI Speech-To-Text and Task Extraction
  const aiResult = await transcribeVoiceNote(audioBase64, mimeType);

  // Store inside the database
  const voiceNote = await prisma.voiceNote.create({
    data: {
      projectId,
      fileUrl: `data:${mimeType};base64,${audioBase64.slice(0, 100)}...`, // Save a compressed base64 preview or a placeholder path
      transcription: aiResult.transcription,
      summary: aiResult.summary,
      tasks: aiResult.tasks,
      priority: aiResult.priority as Priority,
    },
  });

  // Notify Admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'New Voice Feedback Note',
        content: `Client uploaded a voice note on project "${project.name}" (Priority: ${aiResult.priority}).`,
        link: `/admin/projects`,
      },
    });
  }

  revalidatePath('/client');
  return { success: true, voiceNote };
}
