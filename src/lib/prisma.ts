/**
 * PrismaClient Singleton
 *
 * Patrón singleton para evitar múltiples instancias de Prisma en desarrollo
 * debido al hot-reload de Next.js.
 *
 * @see https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Configuración del cliente Prisma
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  })
}

// Singleton: reutilizar instancia en desarrollo, crear nueva en producción
export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

/**
 * Desconectar Prisma de forma segura
 * Útil para tests y cierre controlado de la aplicación
 */
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

/**
 * Verificar conexión a la base de datos
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Error connecting to database:', error)
    return false
  }
}

// Export default para compatibilidad
export default prisma