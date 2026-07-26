import crypto from 'crypto';
import { cookies } from 'next/headers';

/**
 * Hashes a plaintext password using PBKDF2 with SHA-512.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === checkHash;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Returns the currently authenticated user session from secure cookies.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const localSession = cookieStore.get('vesa_session_user')?.value;
  if (!localSession) return null;

  try {
    const parsed = JSON.parse(localSession);
    return {
      id: parsed.id as string,
      email: parsed.email as string,
      name: parsed.name as string,
      role: parsed.role as 'ADMIN' | 'CLIENT',
      clientId: parsed.clientId as string | null,
    };
  } catch (err) {
    console.error('Failed to parse local session cookie:', err);
    return null;
  }
}
