/**
 * MessageRepository
 *
 * Repository para operaciones de mensajes en la base de datos.
 * Responsable de:
 * - Guardar mensajes entrantes y salientes
 * - Actualizar estado de mensajes
 * - Consultar historial de mensajes
 * - Detectar duplicados (webhook retry)
 */

import { prisma } from '@/lib/prisma'
import { Message } from '@prisma/client'
import { dbLogger } from '@/lib/logger'

/**
 * Datos para crear un mensaje
 */
export interface CreateMessageData {
  conversationId: string
  userId: string
  type: string
  content: string
  direction: 'inbound' | 'outbound'
  sentBy?: string
  whatsappId?: string
  caption?: string
  mediaUrl?: string
  mediaMimeType?: string
  mediaSize?: number
  aiProcessed?: boolean
  aiResponse?: string
  intent?: string
  entities?: any
}

/**
 * Datos para actualizar un mensaje
 */
export interface UpdateMessageData {
  status?: string
  content?: string
  aiResponse?: string
  intent?: string
  entities?: any
}

/**
 * Filtros para buscar mensajes
 */
export interface MessageFilters {
  conversationId?: string
  userId?: string
  direction?: 'inbound' | 'outbound'
  type?: string
  limit?: number
  offset?: number
  orderBy?: 'asc' | 'desc'
}

/**
 * Repository para operaciones con mensajes
 */
export class MessageRepository {
  /**
   * Verificar si existe un mensaje por WhatsApp ID (para detectar duplicados)
   */
  async existsByWhatsAppId(whatsappId: string): Promise<boolean> {
    dbLogger.debug('Checking if message exists', { whatsappId })

    const count = await prisma.message.count({
      where: { whatsappId },
    })

    const exists = count > 0

    dbLogger.debug('Message existence check', { whatsappId, exists })

    return exists
  }

  /**
   * Crear un nuevo mensaje
   */
  async create(data: CreateMessageData): Promise<Message | null> {
    // Verificar duplicados si tiene whatsappId
    if (data.whatsappId) {
      const exists = await this.existsByWhatsAppId(data.whatsappId)
      if (exists) {
        dbLogger.warn('Duplicate message detected, skipping creation', {
          whatsappId: data.whatsappId,
        })
        return null
      }
    }

    dbLogger.info('Creating message', {
      conversationId: data.conversationId,
      type: data.type,
      direction: data.direction,
      whatsappId: data.whatsappId,
    })

    try {
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          userId: data.userId,
          type: data.type,
          content: data.content,
          direction: data.direction,
          sentBy: data.sentBy,
          whatsappId: data.whatsappId,
          caption: data.caption,
          mediaUrl: data.mediaUrl,
          mediaMimeType: data.mediaMimeType,
          mediaSize: data.mediaSize,
          aiProcessed: data.aiProcessed,
          aiResponse: data.aiResponse,
          intent: data.intent,
          entities: data.entities,
        },
      })

      dbLogger.info('Message created successfully', {
        messageId: message.id,
        conversationId: message.conversationId,
      })

      return message
    } catch (error) {
      // Si falla por foreign key (conversación cerrada), loguear y retornar null
      if (error instanceof Error && error.message.includes('Foreign key constraint')) {
        dbLogger.warn('Foreign key constraint violated, conversation may be closed', {
          conversationId: data.conversationId,
        })
        return null
      }

      dbLogger.error('Failed to create message', {
        error: error instanceof Error ? error.message : String(error),
        data,
      })

      throw error
    }
  }

  /**
   * Actualizar un mensaje por ID
   */
  async update(messageId: string, data: UpdateMessageData): Promise<Message> {
    dbLogger.info('Updating message', { messageId, data })

    const message = await prisma.message.update({
      where: { id: messageId },
      data,
    })

    dbLogger.info('Message updated successfully', { messageId })

    return message
  }

  /**
   * Actualizar estado de un mensaje por WhatsApp ID
   */
  async updateStatusByWhatsAppId(whatsappId: string, status: string): Promise<Message | null> {
    dbLogger.info('Updating message status', { whatsappId, status })

    try {
      const message = await prisma.message.update({
        where: { whatsappId },
        data: { status },
      })

      dbLogger.info('Message status updated successfully', { whatsappId, status })

      return message
    } catch (error) {
      dbLogger.warn('Message not found for status update', { whatsappId, status })
      return null
    }
  }

  /**
   * Actualizar contenido de un mensaje por WhatsApp ID
   */
  async updateContentByWhatsAppId(
    conversationId: string,
    whatsappId: string,
    content: string
  ): Promise<Message | null> {
    dbLogger.info('Updating message content', { conversationId, whatsappId })

    try {
      const message = await prisma.message.update({
        where: { whatsappId },
        data: { content },
      })

      dbLogger.info('Message content updated successfully', { whatsappId })

      return message
    } catch (error) {
      dbLogger.warn('Message not found for content update', { whatsappId })
      return null
    }
  }

  /**
   * Obtener un mensaje por ID
   */
  async findById(messageId: string): Promise<Message | null> {
    dbLogger.debug('Finding message by ID', { messageId })

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    dbLogger.debug('Message lookup result', {
      messageId,
      found: message !== null,
    })

    return message
  }

  /**
   * Obtener mensajes de una conversación
   */
  async findByConversation(
    conversationId: string,
    limit: number = 50,
    orderBy: 'asc' | 'desc' = 'asc'
  ): Promise<Message[]> {
    dbLogger.debug('Finding messages by conversation', {
      conversationId,
      limit,
      orderBy,
    })

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: orderBy },
      take: limit,
    })

    dbLogger.debug('Messages retrieved', {
      conversationId,
      count: messages.length,
    })

    return messages
  }

  /**
   * Obtener último mensaje de una conversación
   */
  async findLastByConversation(conversationId: string): Promise<Message | null> {
    dbLogger.debug('Finding last message in conversation', { conversationId })

    const message = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
    })

    dbLogger.debug('Last message lookup result', {
      conversationId,
      found: message !== null,
    })

    return message
  }

  /**
   * Obtener último mensaje saliente de una conversación
   */
  async findLastOutbound(conversationId: string): Promise<Message | null> {
    dbLogger.debug('Finding last outbound message', { conversationId })

    const message = await prisma.message.findFirst({
      where: {
        conversationId,
        direction: 'outbound',
      },
      orderBy: { timestamp: 'desc' },
    })

    dbLogger.debug('Last outbound message lookup result', {
      conversationId,
      found: message !== null,
    })

    return message
  }

  /**
   * Buscar mensajes con filtros
   */
  async findMany(filters: MessageFilters): Promise<Message[]> {
    dbLogger.debug('Finding messages with filters', filters)

    const messages = await prisma.message.findMany({
      where: {
        conversationId: filters.conversationId,
        userId: filters.userId,
        direction: filters.direction,
        type: filters.type,
      },
      orderBy: { timestamp: filters.orderBy || 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    })

    dbLogger.debug('Messages retrieved with filters', {
      count: messages.length,
      filters,
    })

    return messages
  }

  /**
   * Contar mensajes de una conversación
   */
  async countByConversation(conversationId: string): Promise<number> {
    dbLogger.debug('Counting messages in conversation', { conversationId })

    const count = await prisma.message.count({
      where: { conversationId },
    })

    dbLogger.debug('Message count result', { conversationId, count })

    return count
  }

  /**
   * Eliminar mensaje por ID
   */
  async delete(messageId: string): Promise<void> {
    dbLogger.info('Deleting message', { messageId })

    await prisma.message.delete({
      where: { id: messageId },
    })

    dbLogger.info('Message deleted successfully', { messageId })
  }

  /**
   * Eliminar mensajes de una conversación
   */
  async deleteByConversation(conversationId: string): Promise<number> {
    dbLogger.info('Deleting messages by conversation', { conversationId })

    const result = await prisma.message.deleteMany({
      where: { conversationId },
    })

    dbLogger.info('Messages deleted successfully', {
      conversationId,
      count: result.count,
    })

    return result.count
  }
}

/**
 * Instancia singleton del repositorio
 */
export const messageRepository = new MessageRepository()
