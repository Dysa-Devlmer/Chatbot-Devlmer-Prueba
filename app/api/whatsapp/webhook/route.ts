import { NextRequest, NextResponse } from 'next/server';
import { webhookAuthMiddleware, getHttpStatus } from '@/middleware/webhook-auth';
import { whatsAppService } from '@/services/WhatsAppService';
import { whatsappLogger, logError } from '@/lib/logger';

// Verificación del webhook (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
    return new NextResponse(challenge);
  }

  return new NextResponse('Token invalido', { status: 403 });
}

/**
 * Webhook POST handler - Procesamiento de mensajes de WhatsApp
 *
 * Flujo:
 * 1. Validar HMAC signature (seguridad)
 * 2. Aplicar rate limiting (anti-abuso)
 * 3. Procesar con WhatsAppService (orquestacion)
 * 4. Retornar respuesta
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await webhookAuthMiddleware(request);

    if (!authResult.valid) {
      const httpStatus = getHttpStatus(authResult);
      whatsappLogger.warn('Webhook auth failed', {
        error: authResult.error,
        status: httpStatus,
      });

      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: httpStatus }
      );
    }

    // Body ya fue leído por el middleware, usar ese body en lugar de leer de nuevo
    const body = authResult.body;
    if (!body) {
      whatsappLogger.warn('Empty body after auth');
      return NextResponse.json(
        { success: false, error: 'Empty request body' },
        { status: 400 }
      );
    }

    const result = await whatsAppService.processWebhookPayload(body);

    whatsappLogger.info('Webhook processed successfully', {
      type: result.type,
      success: result.success,
      processingTime: result.details?.processingTime,
    });

    return NextResponse.json({
      success: result.success,
      type: result.type,
      message: result.message,
      details: result.details,
    });
  } catch (error) {
    logError(whatsappLogger, error, {
      stage: 'webhook-post',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
