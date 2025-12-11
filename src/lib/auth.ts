import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default credentials (used if database is not available)
const defaultCredentials = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'pithy2024',
  name: 'Administrador',
  email: 'admin@pithy.cl',
};

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
          return null;
        }

        try {
          // Try to get admin profile from database
          const profile = await prisma.adminProfile.findFirst({
            where: { username: credentials.username },
          });

          if (profile) {
            // Verify password from database
            if (credentials.password === profile.password) {
              return {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
              };
            }
            return null;
          }

          // Fallback to default credentials if no profile in database
          if (
            credentials.username === defaultCredentials.username &&
            credentials.password === defaultCredentials.password
          ) {
            // Create profile in database for future use
            try {
              const newProfile = await prisma.adminProfile.create({
                data: {
                  username: defaultCredentials.username,
                  password: defaultCredentials.password,
                  name: defaultCredentials.name,
                  email: defaultCredentials.email,
                },
              });

              return {
                id: newProfile.id,
                name: newProfile.name,
                email: newProfile.email,
                role: newProfile.role,
              };
            } catch (createError) {
              // Profile might already exist, just return default
              return {
                id: '1',
                name: defaultCredentials.name,
                email: defaultCredentials.email,
                role: 'admin',
              };
            }
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);

          // Fallback to default credentials if database error
          if (
            credentials.username === defaultCredentials.username &&
            credentials.password === defaultCredentials.password
          ) {
            return {
              id: '1',
              name: defaultCredentials.name,
              email: defaultCredentials.email,
              role: 'admin',
            };
          }

          return null;
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
  secret: process.env.NEXTAUTH_SECRET || 'pithy-chatbot-secret-key-2024',
};
