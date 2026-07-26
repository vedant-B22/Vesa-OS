import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user: supabaseUser } = await updateSession(request);
  let user = supabaseUser;

  // Fallback: Verify local session cookie if Supabase Auth is paused/offline
  if (!user) {
    const localSession = request.cookies.get('vesa_session_user')?.value;
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        user = {
          id: parsed.id,
          email: parsed.email,
          user_metadata: {
            role: parsed.role,
            clientId: parsed.clientId,
            name: parsed.name,
          },
        } as any;
      } catch {}
    }
  }

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Bypasses static assets and API/callback routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/auth/callback')
  ) {
    return supabaseResponse;
  }

  // If user is NOT authenticated
  if (!user) {
    if (path.startsWith('/admin') || path.startsWith('/client') || path === '/') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Retrieve role from user metadata (injected into Supabase JWT)
  const role = user.user_metadata?.role;

  // If user is authenticated and attempts to access root or login pages
  if (path === '/login' || path === '/') {
    if (role === 'ADMIN') {
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    } else {
      url.pathname = '/client';
      return NextResponse.redirect(url);
    }
  }

  // Block non-admin users from accessing /admin paths
  if (path.startsWith('/admin') && role !== 'ADMIN') {
    url.pathname = '/client';
    return NextResponse.redirect(url);
  }

  // Block non-client users from accessing /client paths
  if (path.startsWith('/client') && role !== 'CLIENT') {
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
