/**
 * NextAuth Configuration
 *
 * Configuración de autenticación usando:
 * - AuthService para lógica de negocio
 * - bcrypt para verificación de passwords
 * - JWT para sesiones
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authService } from '@/services/AuthService'
import { authLogger, logError } from '@/lib/logger'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        username: { label: 'Usuario', type: 'text', placeholder: 'admin' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          authLogger.warn('Login attempt without credentials')
          return null
        }

        try {
          // Usar AuthService para autenticar
          const result = await authService.login({
            username: credentials.username,
            password: credentials.password,
          })

          // Retornar usuario autenticado (NUNCA incluir base64 en image para evitar cookies gigantes que rompen Nginx)
          const isUrl = result.admin.avatar && !result.admin.avatar.startsWith('data:');
          return {
            id: result.admin.id,
            name: result.admin.name,
            email: result.admin.email,
            role: result.admin.role,
            image: isUrl ? result.admin.avatar : undefined,
          }
        } catch (error) {
          // AuthService ya loguea el error, solo retornamos null
          logError(authLogger, error, {
            username: credentials.username,
          })
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
      }
      // Handle session update (e.g., when user updates profile)
      if (trigger === 'update' && session) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  logger: {
    error(code, metadata) {
      // Registrar solo en servidor sin reenviar al cliente
      authLogger.warn(`NextAuth [${code}]: ${JSON.stringify(metadata)}`);
    },
    warn(code) {},
    debug(code, metadata) {},
  },
  secret: process.env.NEXTAUTH_SECRET || 'pithy-chatbot-secret-key-2024',
};
