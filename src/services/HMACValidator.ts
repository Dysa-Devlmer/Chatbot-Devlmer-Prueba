/**
 * HMACValidator
 *
 * Valida que los webhooks de WhatsApp sean autenticos usando HMAC-SHA256.
 */
import crypto from 'crypto'
import { whatsappLogger } from '@/lib/logger'
import { HMACValidationResult } from '@/types/schemas'

export class HMACValidator {
  /**
   * Valida la firma HMAC del webhook de WhatsApp.
   */
  static validateSignature(
    payload: string,
    signature: string,
    webhookSecret: string
  ): HMACValidationResult {
    try {
      if (!signature || !payload || !webhookSecret) {
        return {
          valid: false,
          error: 'Missing signature, payload, or secret',
        }
      }

      const [algorithm, receivedHash] = signature.split('=')

      if (!algorithm || !receivedHash) {
        return {
          valid: false,
          error: 'Malformed signature header',
        }
      }

      if (algorithm !== 'sha256') {
        return {
          valid: false,
          error: `Unsupported algorithm: ${algorithm}`,
        }
      }

      const hmac = crypto.createHmac('sha256', webhookSecret)
      hmac.update(payload)
      const calculatedHash = hmac.digest('hex')

      const isValid = crypto.timingSafeEqual(
        Buffer.from(calculatedHash),
        Buffer.from(receivedHash)
      )

      if (isValid) {
        whatsappLogger.info('HMAC validation successful')
        return {
          valid: true,
          timestamp: Date.now(),
        }
      }

      whatsappLogger.warn('HMAC validation failed - hash mismatch')
      return {
        valid: false,
        error: 'Invalid signature',
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      whatsappLogger.error('HMAC validation error', {
        error: errorMsg,
      })

      return {
        valid: false,
        error: errorMsg,
      }
    }
  }

  /**
   * Verifica si el servicio esta configurado con la API secret.
   */
  static isConfigured(): boolean {
    const isConfigured = !!process.env.WHATSAPP_WEBHOOK_SECRET
    if (!isConfigured) {
      whatsappLogger.warn('WHATSAPP_WEBHOOK_SECRET not configured')
    }
    return isConfigured
  }
}
