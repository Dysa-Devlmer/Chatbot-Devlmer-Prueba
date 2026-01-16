import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get notifications based on real data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get unread conversation count
    const unreadCount = await prisma.conversation.count({
      where: { isUnread: true },
    });

    // Get recent inbound messages (last 10)
    const recentMessages = await prisma.message.findMany({
      where: {
        direction: 'inbound',
      },
      include: {
        user: {
          select: {
            phoneNumber: true,
            name: true,
          },
        },
        conversation: {
          select: {
            isUnread: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Get bot auto-responses (last 5)
    const botResponses = await prisma.message.findMany({
      where: {
        direction: 'outbound',
        sentBy: 'bot',
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    // Transform to notifications
    const notifications = [];

    // Add unread message notifications
    for (const msg of recentMessages) {
      if (msg.conversation.isUnread) {
        notifications.push({
          id: msg.id,
          type: 'new_message',
          icon: '💬',
          title: 'Nuevo mensaje',
          text: `Mensaje de ${msg.user.name || msg.user.phoneNumber}`,
          time: msg.timestamp,
          isUnread: true,
        });
      }
    }

    // Add bot response notifications (limit to 3)
    for (const msg of botResponses.slice(0, 3)) {
      notifications.push({
        id: msg.id,
        type: 'bot_response',
        icon: '🤖',
        title: 'Respuesta automática',
        text: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        time: msg.timestamp,
        isUnread: false,
      });
    }

    // Sort by time
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Calculate relative time
    const notificationsWithRelativeTime = notifications.slice(0, 10).map((notif) => ({
      ...notif,
      relativeTime: getRelativeTime(new Date(notif.time)),
    }));

    return NextResponse.json({
      notifications: notificationsWithRelativeTime,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Ahora mismo';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  } else {
    return date.toLocaleDateString('es-CL');
  }
}
