import { prisma } from '@/lib/prisma';
import { User, Conversation, Message } from '@prisma/client';

/**
 * Helper para obtener mensajes de una conversación específica
 */
export async function getMessagesForConversation(conversationId: string): Promise<Message[]> {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'asc' }
  });
}

/**
 * Helper para obtener un usuario por número de teléfono
 */
export async function getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { phoneNumber }
  });
}

/**
 * Helper para obtener una conversación por ID
 */
export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  return await prisma.conversation.findUnique({
    where: { id: conversationId }
  });
}

/**
 * Helper para obtener conversaciones de un usuario
 */
export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
  return await prisma.conversation.findMany({
    where: { userId }
  });
}

/**
 * Helper para contar mensajes de un tipo específico en una conversación
 */
export async function countMessagesByType(conversationId: string, messageType: string): Promise<number> {
  return await prisma.message.count({
    where: {
      conversationId,
      type: messageType
    }
  });
}

/**
 * Helper para limpiar datos de prueba
 */
export async function clearTestData() {
  // Eliminar mensajes relacionados con usuarios de prueba
  await prisma.message.deleteMany({
    where: {
      conversation: {
        user: {
          phoneNumber: {
            startsWith: '569' // Números de prueba típicos
          }
        }
      }
    }
  });

  // Eliminar conversaciones de usuarios de prueba
  await prisma.conversation.deleteMany({
    where: {
      user: {
        phoneNumber: {
          startsWith: '569'
        }
      }
    }
  });

  // Eliminar usuarios de prueba
  await prisma.user.deleteMany({
    where: {
      phoneNumber: {
        startsWith: '569'
      }
    }
  });
}

/**
 * Helper para verificar si existe una conversación activa para un usuario
 */
export async function hasActiveConversation(userId: string): Promise<boolean> {
  const activeConversations = await prisma.conversation.findMany({
    where: {
      userId,
      status: "active",
      startedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dentro de las últimas 24 horas
      }
    }
  });

  return activeConversations.length > 0;
}

/**
 * Helper para obtener el historial de una conversación
 */
export async function getConversationHistory(conversationId: string) {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'asc' },
    select: {
      type: true,
      content: true,
      direction: true,
      timestamp: true
    }
  });
}