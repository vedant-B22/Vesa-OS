'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser || !dbUser.passwordHash) {
      return { error: 'Invalid email or password.' };
    }

    const isValid = verifyPassword(password, dbUser.passwordHash);
    if (!isValid) {
      return { error: 'Invalid email or password.' };
    }

    // Establish local session cookie
    const cookieStore = await cookies();
    cookieStore.set('vesa_session_user', JSON.stringify({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      clientId: dbUser.clientId
    }), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

  } catch (err: any) {
    console.error('Login database connection failure:', err);
    return { error: `Database connection failed: ${err.message || String(err)}` };
  }

  revalidatePath('/', 'layout');

  // Perform redirect outside of the try-catch block to prevent Next.js routing issues
  const cookieStore = await cookies();
  const localSession = cookieStore.get('vesa_session_user')?.value;
  if (localSession) {
    const parsed = JSON.parse(localSession);
    if (parsed.role === 'ADMIN') {
      redirect('/admin');
    } else {
      redirect('/client');
    }
  }

  return { error: 'An unexpected authentication error occurred.' };
}

export async function forgotPassword(state: any, formData: FormData): Promise<{ error?: string; success?: string }> {
  return { error: 'Password reset is disabled in local database authentication mode.' };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('vesa_session_user');
  
  revalidatePath('/', 'layout');
  redirect('/login');
}
