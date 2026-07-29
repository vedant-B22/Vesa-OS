'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyzeFeedback, transcribeVoiceNote } from '@/lib/ai';
import { DeliverableStatus, RevisionStatus, Priority } from '@prisma/client';
import { logActivity } from '@/lib/activity';

/**
 * Asserts that the current session is an authenticated client user
 * and returns their clientId.
 */
async function assertClientSession() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'CLIENT') {
    throw new Error('Unauthorized access');
  }

  const clientId = user.clientId;
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
  try {
    const { clientId } = await assertClientSession();

    // Validate the deliverable belongs to this client's project
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: { project: true },
    });

    if (!deliverable || deliverable.project.clientId !== clientId) {
      return { success: false, error: 'Access Denied: Deliverable not found or does not belong to your organization.' };
    }

    await prisma.deliverable.update({
      where: { id: deliverableId },
      data: { status: DeliverableStatus.APPROVED },
    });

    await logActivity(`Approved deliverable: "${deliverable.name}"`, 'Deliverable', { deliverableId, projectId: deliverable.projectId });

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
  } catch (err: any) {
    console.error('Error in approveClientDeliverable:', err);
    return { success: false, error: err.message || 'Failed to approve deliverable.' };
  }
}

/* --- AI FEEDBACK & REVISION ACTIONS --- */

export async function analyzeRawFeedbackAction(deliverableId: string, rawFeedback: string) {
  try {
    const { clientId } = await assertClientSession();

    // Validate ownership
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: { project: true },
    });

    if (!deliverable || deliverable.project.clientId !== clientId) {
      return { success: false, error: 'Access Denied: Deliverable not found.' };
    }

    console.log('API Request: Analyzing feedback with AI...', { deliverableId, rawFeedbackLength: rawFeedback.length });
    const analysis = await analyzeFeedback(rawFeedback);
    console.log('API Response: Feedback analyzed successfully:', analysis);
    return { success: true, analysis };
  } catch (err: any) {
    console.error('Error in analyzeRawFeedbackAction:', err);
    return { success: false, error: err.message || 'An error occurred during AI analysis.' };
  }
}

export async function submitStructuredRevisionAction(
  deliverableId: string,
  rawFeedback: string,
  analysisData: any, // AI analyzed questions/styles
  answers: Record<string, string> // Client questionnaire responses
) {
  try {
    const { clientId } = await assertClientSession();

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: { project: true },
    });

    if (!deliverable || deliverable.project.clientId !== clientId) {
      return { success: false, error: 'Access Denied: Deliverable not found.' };
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

    await logActivity(`Submitted revision request for: "${deliverable.name}"`, 'RevisionRequest', { deliverableId, projectId: deliverable.projectId });

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
  } catch (err: any) {
    console.error('Error in submitStructuredRevisionAction:', err);
    return { success: false, error: err.message || 'Failed to submit structured revision request.' };
  }
}

/* --- VOICE NOTES ACTIONS --- */

export async function uploadClientVoiceNoteAction(
  projectId: string,
  audioBase64: string,
  mimeType: string
) {
  try {
    const { clientId } = await assertClientSession();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.clientId !== clientId) {
      return { success: false, error: 'Access Denied: Project not found.' };
    }

    // Perform AI Speech-To-Text and Task Extraction
    console.log('API Request: Processing voice note audio with AI...', { projectId, mimeType });
    const aiResult = await transcribeVoiceNote(audioBase64, mimeType);
    console.log('API Response: Voice note processed successfully:', aiResult);

    // Store inside the database
    const voiceNote = await prisma.voiceNote.create({
      data: {
        projectId,
        fileUrl: `data:${mimeType};base64,${audioBase64.slice(0, 100)}...`, // Save compressed base64 preview
        transcription: aiResult.transcription,
        summary: aiResult.summary,
        tasks: aiResult.tasks,
        priority: aiResult.priority as Priority,
      },
    });

    // Auto-create relational Tasks from voice note tasks to make them actionable!
    if (aiResult.tasks && aiResult.tasks.length > 0) {
      for (const t of aiResult.tasks) {
        if (t && t.trim().length > 0) {
          await prisma.task.create({
            data: {
              projectId,
              title: t,
              priority: aiResult.priority as Priority,
            }
          });
        }
      }
    }

    await logActivity(`Uploaded voice feedback note for project`, 'VoiceNote', { voiceNoteId: voiceNote.id, projectId });

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
  } catch (err: any) {
    console.error('Error in uploadClientVoiceNoteAction:', err);
    return { success: false, error: err.message || 'Failed to process and upload voice note.' };
  }
}
