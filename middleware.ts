import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bloquear rutas API admin no autorizadas
  if (pathname.startsWith('/api/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'pithy-chatbot-secret-key-2024' });
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado: Sesión de administrador requerida' },
        { status: 401 }
      );
    }
  }

  // Bloquear vistas /admin no autorizadas y redirigir al login
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'pithy-chatbot-secret-key-2024' });
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
