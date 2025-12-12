import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMBEDDINGS_SERVICE_URL = process.env.EMBEDDINGS_SERVICE_URL || 'http://localhost:8001';

/**
 * GET /api/learning/stats
 * Obtener estadísticas del sistema de aprendizaje
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Estadísticas de ConversationLearning
    const [totalLearnings, helpfulCount, notHelpfulCount, pendingCount] = await Promise.all([
      prisma.conversationLearning.count(),
      prisma.conversationLearning.count({ where: { wasHelpful: true } }),
      prisma.conversationLearning.count({ where: { wasHelpful: false } }),
      prisma.conversationLearning.count({ where: { wasHelpful: null } }),
    ]);

    // 2. Estadísticas de feedback
    const feedbackStats = await prisma.feedbackLog.groupBy({
      by: ['feedbackType'],
      _count: true,
    });

    const feedbackSummary = feedbackStats.reduce((acc: Record<string, number>, item: { feedbackType: string; _count: number }) => {
      acc[item.feedbackType] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // 3. Estadísticas por categoría
    const categoryStats = await prisma.conversationLearning.groupBy({
      by: ['category'],
      _count: true,
      where: {
        category: { not: null },
      },
    });

    // 4. Estadísticas por intención
    const intentStats = await prisma.conversationLearning.groupBy({
      by: ['intent'],
      _count: true,
      where: {
        intent: { not: null },
      },
    });

    // 5. Estadísticas de los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await prisma.learningStats.findMany({
      where: {
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // 6. Preguntas más frecuentes
    const topPatterns = await prisma.frequentPattern.findMany({
      orderBy: { frequency: 'desc' },
      take: 10,
      where: { isActive: true },
    });

    // 7. Estadísticas del servicio de embeddings
    let embeddingsStats = {
      total_embeddings: 0,
      ollama_status: 'unknown',
      chromadb_status: 'unknown',
    };

    try {
      const embedResponse = await fetch(`${EMBEDDINGS_SERVICE_URL}/stats`);
      if (embedResponse.ok) {
        embeddingsStats = await embedResponse.json();
      }
    } catch (error) {
      console.warn('Embeddings service not available');
    }

    // 8. Calcular métricas
    const totalFeedback = (feedbackSummary.thumbs_up || 0) + (feedbackSummary.thumbs_down || 0);
    const satisfactionRate = totalFeedback > 0
      ? ((feedbackSummary.thumbs_up || 0) / totalFeedback * 100).toFixed(1)
      : 0;

    // 9. Conversaciones recientes
    const recentLearnings = await prisma.conversationLearning.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        userMessage: true,
        botResponse: true,
        wasHelpful: true,
        intent: true,
        category: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalLearnings,
          helpfulCount,
          notHelpfulCount,
          pendingEvaluation: pendingCount,
          satisfactionRate: `${satisfactionRate}%`,
        },
        feedback: {
          total: totalFeedback,
          ...feedbackSummary,
        },
        categories: categoryStats.map((c: { category: string | null; _count: number }) => ({
          category: c.category || 'sin_categoria',
          count: c._count,
        })),
        intents: intentStats.map((i: { intent: string | null; _count: number }) => ({
          intent: i.intent || 'sin_intent',
          count: i._count,
        })),
        daily: dailyStats,
        topPatterns,
        embeddings: embeddingsStats,
        recent: recentLearnings,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/stats
 * Actualizar estadísticas manuales
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'refresh') {
      // Recalcular estadísticas del día
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalLearnings, positiveFeedback, negativeFeedback] = await Promise.all([
        prisma.conversationLearning.count({
          where: {
            createdAt: { gte: today },
          },
        }),
        prisma.feedbackLog.count({
          where: {
            feedbackType: 'thumbs_up',
            createdAt: { gte: today },
          },
        }),
        prisma.feedbackLog.count({
          where: {
            feedbackType: 'thumbs_down',
            createdAt: { gte: today },
          },
        }),
      ]);

      await prisma.learningStats.upsert({
        where: { date: today },
        update: {
          totalLearnings,
          positiveFeedback,
          negativeFeedback,
          updatedAt: new Date(),
        },
        create: {
          date: today,
          totalLearnings,
          positiveFeedback,
          negativeFeedback,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Estadísticas actualizadas',
        stats: {
          totalLearnings,
          positiveFeedback,
          negativeFeedback,
        },
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating stats:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estadísticas' },
      { status: 500 }
    );
  }
}
