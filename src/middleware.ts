import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const localSession = request.cookies.get('vesa_session_user')?.value;
  let user = null;

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
      };
    } catch {}
  }

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Redirect unauthenticated requests to login
  if (!user) {
    if (path.startsWith('/admin') || path.startsWith('/client')) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const role = user.user_metadata?.role;

  // Redirect authenticated requests away from login or root
  if (path === '/login' || path === '/') {
    if (role === 'ADMIN') {
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    } else {
      url.pathname = '/client';
      return NextResponse.redirect(url);
    }
  }

  // Guard admin dashboard
  if (path.startsWith('/admin') && role !== 'ADMIN') {
    url.pathname = '/client';
    return NextResponse.redirect(url);
  }

  // Guard client portal
  if (path.startsWith('/client') && role !== 'CLIENT') {
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
