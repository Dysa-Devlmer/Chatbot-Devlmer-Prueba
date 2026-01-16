import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Search conversations and messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        message: 'La búsqueda debe tener al menos 2 caracteres',
      });
    }

    // Search users by phone number or name
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { phoneNumber: { contains: query } },
          { name: { contains: query } },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        lastContact: true,
      },
      take: 5,
    });

    // Search messages by content
    const messages = await prisma.message.findMany({
      where: {
        content: { contains: query },
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
            id: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Format results
    const results = [];

    // Add user results
    for (const user of users) {
      results.push({
        id: user.id,
        type: 'user',
        icon: '👤',
        title: user.name || user.phoneNumber,
        subtitle: user.phoneNumber,
        link: `/admin/inbox?user=${user.id}`,
        time: user.lastContact,
      });
    }

    // Add message results
    for (const msg of messages) {
      results.push({
        id: msg.id,
        type: 'message',
        icon: msg.direction === 'inbound' ? '📩' : '📤',
        title: msg.content.substring(0, 60) + (msg.content.length > 60 ? '...' : ''),
        subtitle: `De: ${msg.user.name || msg.user.phoneNumber}`,
        link: `/admin/inbox?conversation=${msg.conversation.id}`,
        time: msg.timestamp,
      });
    }

    // Sort by time
    results.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      results: results.slice(0, 10),
      total: results.length,
      query,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Error en la búsqueda' },
      { status: 500 }
    );
  }
}
