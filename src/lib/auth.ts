import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Credenciales del admin (en producción usar base de datos con bcrypt)
export const adminCredentials = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'pithy2024',
  name: 'Administrador',
  email: 'admin@zgamersa.com',
};

// Función para actualizar contraseña (en producción usar base de datos)
export function updateAdminPassword(newPassword: string) {
  adminCredentials.password = newPassword;
}

// Función para verificar contraseña
export function verifyAdminPassword(password: string): boolean {
  return password === adminCredentials.password;
}

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

        // Verificar credenciales
        if (
          credentials.username === adminCredentials.username &&
          verifyAdminPassword(credentials.password)
        ) {
          return {
            id: '1',
            name: adminCredentials.name,
            email: adminCredentials.email,
            role: 'admin',
          };
        }

        return null;
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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
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
