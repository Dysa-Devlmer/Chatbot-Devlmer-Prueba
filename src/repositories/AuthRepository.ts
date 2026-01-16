/**
 * AuthRepository
 *
 * Repositorio para acceso a datos de autenticación y perfil de administrador.
 * Abstrae todas las operaciones de Prisma relacionadas con AdminProfile.
 */

import { prisma } from '@/lib/prisma'
import { AdminProfile, Prisma } from '@prisma/client'

/**
 * Tipo para crear un nuevo admin
 */
export type CreateAdminData = Prisma.AdminProfileCreateInput

/**
 * Tipo para actualizar admin (sin password por seguridad)
 */
export type UpdateAdminData = Omit<
  Prisma.AdminProfileUpdateInput,
  'password'
>

/**
 * Tipo para el perfil público del admin (sin password)
 */
export type SafeAdminProfile = Omit<AdminProfile, 'password'>

/**
 * Repositorio de autenticación
 */
export class AuthRepository {
  /**
   * Buscar admin por username
   */
  async findByUsername(username: string): Promise<AdminProfile | null> {
    return prisma.adminProfile.findUnique({
      where: { username },
    })
  }

  /**
   * Buscar admin por ID
   */
  async findById(id: string): Promise<AdminProfile | null> {
    return prisma.adminProfile.findUnique({
      where: { id },
    })
  }

  /**
   * Buscar admin por email
   */
  async findByEmail(email: string): Promise<AdminProfile | null> {
    return prisma.adminProfile.findFirst({
      where: { email },
    })
  }

  /**
   * Obtener perfil público (sin password)
   */
  async getPublicProfile(id: string): Promise<SafeAdminProfile | null> {
    return prisma.adminProfile.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        role: true,
        avatar: true,
        timezone: true,
        language: true,
        theme: true,
        accentColor: true,
        emailNewMessage: true,
        emailDailyReport: true,
        pushNewMessage: true,
        pushMentions: true,
        soundEnabled: true,
        desktopNotifications: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Crear nuevo admin
   */
  async create(data: CreateAdminData): Promise<AdminProfile> {
    return prisma.adminProfile.create({
      data,
    })
  }

  /**
   * Actualizar perfil del admin (sin password)
   */
  async update(
    id: string,
    data: UpdateAdminData
  ): Promise<SafeAdminProfile> {
    const updated = await prisma.adminProfile.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        role: true,
        avatar: true,
        timezone: true,
        language: true,
        theme: true,
        accentColor: true,
        emailNewMessage: true,
        emailDailyReport: true,
        pushNewMessage: true,
        pushMentions: true,
        soundEnabled: true,
        desktopNotifications: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return updated
  }

  /**
   * Actualizar password del admin
   * IMPORTANTE: Debe recibir un hash, no password en texto plano
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await prisma.adminProfile.update({
      where: { id },
      data: { password: hashedPassword },
    })
  }

  /**
   * Actualizar preferencias de notificaciones
   */
  async updateNotificationSettings(
    id: string,
    settings: {
      emailNewMessage?: boolean
      emailDailyReport?: boolean
      pushNewMessage?: boolean
      pushMentions?: boolean
      soundEnabled?: boolean
      desktopNotifications?: boolean
    }
  ): Promise<SafeAdminProfile> {
    return this.update(id, settings)
  }

  /**
   * Actualizar avatar
   */
  async updateAvatar(id: string, avatarUrl: string): Promise<void> {
    await prisma.adminProfile.update({
      where: { id },
      data: { avatar: avatarUrl },
    })
  }

  /**
   * Actualizar tema y preferencias visuales
   */
  async updateThemeSettings(
    id: string,
    settings: {
      theme?: string
      accentColor?: string
      language?: string
    }
  ): Promise<SafeAdminProfile> {
    return this.update(id, settings)
  }

  /**
   * Verificar si un username ya existe
   */
  async usernameExists(username: string): Promise<boolean> {
    const count = await prisma.adminProfile.count({
      where: { username },
    })
    return count > 0
  }

  /**
   * Verificar si un email ya existe
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.adminProfile.count({
      where: { email },
    })
    return count > 0
  }

  /**
   * Obtener todos los admins (para sistema multi-admin en futuro)
   */
  async findAll(): Promise<SafeAdminProfile[]> {
    return prisma.adminProfile.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        role: true,
        avatar: true,
        timezone: true,
        language: true,
        theme: true,
        accentColor: true,
        emailNewMessage: true,
        emailDailyReport: true,
        pushNewMessage: true,
        pushMentions: true,
        soundEnabled: true,
        desktopNotifications: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Eliminar admin (cuidado con esta operación)
   */
  async delete(id: string): Promise<void> {
    await prisma.adminProfile.delete({
      where: { id },
    })
  }
}

/**
 * Instancia singleton del repositorio
 */
export const authRepository = new AuthRepository()
