/**
 * ConversationRepository
 *
 * Repository para operaciones de conversaciones en la base de datos.
 * Responsable de:
 * - Crear y obtener conversaciones
 * - Actualizar estado de conversaciones
 * - Gestionar modo bot/manual
 * - Cerrar conversaciones
 */

import { prisma } from '@/lib/prisma'
import { Conversation } from '@prisma/client'
import { dbLogger } from '@/lib/logger'

/**
 * Datos para crear una conversación
 */
export interface CreateConversationData {
  userId: string
  status?: string
  context?: any
  sentiment?: string
  category?: string
  botMode?: string
  assignedTo?: string
  tags?: string
}

/**
 * Datos para actualizar una conversación
 */
export interface UpdateConversationData {
  status?: string
  context?: any
  sentiment?: string
  category?: string
  botMode?: string
  assignedTo?: string
  isUnread?: boolean
  tags?: string
  endedAt?: Date
}

/**
 * Filtros para buscar conversaciones
 */
export interface ConversationFilters {
  userId?: string
  status?: string
  botMode?: string
  isUnread?: boolean
  assignedTo?: string
  limit?: number
  offset?: number
  orderBy?: 'asc' | 'desc'
}

/**
 * Repository para operaciones con conversaciones
 */
export class ConversationRepository {
  /**
   * Crear una nueva conversación
   */
  async create(data: CreateConversationData): Promise<Conversation> {
    dbLogger.info('Creating conversation', {
      userId: data.userId,
      botMode: data.botMode || 'auto',
    })

    const conversation = await prisma.conversation.create({
      data: {
        userId: data.userId,
        status: data.status || 'active',
        context: data.context,
        sentiment: data.sentiment,
        category: data.category,
        botMode: data.botMode || 'auto',
        assignedTo: data.assignedTo,
        tags: data.tags,
      },
    })

    dbLogger.info('Conversation created successfully', {
      conversationId: conversation.id,
      userId: conversation.userId,
    })

    return conversation
  }

  /**
   * Obtener conversación por ID
   */
  async findById(conversationId: string): Promise<Conversation | null> {
    dbLogger.debug('Finding conversation by ID', { conversationId })

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    dbLogger.debug('Conversation lookup result', {
      conversationId,
      found: conversation !== null,
    })

    return conversation
  }

  /**
   * Obtener conversación activa de un usuario
   */
  async findActiveByUser(userId: string): Promise<Conversation | null> {
    dbLogger.debug('Finding active conversation by user', { userId })

    const conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { startedAt: 'desc' },
    })

    dbLogger.debug('Active conversation lookup result', {
      userId,
      found: conversation !== null,
    })

    return conversation
  }

  /**
   * Obtener o crear conversación activa (upsert pattern)
   */
  async getOrCreate(userId: string): Promise<Conversation> {
    dbLogger.debug('Getting or creating active conversation', { userId })

    // Primero intentar encontrar conversación activa
    let conversation = await this.findActiveByUser(userId)

    if (conversation) {
      dbLogger.debug('Active conversation found', {
        conversationId: conversation.id,
        userId,
      })
      return conversation
    }

    // Si no existe, crear nueva
    dbLogger.info('No active conversation found, creating new', { userId })

    return this.create({ userId })
  }

  /**
   * Actualizar conversación por ID
   */
  async update(conversationId: string, data: UpdateConversationData): Promise<Conversation> {
    dbLogger.info('Updating conversation', { conversationId, data })

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data,
    })

    dbLogger.info('Conversation updated successfully', { conversationId })

    return conversation
  }

  /**
   * Cerrar conversación
   */
  async close(conversationId: string, sentiment?: string): Promise<Conversation> {
    dbLogger.info('Closing conversation', { conversationId, sentiment })

    const conversation = await this.update(conversationId, {
      status: 'closed',
      endedAt: new Date(),
      sentiment,
    })

    dbLogger.info('Conversation closed successfully', { conversationId })

    return conversation
  }

  /**
   * Reabrir conversación
   */
  async reopen(conversationId: string): Promise<Conversation> {
    dbLogger.info('Reopening conversation', { conversationId })

    const conversation = await this.update(conversationId, {
      status: 'active',
      endedAt: undefined,
    })

    dbLogger.info('Conversation reopened successfully', { conversationId })

    return conversation
  }

  /**
   * Cambiar modo de conversación (auto/manual/hybrid)
   */
  async setBotMode(conversationId: string, botMode: string): Promise<Conversation> {
    dbLogger.info('Setting bot mode', { conversationId, botMode })

    const conversation = await this.update(conversationId, { botMode })

    dbLogger.info('Bot mode updated successfully', { conversationId, botMode })

    return conversation
  }

  /**
   * Asignar conversación a un agente
   */
  async assign(conversationId: string, assignedTo: string): Promise<Conversation> {
    dbLogger.info('Assigning conversation', { conversationId, assignedTo })

    const conversation = await this.update(conversationId, {
      assignedTo,
      botMode: 'manual', // Cambiar a manual cuando se asigna
    })

    dbLogger.info('Conversation assigned successfully', { conversationId, assignedTo })

    return conversation
  }

  /**
   * Marcar conversación como leída/no leída
   */
  async setUnread(conversationId: string, isUnread: boolean): Promise<Conversation> {
    dbLogger.debug('Setting conversation unread status', { conversationId, isUnread })

    const conversation = await this.update(conversationId, { isUnread })

    dbLogger.debug('Conversation unread status updated', { conversationId, isUnread })

    return conversation
  }

  /**
   * Buscar conversaciones con filtros
   */
  async findMany(filters: ConversationFilters = {}): Promise<Conversation[]> {
    dbLogger.debug('Finding conversations with filters', filters)

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: filters.userId,
        status: filters.status,
        botMode: filters.botMode,
        isUnread: filters.isUnread,
        assignedTo: filters.assignedTo,
      },
      orderBy: { startedAt: filters.orderBy || 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: {
        user: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Solo el último mensaje
        },
      },
    })

    dbLogger.debug('Conversations retrieved with filters', {
      count: conversations.length,
      filters,
    })

    return conversations
  }

  /**
   * Obtener conversaciones no leídas
   */
  async findUnread(): Promise<Conversation[]> {
    dbLogger.debug('Finding unread conversations')

    const conversations = await this.findMany({ isUnread: true })

    dbLogger.debug('Unread conversations retrieved', { count: conversations.length })

    return conversations
  }

  /**
   * Obtener conversaciones activas
   */
  async findActive(): Promise<Conversation[]> {
    dbLogger.debug('Finding active conversations')

    const conversations = await this.findMany({ status: 'active' })

    dbLogger.debug('Active conversations retrieved', { count: conversations.length })

    return conversations
  }

  /**
   * Obtener conversaciones en modo manual
   */
  async findManual(): Promise<Conversation[]> {
    dbLogger.debug('Finding manual conversations')

    const conversations = await this.findMany({ botMode: 'manual' })

    dbLogger.debug('Manual conversations retrieved', { count: conversations.length })

    return conversations
  }

  /**
   * Contar conversaciones con filtros
   */
  async count(filters: ConversationFilters = {}): Promise<number> {
    dbLogger.debug('Counting conversations with filters', filters)

    const count = await prisma.conversation.count({
      where: {
        userId: filters.userId,
        status: filters.status,
        botMode: filters.botMode,
        isUnread: filters.isUnread,
        assignedTo: filters.assignedTo,
      },
    })

    dbLogger.debug('Conversation count result', { count, filters })

    return count
  }

  /**
   * Eliminar conversación por ID
   */
  async delete(conversationId: string): Promise<void> {
    dbLogger.info('Deleting conversation', { conversationId })

    await prisma.conversation.delete({
      where: { id: conversationId },
    })

    dbLogger.info('Conversation deleted successfully', { conversationId })
  }

  /**
   * Obtener estadísticas de conversaciones
   */
  async getStats(): Promise<{
    total: number
    active: number
    closed: number
    manual: number
    unread: number
  }> {
    dbLogger.debug('Getting conversation stats')

    const [total, active, closed, manual, unread] = await Promise.all([
      this.count(),
      this.count({ status: 'active' }),
      this.count({ status: 'closed' }),
      this.count({ botMode: 'manual' }),
      this.count({ isUnread: true }),
    ])

    const stats = { total, active, closed, manual, unread }

    dbLogger.debug('Conversation stats retrieved', stats)

    return stats
  }
}

/**
 * Instancia singleton del repositorio
 */
export const conversationRepository = new ConversationRepository()
