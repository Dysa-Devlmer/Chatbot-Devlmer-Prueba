import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();

  const health: {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    uptime: number;
    version: string;
    checks: {
      server: { status: string; responseTime?: number };
      database: { status: string; responseTime?: number; error?: string };
      ollama: { status: string; responseTime?: number; error?: string };
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      server: { status: 'ok' },
      database: { status: 'checking' },
      ollama: { status: 'checking' },
    },
  };

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'ok',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    health.checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
    health.status = 'degraded';
  }

  // Check Ollama
  try {
    const ollamaStart = Date.now();
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const response = await fetch(`${ollamaHost}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      health.checks.ollama = {
        status: 'ok',
        responseTime: Date.now() - ollamaStart,
      };
    } else {
      health.checks.ollama = {
        status: 'error',
        error: `HTTP ${response.status}`,
      };
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.ollama = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Ollama connection failed',
    };
    health.status = 'degraded';
  }

  // Set server response time
  health.checks.server.responseTime = Date.now() - startTime;

  // If any critical service is down, mark as error
  if (health.checks.database.status === 'error') {
    health.status = 'error';
  }

  const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
