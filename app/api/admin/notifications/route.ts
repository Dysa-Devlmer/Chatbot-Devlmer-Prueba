import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Obtener notificaciones reales agrupadas y accionables
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 1. Obtener conteo de conversaciones no leídas
    const unreadCount = await prisma.conversation.count({
      where: { isUnread: true },
    });

    // 2. Obtener conversaciones no leídas (agrupadas por cliente para no repetir)
    const unreadConversations = await prisma.conversation.findMany({
      where: { isUnread: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            profilePicUrl: true,
          },
        },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 8,
    });

    // 3. Obtener pedidos pendientes en cocina
    const pendingOrders = await prisma.order.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    const notifications: Array<{
      id: string;
      type: 'new_message' | 'new_order';
      icon: string;
      title: string;
      text: string;
      time: Date | string;
      url: string;
      isUnread: boolean;
      relativeTime?: string;
    }> = [];

    // Transformar pedidos pendientes
    for (const order of pendingOrders) {
      notifications.push({
        id: `order-${order.id}`,
        type: 'new_order',
        icon: '🍗',
        title: `Nuevo Pedido #${order.orderNumber}`,
        text: `${order.customerName} • ${order.totalAmount ? `Total: S/. ${order.totalAmount.toFixed(2)}` : 'Por confirmar'}`,
        time: order.createdAt,
        url: '/admin/orders',
        isUnread: true,
      });
    }

    // Transformar conversaciones no leídas
    for (const conv of unreadConversations) {
      const lastMsg = conv.messages[0];
      const callerName = conv.user.name || `+${conv.user.phoneNumber}`;
      const snippet = lastMsg?.content || 'Nuevo mensaje de WhatsApp';

      notifications.push({
        id: `conv-${conv.id}`,
        type: 'new_message',
        icon: '💬',
        title: callerName,
        text: snippet.length > 50 ? snippet.substring(0, 48) + '...' : snippet,
        time: lastMsg?.timestamp || conv.startedAt,
        url: `/admin/inbox?conversationId=${conv.id}`,
        isUnread: true,
      });
    }

    // Ordenar de más reciente a más antiguo
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Calcular tiempo relativo
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
    return `Hace ${minutes} ${minutes === 1 ? 'min' : 'min'}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  } else {
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}
