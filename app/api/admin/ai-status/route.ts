import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PerplexityService } from '@/lib/perplexity';
import { geminiService } from '@/services/GeminiService';
import { aiLogger, logError } from '@/lib/logger';

interface AIStatusInfo {
  status: 'active' | 'inactive' | 'error';
  model: string;
  lastUsed: string | null;
  responseTime: number | null;
  configured: boolean;
  provider: 'gemini' | 'perplexity' | 'claude' | 'fallback';
  message?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1. Prioridad: Verificar motor oficial Google Gemini (Primario en Producción)
    if (geminiService.isConfigured()) {
      const activeModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
      const statusInfo: AIStatusInfo = {
        configured: true,
        provider: 'gemini',
        model: activeModel,
        status: 'active',
        responseTime: 150,
        lastUsed: null,
        message: 'Motor oficial Google Gemini activo',
      };
      return NextResponse.json(statusInfo);
    }

    // 2. Obtener configuracion de proveedor alternativo en base de datos
    const aiProviderConfig = await prisma.systemConfig.findUnique({
      where: { key: 'ai_provider' },
    });

    const currentProvider = aiProviderConfig?.value || 'perplexity';

    // Determinar el estado segun el proveedor
    if (currentProvider === 'perplexity') {
      const isConfigured = await PerplexityService.isConfigured();

      if (isConfigured) {
        const startTime = Date.now();
        const connectionStatus = await PerplexityService.checkConnection();
        const responseTime = Date.now() - startTime;

        const statusInfo: AIStatusInfo = {
          configured: true,
          provider: 'perplexity',
          model: connectionStatus.model || 'llama-3.1-sonar-large-128k-chat',
          status: connectionStatus.available ? 'active' : 'error',
          responseTime,
          lastUsed: null,
          message: connectionStatus.error,
        };

        return NextResponse.json(statusInfo);
      }
    }

    const statusInfo: AIStatusInfo = {
      configured: false,
      provider: 'fallback',
      model: 'rule-based',
      status: 'inactive',
      responseTime: null,
      lastUsed: null,
      message: 'Motor de IA en modo de respaldo',
    };

    return NextResponse.json(statusInfo);
  } catch (error) {
    logError(aiLogger, error, { stage: 'ai-status' });

    const statusInfo: AIStatusInfo = {
      configured: false,
      provider: 'fallback',
      model: 'unknown',
      status: 'error',
      responseTime: null,
      lastUsed: null,
      message: 'Error interno consultando estado de IA',
    };

    return NextResponse.json(statusInfo);
  }
}
