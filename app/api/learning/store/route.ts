import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMBEDDINGS_SERVICE_URL = process.env.EMBEDDINGS_SERVICE_URL || 'http://localhost:8001';

/**
 * POST /api/learning/store
 * Guardar una conversación para aprendizaje
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversationId,
      userMessage,
      botResponse,
      wasHelpful,
      intent,
      category,
      userPhone,
      context,
      responseTime,
    } = body;

    if (!userMessage || !botResponse) {
      return NextResponse.json(
        { error: 'userMessage y botResponse son requeridos' },
        { status: 400 }
      );
    }

    // 1. Guardar en SQLite (Prisma)
    const learning = await prisma.conversationLearning.create({
      data: {
        conversationId,
        userMessage,
        botResponse,
        wasHelpful,
        intent,
        category,
        userPhone,
        context: context ? JSON.stringify(context) : undefined,
        responseTime,
      },
    });

    // 2. Guardar embedding en ChromaDB (async, no bloquea)
    let vectorId = null;
    try {
      const embedResponse = await fetch(`${EMBEDDINGS_SERVICE_URL}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: learning.id,
          user_message: userMessage,
          bot_response: botResponse,
          was_helpful: wasHelpful,
          intent,
          category,
          user_phone: userPhone,
        }),
      });

      if (embedResponse.ok) {
        const embedData = await embedResponse.json();
        vectorId = embedData.vector_id;

        // Actualizar el registro con el vectorId
        await prisma.conversationLearning.update({
          where: { id: learning.id },
          data: { vectorId },
        });
      }
    } catch (embedError) {
      console.warn('Error storing embedding (non-blocking):', embedError);
      // No fallar si el servicio de embeddings no está disponible
    }

    // 3. Actualizar estadísticas diarias
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.learningStats.upsert({
      where: { date: today },
      update: {
        totalLearnings: { increment: 1 },
      },
      create: {
        date: today,
        totalLearnings: 1,
      },
    });

    return NextResponse.json({
      success: true,
      learning: {
        id: learning.id,
        vectorId,
        userMessage: learning.userMessage,
        botResponse: learning.botResponse,
        createdAt: learning.createdAt,
      },
      message: 'Conversación guardada para aprendizaje',
    });
  } catch (error) {
    console.error('Error storing learning:', error);
    return NextResponse.json(
      { error: 'Error al guardar conversación' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning/store
 * Obtener conversaciones guardadas
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const helpful = searchParams.get('helpful');

    const where: any = {};
    if (helpful === 'true') where.wasHelpful = true;
    if (helpful === 'false') where.wasHelpful = false;

    const [learnings, total] = await Promise.all([
      prisma.conversationLearning.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.conversationLearning.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      learnings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + learnings.length < total,
      },
    });
  } catch (error) {
    console.error('Error getting learnings:', error);
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/store
 * Eliminar una conversación de aprendizaje
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    // Obtener el vectorId antes de eliminar
    const learning = await prisma.conversationLearning.findUnique({
      where: { id },
    });

    if (!learning) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar de SQLite
    await prisma.conversationLearning.delete({
      where: { id },
    });

    // Eliminar de ChromaDB si tiene vectorId
    if (learning.vectorId) {
      try {
        await fetch(`${EMBEDDINGS_SERVICE_URL}/delete/${learning.vectorId}`, {
          method: 'DELETE',
        });
      } catch (embedError) {
        console.warn('Error deleting embedding:', embedError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Conversación eliminada',
    });
  } catch (error) {
    console.error('Error deleting learning:', error);
    return NextResponse.json(
      { error: 'Error al eliminar conversación' },
      { status: 500 }
    );
  }
}
