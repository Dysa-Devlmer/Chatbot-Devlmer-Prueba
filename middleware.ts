import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Si el usuario está autenticado, permitir acceso
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Rutas que requieren autenticación
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

        if (isAdminRoute) {
          return !!token; // Requiere token para /admin
        }

        return true; // Otras rutas son públicas
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};
