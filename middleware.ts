import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Store simple en memoria para rate limiting en el Edge/Middleware
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const authRateLimitMap = new Map<string, RateLimitRecord>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = authRateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    authRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  record.count += 1;
  if (record.count > limit) {
    return true;
  }

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             req.headers.get('x-real-ip') ||
             'unknown-ip';

  // 1. Rate limiting en autenticación (máx 15 intentos por 5 minutos)
  if (pathname.startsWith('/api/auth')) {
    if (isRateLimited(ip, 15, 5 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes de autenticación. Intente más tarde.' },
        { status: 429, headers: { 'Retry-After': '300' } }
      );
    }
  }

  // 2. Bloquear rutas API admin no autorizadas
  if (pathname.startsWith('/api/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'pithy-chatbot-secret-key-2024' });
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado: Sesión de administrador requerida' },
        { status: 401 }
      );
    }

    // Validación CSRF / Origen para mutaciones (POST, PUT, DELETE, PATCH)
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const origin = req.headers.get('origin');
      const host = req.headers.get('host');
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json(
              { success: false, error: 'Origen no permitido (CORS/CSRF Violation)' },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            { success: false, error: 'Encabezado Origin inválido' },
            { status: 400 }
          );
        }
      }
    }
  }

  // 3. Bloquear vistas /admin no autorizadas y redirigir al login
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
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/:path*'],
};
