import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface AIConfig {
  ai_provider: string;
  ai_model: string;
  perplexity_api_key: string;
  perplexity_model: string;
  perplexity_temperature: string;
  perplexity_max_tokens: string;
  ai_enabled: string;
  rag_enabled: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todas las configuraciones de IA
    const configKeys = [
      'ai_provider',
      'ai_model',
      'perplexity_api_key',
      'perplexity_model',
      'perplexity_temperature',
      'perplexity_max_tokens',
      'ai_enabled',
      'rag_enabled',
    ];

    const configEntries = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: configKeys,
        },
      },
    });

    // Convertir a objeto para facilitar el acceso
    const config: Record<string, { value: string }> = {};
    configEntries.forEach(entry => {
      config[entry.key] = { value: entry.value };
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error obteniendo configuración de IA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data: AIConfig = await request.json();

    // Validar que todos los campos requeridos estén presentes
    const requiredFields = [
      'ai_provider',
      'ai_model',
      'perplexity_api_key',
      'perplexity_model',
      'perplexity_temperature',
      'perplexity_max_tokens',
      'ai_enabled',
      'rag_enabled',
    ];

    for (const field of requiredFields) {
      if (!(field in data)) {
        return NextResponse.json({ error: `Campo faltante: ${field}` }, { status: 400 });
      }
    }

    // Actualizar cada configuración individualmente
    const updates = Object.entries(data).map(([key, value]) => {
      return prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          type: key.includes('enabled') ? 'boolean' : 
                key.includes('temperature') || key.includes('max_tokens') ? 'number' : 'string',
        },
      });
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true, message: 'Configuración de IA actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando configuración de IA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}