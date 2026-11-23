import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener todas las conversaciones con información del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';
    const botMode = searchParams.get('botMode');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where: any = { status };

    if (botMode) {
      where.botMode = botMode;
    }

    if (unreadOnly) {
      where.isUnread = true;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
            profilePicUrl: true,
            isVIP: true,
          },
        },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Solo el último mensaje
        },
      },
      orderBy: [
        { isUnread: 'desc' },
        { startedAt: 'desc' },
      ],
    });

    // Ordenar con precisión: primero no leídas, y luego por la fecha del último mensaje recibido/enviado
    conversations.sort((a, b) => {
      if (a.isUnread !== b.isUnread) {
        return a.isUnread ? -1 : 1;
      }
      const timeA = a.messages[0]?.timestamp ? new Date(a.messages[0].timestamp).getTime() : new Date(a.startedAt).getTime();
      const timeB = b.messages[0]?.timestamp ? new Date(b.messages[0].timestamp).getTime() : new Date(b.startedAt).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}

// PUT - Acciones en lote (marcar todo como leído, etc.)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'markAllAsRead') {
      // Marcar todas las conversaciones como leídas
      const result = await prisma.conversation.updateMany({
        where: { isUnread: true },
        data: { isUnread: false },
      });

      return NextResponse.json({
        success: true,
        updated: result.count,
        message: `${result.count} conversaciones marcadas como leídas`,
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in bulk action:', error);
    return NextResponse.json(
      { error: 'Error al ejecutar acción' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una conversación (cambiar modo bot, marcar como leído, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, botMode, isUnread, assignedTo, status } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId es requerido' },
        { status: 400 }
      );
    }

    // Obtener conversación actual antes de actualizar
    const currentConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { user: true },
    });

    const updateData: any = {};

    if (botMode !== undefined) updateData.botMode = botMode;
    if (isUnread !== undefined) updateData.isUnread = isUnread;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status !== undefined) updateData.status = status;

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        user: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    // Si cambió de auto a manual, enviar mensaje de transición
    if (currentConversation && botMode === 'manual' && currentConversation.botMode === 'auto') {
      const transitionMessage = `Un momento, te estoy conectando con un asesor...\n\n⏳ En breve te atenderá una persona real`;

      // Enviar mensaje por WhatsApp
      try {
        const phoneNumber = currentConversation.user.phoneNumber.replace(/[+\s-]/g, '');

        await fetch(
          `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phoneNumber,
              type: 'text',
              text: { body: transitionMessage },
            }),
          }
        );

        // Guardar mensaje en BD
        await prisma.message.create({
          data: {
            conversationId,
            userId: currentConversation.userId,
            type: 'text',
            content: transitionMessage,
            direction: 'outbound',
            sentBy: 'system',
          },
        });

        console.log('📨 Mensaje de transición enviado al cambiar a modo manual');
      } catch (error) {
        console.error('Error enviando mensaje de transición:', error);
      }
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Error al actualizar conversación' },
      { status: 500 }
    );
  }
}
