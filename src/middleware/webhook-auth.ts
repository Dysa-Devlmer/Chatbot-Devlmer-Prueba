/**
 * Webhook Authentication Middleware
 *
 * Valida HMAC y aplica rate limiting a los webhooks de WhatsApp.
 */
import { NextRequest } from 'next/server'
import { HMACValidator } from '@/services/HMACValidator'
import { rateLimiter } from '@/services/RateLimiter'
import { whatsappLogger } from '@/lib/logger'

export interface WebhookAuthResult {
  valid: boolean
  error?: string
  rateLimitInfo?: {
    allowed: boolean
    remaining: number
    resetTime: number
  }
}

export async function webhookAuthMiddleware(
  request: NextRequest,
  userId?: string,
  phoneNumber?: string
): Promise<WebhookAuthResult> {
  // Obtener IP del cliente
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  try {
    if (!HMACValidator.isConfigured()) {
      whatsappLogger.error('HMAC validation not configured')
      return {
        valid: false,
        error: 'Server not configured',
      }
    }

    const signature = request.headers.get('X-Hub-Signature-256')
    if (!signature) {
      whatsappLogger.warn('Missing X-Hub-Signature-256 header', {
        ip,
      })
      return {
        valid: false,
        error: 'Missing signature header',
      }
    }

    const body = await request.text()
    if (!body) {
      whatsappLogger.warn('Empty request body')
      return {
        valid: false,
        error: 'Empty request body',
      }
    }

    const hmacResult = HMACValidator.validateSignature(
      body,
      signature,
      process.env.WHATSAPP_WEBHOOK_SECRET || ''
    )

    if (!hmacResult.valid) {
      whatsappLogger.warn('HMAC validation failed', {
        error: hmacResult.error,
        ip: ip,
      })
      return {
        valid: false,
        error: hmacResult.error || 'Invalid HMAC signature',
      }
    }

    whatsappLogger.info('HMAC validation passed', {
      ip: ip,
    })

    let rateLimitKey = phoneNumber || userId || ip || 'unknown'

    if (!phoneNumber && body) {
      try {
        const payload = JSON.parse(body)
        const extractedPhone =
          payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
          payload.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.recipient_id

        if (extractedPhone) {
          rateLimitKey = extractedPhone
        }
      } catch {
        // ignore parse errors
      }
    }

    const rateLimitResult = rateLimiter.checkLimit(rateLimitKey)

    if (!rateLimitResult.allowed) {
      whatsappLogger.warn('Rate limit exceeded', {
        key: rateLimitKey,
        ip: ip,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      })

      return {
        valid: false,
        error: rateLimitResult.error || 'Too many requests',
        rateLimitInfo: {
          allowed: false,
          remaining: 0,
          resetTime: rateLimitResult.resetTime,
        },
      }
    }

    whatsappLogger.debug('Rate limit check passed', {
      key: rateLimitKey,
      remaining: rateLimitResult.remaining,
    })

    return {
      valid: true,
      rateLimitInfo: {
        allowed: true,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    whatsappLogger.error('Webhook auth error', {
      error: errorMsg,
      ip: ip,
    })

    return {
      valid: false,
      error: 'Authentication error',
    }
  }
}

export function getHttpStatus(result: WebhookAuthResult): number {
  if (!result.valid) {
    if (
      result.error?.includes('Too many') ||
      result.error?.includes('Rate limit')
    ) {
      return 429
    }
    return 401
  }

  return 200
}
