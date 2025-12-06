import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener estadísticas del dashboard
export async function GET(request: NextRequest) {
  try {
    // Estadísticas generales
    const [
      totalConversations,
      activeConversations,
      totalUsers,
      totalMessages,
      unreadConversations,
      autoModeCount,
      manualModeCount,
    ] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({ where: { status: 'active' } }),
      prisma.user.count(),
      prisma.message.count(),
      prisma.conversation.count({ where: { isUnread: true } }),
      prisma.conversation.count({ where: { botMode: 'auto' } }),
      prisma.conversation.count({ where: { botMode: 'manual' } }),
    ]);

    // Mensajes de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messagesToday = await prisma.message.count({
      where: {
        timestamp: {
          gte: today,
        },
      },
    });

    // Mensajes por hora (últimas 24 horas)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMessages = await prisma.message.findMany({
      where: {
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        timestamp: true,
      },
    });

    // Agrupar por hora
    const messagesByHour = recentMessages.reduce((acc: any, msg: any) => {
      const hour = new Date(msg.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      stats: {
        totalConversations,
        activeConversations,
        totalUsers,
        totalMessages,
        unreadConversations,
        messagesToday,
        autoModeCount,
        manualModeCount,
        messagesByHour,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
