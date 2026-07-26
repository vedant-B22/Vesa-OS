import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const role = (user.user_metadata?.role as 'ADMIN' | 'CLIENT') || 'CLIENT';
      const clientId = user.user_metadata?.clientId || null;
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

      // Synchronize the authenticated user into our Prisma Postgres database
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email!,
          name,
          role,
          clientId,
        },
        create: {
          id: user.id,
          email: user.email!,
          name,
          role,
          clientId,
        },
      });
    }
  }

  // Redirect to original page
  return NextResponse.redirect(`${origin}${next}`);
}
