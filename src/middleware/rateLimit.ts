/**
 * Rate Limiting Middleware
 *
 * Protección contra:
 * - Ataques de fuerza bruta
 * - DDoS
 * - Abuso de API
 *
 * Implementación en memoria (simple) para desarrollo.
 * Para producción, usar Redis con upstash-ratelimit o similar.
 */

import { NextRequest } from 'next/server'
import { RateLimitError } from './validation'
import { apiLogger } from '@/lib/logger'

/**
 * Configuración de rate limit
 */
export interface RateLimitConfig {
  /**
   * Número máximo de requests permitidos
   */
  max: number

  /**
   * Ventana de tiempo en milisegundos
   */
  windowMs: number

  /**
   * Mensaje de error personalizado
   */
  message?: string

  /**
   * Función para extraer el identificador único del request
   * Por defecto usa IP
   */
  keyGenerator?: (request: NextRequest) => string
}

/**
 * Store en memoria para rate limiting
 * NOTA: Solo para desarrollo. En producción usar Redis.
 */
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

/**
 * Limpiar entradas expiradas del store (garbage collection)
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)

/**
 * Obtener IP del request
 */
export function getClientIp(request: NextRequest): string {
  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // Standard headers
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // Fallback
  return 'unknown'
}

/**
 * Verificar rate limit
 *
 * @param identifier - Identificador único (IP, user ID, etc.)
 * @param config - Configuración del rate limit
 * @returns true si está dentro del límite, false si excedió
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
} {
  const now = Date.now()
  const entry = store[identifier]

  // Primera request o ventana expirada
  if (!entry || entry.resetTime < now) {
    store[identifier] = {
      count: 1,
      resetTime: now + config.windowMs,
    }

    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: now + config.windowMs,
    }
  }

  // Dentro de la ventana
  if (entry.count < config.max) {
    entry.count++
    return {
      allowed: true,
      remaining: config.max - entry.count,
      resetTime: entry.resetTime,
    }
  }

  // Límite excedido
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

  apiLogger.warn({
    identifier,
    limit: config.max,
    window: config.windowMs,
    retryAfter,
    msg: 'Rate limit exceeded',
  })

  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
    retryAfter,
  }
}

/**
 * Middleware de rate limiting
 *
 * @param config - Configuración del rate limit
 * @returns Función que valida el rate limit
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): void => {
    const keyGenerator = config.keyGenerator || getClientIp
    const identifier = keyGenerator(request)

    const result = checkRateLimit(identifier, config)

    if (!result.allowed) {
      throw new RateLimitError(
        config.message || `Too many requests. Try again in ${result.retryAfter} seconds.`
      )
    }

    // Añadir headers de rate limit a la respuesta
    // Estos se pueden acceder en el response
    // @ts-ignore - Añadimos metadata al request
    request.rateLimitInfo = {
      limit: config.max,
      remaining: result.remaining,
      reset: new Date(result.resetTime).toISOString(),
    }
  }
}

/**
 * Configuraciones predefinidas de rate limiting
 */
export const rateLimitPresets = {
  /**
   * Strict: Para endpoints sensibles (login, password reset)
   * 5 requests / 15 minutos
   */
  strict: {
    max: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },

  /**
   * Moderate: Para endpoints de escritura (POST, PUT, DELETE)
   * 30 requests / minuto
   */
  moderate: {
    max: 30,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please try again in a minute.',
  },

  /**
   * Lenient: Para endpoints de lectura (GET)
   * 100 requests / minuto
   */
  lenient: {
    max: 100,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please slow down.',
  },

  /**
   * Webhook: Para webhooks externos (WhatsApp)
   * 200 requests / minuto (WhatsApp puede enviar muchos mensajes)
   */
  webhook: {
    max: 200,
    windowMs: 60 * 1000,
    message: 'Webhook rate limit exceeded.',
  },

  /**
   * AI: Para endpoints de IA (generación de respuestas)
   * 20 requests / minuto (IA es costosa)
   */
  ai: {
    max: 20,
    windowMs: 60 * 1000,
    message: 'AI request limit exceeded. Please wait.',
  },
} as const

/**
 * Rate limit por usuario autenticado
 */
export function rateLimitByUser(config: RateLimitConfig) {
  return rateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => {
      // Extraer user ID del token JWT o session
      // Por ahora usar IP como fallback
      const userId = request.headers.get('x-user-id') || getClientIp(request)
      return `user:${userId}`
    },
  })
}

/**
 * Rate limit por endpoint específico
 */
export function rateLimitByEndpoint(endpoint: string, config: RateLimitConfig) {
  return rateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const ip = getClientIp(request)
      return `endpoint:${endpoint}:${ip}`
    },
  })
}

/**
 * Obtener información del rate limit del request
 */
export function getRateLimitInfo(request: NextRequest): {
  limit?: number
  remaining?: number
  reset?: string
} {
  // @ts-ignore
  return request.rateLimitInfo || {}
}

/**
 * Añadir headers de rate limit al response
 */
export function addRateLimitHeaders(
  headers: Headers,
  info: { limit?: number; remaining?: number; reset?: string }
): void {
  if (info.limit !== undefined) {
    headers.set('X-RateLimit-Limit', String(info.limit))
  }
  if (info.remaining !== undefined) {
    headers.set('X-RateLimit-Remaining', String(info.remaining))
  }
  if (info.reset) {
    headers.set('X-RateLimit-Reset', info.reset)
  }
}
