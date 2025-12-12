import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMBEDDINGS_SERVICE_URL = process.env.EMBEDDINGS_SERVICE_URL || 'http://localhost:8001';

/**
 * POST /api/learning/feedback
 * Registrar feedback de una conversación
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      learningId,
      conversationId,
      messageId,
      feedbackType,  // "thumbs_up", "thumbs_down", "star_rating", "flag", "comment"
      rating,        // 1-5 para star_rating
      userComment,
      userPhone,
      source = 'api',
    } = body;

    if (!feedbackType) {
      return NextResponse.json(
        { error: 'feedbackType es requerido' },
        { status: 400 }
      );
    }

    // Validar feedbackType
    const validTypes = ['thumbs_up', 'thumbs_down', 'star_rating', 'flag', 'comment'];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: `feedbackType debe ser uno de: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar rating si es star_rating
    if (feedbackType === 'star_rating' && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'rating debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    // 1. Crear registro de feedback
    const feedback = await prisma.feedbackLog.create({
      data: {
        learningId,
        conversationId,
        messageId,
        feedbackType,
        rating,
        userComment,
        userPhone,
        source,
      },
    });

    // 2. Actualizar ConversationLearning si tiene learningId
    if (learningId) {
      const wasHelpful =
        feedbackType === 'thumbs_up' ? true :
        feedbackType === 'thumbs_down' ? false :
        feedbackType === 'star_rating' ? rating >= 4 :
        null;

      if (wasHelpful !== null) {
        await prisma.conversationLearning.update({
          where: { id: learningId },
          data: {
            wasHelpful,
            helpfulScore: rating,
          },
        });

        // Actualizar en ChromaDB
        try {
          const learning = await prisma.conversationLearning.findUnique({
            where: { id: learningId },
          });

          if (learning?.vectorId) {
            await fetch(`${EMBEDDINGS_SERVICE_URL}/update/${learning.vectorId}?was_helpful=${wasHelpful}`, {
              method: 'PUT',
            });
          }
        } catch (embedError) {
          console.warn('Error updating embedding feedback:', embedError);
        }
      }
    }

    // 3. Actualizar estadísticas diarias
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statsUpdate: any = {};
    if (feedbackType === 'thumbs_up') {
      statsUpdate.positiveFeedback = { increment: 1 };
    } else if (feedbackType === 'thumbs_down') {
      statsUpdate.negativeFeedback = { increment: 1 };
    }

    if (Object.keys(statsUpdate).length > 0) {
      await prisma.learningStats.upsert({
        where: { date: today },
        update: statsUpdate,
        create: {
          date: today,
          positiveFeedback: feedbackType === 'thumbs_up' ? 1 : 0,
          negativeFeedback: feedbackType === 'thumbs_down' ? 1 : 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        feedbackType: feedback.feedbackType,
        rating: feedback.rating,
        createdAt: feedback.createdAt,
      },
      message: 'Feedback registrado correctamente',
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    return NextResponse.json(
      { error: 'Error al registrar feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning/feedback
 * Obtener historial de feedback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const conversationId = searchParams.get('conversationId');

    const where: any = {};
    if (type) where.feedbackType = type;
    if (conversationId) where.conversationId = conversationId;

    const [feedbacks, total] = await Promise.all([
      prisma.feedbackLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.feedbackLog.count({ where }),
    ]);

    // Calcular resumen
    const summary = await prisma.feedbackLog.groupBy({
      by: ['feedbackType'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      feedbacks,
      summary: summary.reduce((acc: Record<string, number>, item: { feedbackType: string; _count: number }) => {
        acc[item.feedbackType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + feedbacks.length < total,
      },
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    return NextResponse.json(
      { error: 'Error al obtener feedback' },
      { status: 500 }
    );
  }
}
