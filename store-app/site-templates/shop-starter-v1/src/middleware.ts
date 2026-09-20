import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';
import { verifyAdminTokenEdge } from '@/lib/auth-edge';

const LICENSED_DOMAIN = process.env.LICENSED_DOMAIN?.toLowerCase().replace(/^www\./, '');

export async function middleware(request: NextRequest) {
  if (LICENSED_DOMAIN) {
    const host = request.headers.get('host')?.toLowerCase().replace(/^www\./, '').split(':')[0];
    if (host && host !== LICENSED_DOMAIN) {
      return new NextResponse('این سایت برای دامنه مجاز فعال نشده است.', { status: 403 });
    }
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token || !(await verifyAdminTokenEdge(token))) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
