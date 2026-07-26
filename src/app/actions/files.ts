'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { prisma } from '@/lib/db';

/**
 * Retrieves all files uploaded for a specific project.
 */
export async function getProjectFiles(projectId: string) {
  return await prisma.file.findMany({
    where: { projectId },
    include: {
      uploadedBy: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Adds a file upload metadata entry in the database.
 */
export async function addFileRecord(
  projectId: string,
  name: string,
  fileUrl: string,
  size: number,
  folderPath: string = '/'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const file = await prisma.file.create({
    data: {
      projectId,
      name,
      fileUrl,
      size,
      folderPath,
      uploadedById: user.id,
      version: 1,
    },
  });

  revalidatePath('/client');
  revalidatePath('/admin');
  return { success: true, file };
}

/**
 * Uploads a file to Supabase Storage and records its metadata in the database.
 * If the storage bucket does not exist, it programmatically creates it (self-healing).
 */
export async function uploadFileToStorageAction(
  projectId: string,
  fileName: string,
  fileBase64: string,
  fileSize: number,
  fileType: string
) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing.');
  }

  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  // 1. Ensure the bucket 'files' exists
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === 'files');
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket('files', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
    }
  } catch (err) {
    console.error('Failed to list or create Supabase bucket:', err);
  }

  // 2. Convert base64 back to binary Buffer
  const buffer = Buffer.from(fileBase64, 'base64');
  const filePath = `${projectId}/${Date.now()}-${fileName}`;

  // 3. Upload file to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from('files')
    .upload(filePath, buffer, {
      contentType: fileType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // 4. Get the public file serving URL
  const { data: { publicUrl } } = supabaseAdmin.storage.from('files').getPublicUrl(filePath);

  // 5. Create database record
  return await addFileRecord(projectId, fileName, publicUrl, fileSize);
}

/**
 * Deletes a file entry from the database.
 */
export async function deleteFileRecord(fileId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new Error('File not found');
  }

  await prisma.file.delete({
    where: { id: fileId },
  });

  revalidatePath('/client');
  revalidatePath('/admin');
  return { success: true };
}
