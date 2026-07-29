import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const envState = {
    geminiKeyExists: typeof process.env.GEMINI_API_KEY === 'string' && process.env.GEMINI_API_KEY.length > 0,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Configured',
    supabaseUrlExists: typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' && process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0,
    dbUrlExists: typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0,
  };

  return <SettingsClient envState={envState} />;
}
