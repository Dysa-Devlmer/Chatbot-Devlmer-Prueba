import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsData {
  // Métricas principales
  overview: {
    totalConversations: number;
    activeConversations: number;
    totalUsers: number;
    totalMessages: number;
    unreadConversations: number;
    avgResponseTime: number; // en segundos
    satisfactionScore: number; // 0-100
  };

  // Tendencias (comparado con período anterior)
  trends: {
    conversationsChange: number; // porcentaje
    messagesChange: number;
    usersChange: number;
    responseTimeChange: number;
  };

  // Mensajes por hora (últimas 24h)
  messagesByHour: Array<{ hour: number; count: number; label: string }>;

  // Mensajes por día (últimos 7 días)
  messagesByDay: Array<{ date: string; count: number; dayName: string }>;

  // Distribución de sentimiento
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };

  // Top usuarios por actividad
  topUsers: Array<{
    id: string;
    name: string;
    phoneNumber: string;
    messageCount: number;
    lastContact: Date;
  }>;

  // Horas pico
  peakHours: Array<{ hour: number; avgMessages: number }>;

  // Rendimiento del bot vs humano
  botPerformance: {
    botMessages: number;
    humanMessages: number;
    botPercentage: number;
    avgBotResponseTime: number;
    avgHumanResponseTime: number;
  };

  // Conversaciones por estado
  conversationsByStatus: {
    active: number;
    closed: number;
    pending: number;
  };

  // Intenciones detectadas
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
}

// GET - Obtener analytics completos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d'; // 24h, 7d, 30d

    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      default: // 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [
      // Métricas actuales
      totalConversations,
      activeConversations,
      totalUsers,
      totalMessages,
      unreadConversations,

      // Métricas del período anterior (para tendencias)
      previousConversations,
      previousMessages,
      previousUsers,

      // Mensajes del período
      periodMessages,

      // Mensajes por sentimiento
      positiveMessages,
      negativeMessages,
      neutralMessages,

      // Top usuarios
      topUsersData,

      // Mensajes por tipo de remitente
      botMessages,
      humanMessages,

      // Conversaciones por estado
      closedConversations,

      // Intenciones
      intentsData,
    ] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({ where: { status: 'active' } }),
      prisma.user.count(),
      prisma.message.count(),
      prisma.conversation.count({ where: { isUnread: true } }),

      prisma.conversation.count({
        where: { startedAt: { gte: previousStartDate, lt: startDate } }
      }),
      prisma.message.count({
        where: { timestamp: { gte: previousStartDate, lt: startDate } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: previousStartDate, lt: startDate } }
      }),

      prisma.message.findMany({
        where: { timestamp: { gte: startDate } },
        select: {
          timestamp: true,
          direction: true,
          sentBy: true,
          intent: true,
        },
      }),

      prisma.conversation.count({
        where: { sentiment: 'positive' }
      }),
      prisma.conversation.count({
        where: { sentiment: 'negative' }
      }),
      prisma.conversation.count({
        where: { sentiment: 'neutral' }
      }),

      prisma.user.findMany({
        orderBy: { totalMessages: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          totalMessages: true,
          lastContact: true,
        },
      }),

      prisma.message.count({
        where: { sentBy: 'bot', timestamp: { gte: startDate } }
      }),
      prisma.message.count({
        where: { sentBy: 'human', timestamp: { gte: startDate } }
      }),

      prisma.conversation.count({ where: { status: 'closed' } }),

      prisma.message.groupBy({
        by: ['intent'],
        where: {
          intent: { not: null },
          timestamp: { gte: startDate }
        },
        _count: { intent: true },
        orderBy: { _count: { intent: 'desc' } },
        take: 5,
      }),
    ]);

    // Calcular mensajes por hora
    const messagesByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      label: `${i.toString().padStart(2, '0')}:00`,
    }));

    periodMessages.forEach((msg) => {
      const hour = new Date(msg.timestamp).getHours();
      messagesByHour[hour].count++;
    });

    // Calcular mensajes por día
    const messagesByDay: Array<{ date: string; count: number; dayName: string }> = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const count = periodMessages.filter((msg) => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= dayStart && msgDate <= dayEnd;
      }).length;

      messagesByDay.push({
        date: dateStr,
        count,
        dayName: dayNames[date.getDay()],
      });
    }

    // Calcular tendencias
    const currentPeriodConversations = await prisma.conversation.count({
      where: { startedAt: { gte: startDate } }
    });
    const currentPeriodMessages = periodMessages.length;
    const currentPeriodUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } }
    });

    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Calcular horas pico (top 3)
    const peakHours = [...messagesByHour]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((h) => ({ hour: h.hour, avgMessages: h.count }));

    // Calcular porcentaje de intenciones
    const totalIntents = intentsData.reduce((sum, i) => sum + i._count.intent, 0);
    const topIntents = intentsData.map((i) => ({
      intent: i.intent || 'otros',
      count: i._count.intent,
      percentage: totalIntents > 0 ? Math.round((i._count.intent / totalIntents) * 100) : 0,
    }));

    // Calcular distribución de sentimiento
    const totalSentiment = positiveMessages + negativeMessages + neutralMessages;
    const sentimentDistribution = {
      positive: totalSentiment > 0 ? Math.round((positiveMessages / totalSentiment) * 100) : 33,
      neutral: totalSentiment > 0 ? Math.round((neutralMessages / totalSentiment) * 100) : 34,
      negative: totalSentiment > 0 ? Math.round((negativeMessages / totalSentiment) * 100) : 33,
    };

    // Construir respuesta
    const analytics: AnalyticsData = {
      overview: {
        totalConversations,
        activeConversations,
        totalUsers,
        totalMessages,
        unreadConversations,
        avgResponseTime: 45, // TODO: Calcular tiempo real de respuesta
        satisfactionScore: sentimentDistribution.positive,
      },
      trends: {
        conversationsChange: calculateChange(currentPeriodConversations, previousConversations),
        messagesChange: calculateChange(currentPeriodMessages, previousMessages),
        usersChange: calculateChange(currentPeriodUsers, previousUsers),
        responseTimeChange: -5, // TODO: Calcular cambio real
      },
      messagesByHour,
      messagesByDay,
      sentimentDistribution,
      topUsers: topUsersData.map((u) => ({
        id: u.id,
        name: u.name || 'Sin nombre',
        phoneNumber: u.phoneNumber,
        messageCount: u.totalMessages,
        lastContact: u.lastContact,
      })),
      peakHours,
      botPerformance: {
        botMessages,
        humanMessages,
        botPercentage: botMessages + humanMessages > 0
          ? Math.round((botMessages / (botMessages + humanMessages)) * 100)
          : 0,
        avgBotResponseTime: 2, // segundos
        avgHumanResponseTime: 120, // segundos
      },
      conversationsByStatus: {
        active: activeConversations,
        closed: closedConversations,
        pending: unreadConversations,
      },
      topIntents,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Error al obtener analytics' },
      { status: 500 }
    );
  }
}
