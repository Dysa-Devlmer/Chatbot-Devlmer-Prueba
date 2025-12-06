import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener mensajes de una conversación específica
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId es requerido' },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        user: {
          select: {
            phoneNumber: true,
            name: true,
            profilePicUrl: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

// POST - Enviar un mensaje manual desde el panel admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, content, phoneNumber } = body;

    if (!conversationId || !content || !phoneNumber) {
      return NextResponse.json(
        { error: 'conversationId, content y phoneNumber son requeridos' },
        { status: 400 }
      );
    }

    // 1. Limpiar el número de teléfono (quitar + y espacios)
    const cleanPhoneNumber = phoneNumber.replace(/[+\s-]/g, '');

    // 2. Agregar firma como título del mensaje manual
    const messageWithSignature = `👤 *Atención personalizada*\n\n${content}`;

    // 3. Enviar mensaje por WhatsApp API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhoneNumber,
          type: 'text',
          text: { body: messageWithSignature },
        }),
      }
    );

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);
      return NextResponse.json(
        { error: 'Error al enviar mensaje por WhatsApp' },
        { status: 500 }
      );
    }

    // 2. Obtener el usuario de la conversación
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { user: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // 4. Guardar mensaje en la base de datos (con firma)
    const message = await prisma.message.create({
      data: {
        conversationId,
        userId: conversation.userId,
        type: 'text',
        content: messageWithSignature,
        direction: 'outbound',
        sentBy: 'human',
        whatsappId: whatsappData.messages?.[0]?.id,
        status: 'sent',
      },
      include: {
        user: {
          select: {
            phoneNumber: true,
            name: true,
            profilePicUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ message, whatsappData });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
