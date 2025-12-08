import { prisma } from './prisma';

export class ConversationService {
  /**
   * Obtiene o crea un usuario basado en su número de teléfono
   */
  static async getOrCreateUser(phoneNumber: string, name?: string) {
    try {
      let user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phoneNumber,
            name,
            totalMessages: 0,
          },
        });

        console.log(`✅ Nuevo usuario creado: ${phoneNumber}`);
      } else {
        // Actualizar última interacción
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastContact: new Date(),
            ...(name && !user.name ? { name } : {}),
          },
        });
      }

      return user;
    } catch (error) {
      console.error('Error en getOrCreateUser:', error);
      throw error;
    }
  }

  /**
   * Obtiene o crea una conversación activa para el usuario
   */
  static async getOrCreateConversation(userId: string) {
    try {
      // Buscar conversación activa
      let conversation = await prisma.conversation.findFirst({
        where: {
          userId,
          status: 'active',
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      if (!conversation) {
        // Crear nueva conversación
        conversation = await prisma.conversation.create({
          data: {
            userId,
            status: 'active',
          },
        });

        console.log(`✅ Nueva conversación creada para usuario ${userId}`);
      }

      return conversation;
    } catch (error) {
      console.error('Error en getOrCreateConversation:', error);
      throw error;
    }
  }

  /**
   * Guarda un mensaje en la base de datos
   * Maneja webhooks duplicados de WhatsApp (ignora si ya existe)
   */
  static async saveMessage(data: {
    conversationId: string;
    userId: string;
    type: string;
    content: string;
    direction: 'inbound' | 'outbound';
    sentBy?: string;
    whatsappId?: string;
    caption?: string;
    mediaUrl?: string;
    mediaMimeType?: string;
    aiProcessed?: boolean;
    aiResponse?: string;
    intent?: string;
    entities?: any;
  }) {
    try {
      // Si tiene whatsappId, verificar si ya existe (webhook duplicado)
      if (data.whatsappId) {
        const existingMessage = await prisma.message.findFirst({
          where: { whatsappId: data.whatsappId },
        });

        if (existingMessage) {
          console.log(`⚠️ Mensaje duplicado ignorado: ${data.whatsappId}`);
          return existingMessage;
        }
      }

      const message = await prisma.message.create({
        data: {
          ...data,
          timestamp: new Date(),
        },
      });

      // Actualizar contador de mensajes del usuario
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          totalMessages: { increment: 1 },
          lastContact: new Date(),
        },
      });

      return message;
    } catch (error: any) {
      // Ignorar error de duplicado (P2002) - webhook duplicado de WhatsApp
      if (error?.code === 'P2002') {
        console.log(`⚠️ Webhook duplicado ignorado (whatsappId ya existe)`);
        return null;
      }
      // Ignorar error de foreign key (P2003) - conversación cerrada
      if (error?.code === 'P2003') {
        console.log(`⚠️ Foreign key ignorado (conversación puede estar cerrada)`);
        return null;
      }
      console.error('Error guardando mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de mensajes de una conversación
   */
  static async getConversationHistory(conversationId: string, limit: number = 50) {
    try {
      return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              phoneNumber: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  /**
   * Actualiza una conversación
   */
  static async updateConversation(conversationId: string, data: {
    botMode?: string;
    isUnread?: boolean;
    assignedTo?: string | null;
    status?: string;
    sentiment?: string;
  }) {
    try {
      return await prisma.conversation.update({
        where: { id: conversationId },
        data,
      });
    } catch (error) {
      console.error('Error actualizando conversación:', error);
      throw error;
    }
  }

  /**
   * Cierra una conversación
   */
  static async closeConversation(conversationId: string, sentiment?: string) {
    try {
      return await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'closed',
          endedAt: new Date(),
          ...(sentiment ? { sentiment } : {}),
        },
      });
    } catch (error) {
      console.error('Error cerrando conversación:', error);
      throw error;
    }
  }

  /**
   * Registra analytics de una conversación
   */
  static async recordAnalytics(data: {
    userId: string;
    messagesReceived: number;
    messagesSent: number;
    averageResponseTime?: number;
    conversationDuration?: number;
    satisfactionScore?: number;
    commandsUsed?: any;
    topicsDiscussed?: any;
  }) {
    try {
      return await prisma.userAnalytics.create({
        data: {
          ...data,
          date: new Date(),
        },
      });
    } catch (error) {
      console.error('Error registrando analytics:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de un usuario
   */
  static async getUserStats(userId: string) {
    try {
      const [user, totalConversations, totalMessages, recentAnalytics] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
        }),
        prisma.conversation.count({
          where: { userId },
        }),
        prisma.message.count({
          where: { userId },
        }),
        prisma.userAnalytics.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 30,
        }),
      ]);

      return {
        user,
        totalConversations,
        totalMessages,
        recentAnalytics,
      };
    } catch (error) {
      console.error('Error obteniendo stats:', error);
      throw error;
    }
  }

  /**
   * Registra un evento de webhook
   */
  static async logWebhookEvent(event: string, payload: any, status: string = 'pending', error?: string) {
    try {
      return await prisma.webhookLog.create({
        data: {
          event,
          payload,
          status,
          error,
        },
      });
    } catch (error) {
      console.error('Error logging webhook event:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un webhook log
   */
  static async updateWebhookLog(id: string, status: string, error?: string) {
    try {
      return await prisma.webhookLog.update({
        where: { id },
        data: {
          status,
          error,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating webhook log:', error);
      throw error;
    }
  }

  /**
   * Obtiene el último mensaje saliente de una conversación
   */
  static async getLastOutboundMessage(conversationId: string) {
    try {
      return await prisma.message.findFirst({
        where: {
          conversationId,
          direction: 'outbound',
        },
        orderBy: { timestamp: 'desc' },
      });
    } catch (error) {
      console.error('Error obteniendo último mensaje:', error);
      return null;
    }
  }

  /**
   * Actualiza el contenido de un mensaje (útil para transcripciones de audio)
   */
  static async updateMessageContent(
    conversationId: string,
    whatsappId: string,
    newContent: string
  ) {
    try {
      return await prisma.message.updateMany({
        where: {
          conversationId,
          whatsappId,
        },
        data: {
          content: newContent,
        },
      });
    } catch (error) {
      console.error('Error actualizando contenido del mensaje:', error);
      return null;
    }
  }
}

export default ConversationService;