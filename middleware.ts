import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE = 'todo_session';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/login' || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (pathname === '/' || pathname.startsWith('/calendar')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      jwt.verify(token, secret);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
