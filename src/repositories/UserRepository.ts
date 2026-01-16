/**
 * UserRepository
 *
 * Repository para operaciones de usuarios de WhatsApp en la base de datos.
 * Responsable de:
 * - Crear y obtener usuarios
 * - Actualizar información de usuario
 * - Gestionar preferencias y metadata
 * - Bloqueo y VIP
 */

import { prisma } from '@/lib/prisma'
import { User } from '@prisma/client'
import { dbLogger } from '@/lib/logger'

/**
 * Datos para crear un usuario
 */
export interface CreateUserData {
  phoneNumber: string
  name?: string
  profilePicUrl?: string
  language?: string
  timezone?: string
}

/**
 * Datos para actualizar un usuario
 */
export interface UpdateUserData {
  name?: string
  profilePicUrl?: string
  language?: string
  timezone?: string
  isBlocked?: boolean
  isVIP?: boolean
  preferences?: any
  tags?: string
  totalMessages?: number
}

/**
 * Filtros para buscar usuarios
 */
export interface UserFilters {
  isBlocked?: boolean
  isVIP?: boolean
  language?: string
  limit?: number
  offset?: number
}

/**
 * Repository para operaciones con usuarios
 */
export class UserRepository {
  /**
   * Crear un nuevo usuario
   */
  async create(data: CreateUserData): Promise<User> {
    dbLogger.info('Creating user', {
      phoneNumber: this.maskPhoneNumber(data.phoneNumber),
      name: data.name,
    })

    const user = await prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        name: data.name,
        profilePicUrl: data.profilePicUrl,
        language: data.language || 'es',
        timezone: data.timezone || 'America/Santiago',
      },
    })

    dbLogger.info('User created successfully', {
      userId: user.id,
      phoneNumber: this.maskPhoneNumber(user.phoneNumber),
    })

    return user
  }

  /**
   * Obtener usuario por ID
   */
  async findById(userId: string): Promise<User | null> {
    dbLogger.debug('Finding user by ID', { userId })

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    dbLogger.debug('User lookup result', {
      userId,
      found: user !== null,
    })

    return user
  }

  /**
   * Obtener usuario por número de teléfono
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    dbLogger.debug('Finding user by phone number', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
    })

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    })

    dbLogger.debug('User lookup result', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      found: user !== null,
    })

    return user
  }

  /**
   * Obtener o crear usuario (upsert pattern)
   */
  async getOrCreate(phoneNumber: string, name?: string): Promise<User> {
    dbLogger.debug('Getting or creating user', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      name,
    })

    // Primero intentar encontrar
    let user = await this.findByPhoneNumber(phoneNumber)

    if (user) {
      dbLogger.debug('User found, returning existing', {
        userId: user.id,
        phoneNumber: this.maskPhoneNumber(phoneNumber),
      })

      // Si tenemos un nombre nuevo y el usuario no tiene nombre, actualizarlo
      if (name && !user.name) {
        user = await this.update(user.id, { name })
      }

      return user
    }

    // Si no existe, crear nuevo
    dbLogger.info('User not found, creating new', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      name,
    })

    return this.create({ phoneNumber, name })
  }

  /**
   * Actualizar usuario por ID
   */
  async update(userId: string, data: UpdateUserData): Promise<User> {
    dbLogger.info('Updating user', { userId, data })

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    })

    dbLogger.info('User updated successfully', { userId })

    return user
  }

  /**
   * Incrementar contador de mensajes del usuario
   */
  async incrementMessageCount(userId: string): Promise<void> {
    dbLogger.debug('Incrementing message count', { userId })

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalMessages: {
          increment: 1,
        },
      },
    })

    dbLogger.debug('Message count incremented', { userId })
  }

  /**
   * Bloquear usuario
   */
  async block(userId: string): Promise<User> {
    dbLogger.info('Blocking user', { userId })

    const user = await this.update(userId, { isBlocked: true })

    dbLogger.info('User blocked successfully', { userId })

    return user
  }

  /**
   * Desbloquear usuario
   */
  async unblock(userId: string): Promise<User> {
    dbLogger.info('Unblocking user', { userId })

    const user = await this.update(userId, { isBlocked: false })

    dbLogger.info('User unblocked successfully', { userId })

    return user
  }

  /**
   * Marcar usuario como VIP
   */
  async setVIP(userId: string, isVIP: boolean): Promise<User> {
    dbLogger.info('Setting VIP status', { userId, isVIP })

    const user = await this.update(userId, { isVIP })

    dbLogger.info('VIP status updated successfully', { userId, isVIP })

    return user
  }

  /**
   * Buscar usuarios con filtros
   */
  async findMany(filters: UserFilters = {}): Promise<User[]> {
    dbLogger.debug('Finding users with filters', filters)

    const users = await prisma.user.findMany({
      where: {
        isBlocked: filters.isBlocked,
        isVIP: filters.isVIP,
        language: filters.language,
      },
      orderBy: { lastContact: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    })

    dbLogger.debug('Users retrieved with filters', {
      count: users.length,
      filters,
    })

    return users
  }

  /**
   * Obtener todos los usuarios VIP
   */
  async findVIPs(): Promise<User[]> {
    dbLogger.debug('Finding VIP users')

    const users = await this.findMany({ isVIP: true })

    dbLogger.debug('VIP users retrieved', { count: users.length })

    return users
  }

  /**
   * Obtener usuarios bloqueados
   */
  async findBlocked(): Promise<User[]> {
    dbLogger.debug('Finding blocked users')

    const users = await this.findMany({ isBlocked: true })

    dbLogger.debug('Blocked users retrieved', { count: users.length })

    return users
  }

  /**
   * Contar total de usuarios
   */
  async count(filters: UserFilters = {}): Promise<number> {
    dbLogger.debug('Counting users with filters', filters)

    const count = await prisma.user.count({
      where: {
        isBlocked: filters.isBlocked,
        isVIP: filters.isVIP,
        language: filters.language,
      },
    })

    dbLogger.debug('User count result', { count, filters })

    return count
  }

  /**
   * Eliminar usuario por ID
   */
  async delete(userId: string): Promise<void> {
    dbLogger.info('Deleting user', { userId })

    await prisma.user.delete({
      where: { id: userId },
    })

    dbLogger.info('User deleted successfully', { userId })
  }

  /**
   * Enmascarar número de teléfono para logs (privacidad)
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return '****'
    return phoneNumber.substring(0, 4) + '****' + phoneNumber.substring(phoneNumber.length - 2)
  }
}

/**
 * Instancia singleton del repositorio
 */
export const userRepository = new UserRepository()
