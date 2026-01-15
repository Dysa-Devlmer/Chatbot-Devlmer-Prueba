import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PerplexityService } from '@/lib/perplexity';

interface AIStatusInfo {
  isConfigured: boolean;
  provider: 'perplexity' | 'claude' | 'fallback' | 'unknown';
  model: string;
  lastUsed?: Date;
  responseTime?: number;
  status: 'online' | 'offline' | 'checking';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener configuración actual de IA
    const aiProviderConfig = await prisma.systemConfig.findUnique({
      where: { key: 'ai_provider' },
    });

    const currentProvider = aiProviderConfig?.value || 'ollama';

    // Determinar el estado según el proveedor
    if (currentProvider === 'perplexity') {
      // Verificar si Perplexity está configurado y disponible
      const isConfigured = await PerplexityService.isConfigured();
      
      if (isConfigured) {
        // Verificar conexión a la API de Perplexity
        const connectionStatus = await PerplexityService.checkConnection();
        
        const statusInfo: AIStatusInfo = {
          isConfigured: true,
          provider: 'perplexity',
          model: connectionStatus.model || 'llama-3.1-sonar-large-128k-chat',
          status: connectionStatus.available ? 'online' : 'offline',
        };

        return NextResponse.json(statusInfo);
      } else {
        // Perplexity no está configurado
        const statusInfo: AIStatusInfo = {
          isConfigured: false,
          provider: 'perplexity',
          model: 'llama-3.1-sonar-large-128k-chat',
          status: 'offline',
        };

        return NextResponse.json(statusInfo);
      }
    } else {
      // Si está usando Ollama u otro proveedor
      const statusInfo: AIStatusInfo = {
        isConfigured: true,
        provider: 'unknown',
        model: 'local-model',
        status: 'checking',
      };

      return NextResponse.json(statusInfo);
    }
  } catch (error) {
    console.error('Error obteniendo estado de IA:', error);
    
    // En caso de error, devolver estado desconocido
    const statusInfo: AIStatusInfo = {
      isConfigured: false,
      provider: 'unknown',
      model: 'unknown',
      status: 'offline',
    };

    return NextResponse.json(statusInfo);
  }
}