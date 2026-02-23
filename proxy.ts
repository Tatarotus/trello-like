import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-local-key-change-in-production';
const encodedKey = new TextEncoder().encode(secretKey);

const protectedRoutes = ['/', '/workspace', '/board'];
const publicRoutes = ['/login', '/register'];

// Changed function name from 'middleware' to 'proxy'
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(r => path === r || path.startsWith(`${r}/`));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get('session')?.value;
  let session = null;

  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, encodedKey, { algorithms: ['HS256'] });
      session = payload;
    } catch (e) {}
  }

  // Redirect unauthenticated users
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
