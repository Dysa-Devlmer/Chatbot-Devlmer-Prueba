import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { aiLogger, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const models = [
      {
        id: 'sonar-pro',
        name: 'Sonar Pro (Recomendado)',
        provider: 'perplexity',
        recommended: true,
      },
      {
        id: 'sonar',
        name: 'Sonar',
        provider: 'perplexity',
        recommended: false,
      },
      {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet (Fallback)',
        provider: 'anthropic',
        recommended: false,
      },
    ];

    aiLogger.info('AI models fetched', { count: models.length });
    return NextResponse.json({ models });
  } catch (error) {
    logError(aiLogger, error, { stage: 'ai-models' });
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
