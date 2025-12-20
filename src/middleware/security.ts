/**
 * Security Middleware
 *
 * Headers de seguridad HTTP:
 * - CORS
 * - CSP (Content Security Policy)
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Configuración de CORS
 */
export interface CorsConfig {
  /**
   * Orígenes permitidos
   * '*' permite todos (solo usar en desarrollo)
   */
  allowedOrigins: string[] | '*'

  /**
   * Métodos HTTP permitidos
   */
  allowedMethods?: string[]

  /**
   * Headers permitidos
   */
  allowedHeaders?: string[]

  /**
   * Headers expuestos al cliente
   */
  exposedHeaders?: string[]

  /**
   * Permitir credenciales (cookies, auth headers)
   */
  credentials?: boolean

  /**
   * Tiempo de cache de la preflight request (en segundos)
   */
  maxAge?: number
}

/**
 * CORS predeterminado para producción
 */
const defaultCorsConfig: CorsConfig = {
  allowedOrigins: [
    'https://chatbot.zgamersa.com',
    'https://zgamersa.com',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-User-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 horas
}

/**
 * CORS para desarrollo (permisivo)
 */
const devCorsConfig: CorsConfig = {
  allowedOrigins: '*',
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*'],
  exposedHeaders: ['*'],
  credentials: true,
  maxAge: 86400,
}

/**
 * Obtener configuración de CORS según entorno
 */
export function getCorsConfig(): CorsConfig {
  return process.env.NODE_ENV === 'development'
    ? devCorsConfig
    : defaultCorsConfig
}

/**
 * Verificar si el origen está permitido
 */
export function isOriginAllowed(origin: string | null, config: CorsConfig): boolean {
  if (!origin) return false
  if (config.allowedOrigins === '*') return true
  return config.allowedOrigins.includes(origin)
}

/**
 * Aplicar headers CORS a la respuesta
 */
export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse,
  config: CorsConfig = getCorsConfig()
): NextResponse {
  const origin = request.headers.get('origin')

  // Verificar origen permitido
  if (origin && isOriginAllowed(origin, config)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (config.allowedOrigins === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  // Credenciales
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Métodos permitidos
  if (config.allowedMethods) {
    response.headers.set(
      'Access-Control-Allow-Methods',
      config.allowedMethods.join(', ')
    )
  }

  // Headers permitidos
  if (config.allowedHeaders) {
    response.headers.set(
      'Access-Control-Allow-Headers',
      config.allowedHeaders.join(', ')
    )
  }

  // Headers expuestos
  if (config.exposedHeaders) {
    response.headers.set(
      'Access-Control-Expose-Headers',
      config.exposedHeaders.join(', ')
    )
  }

  // Max age para preflight
  if (config.maxAge) {
    response.headers.set('Access-Control-Max-Age', String(config.maxAge))
  }

  return response
}

/**
 * Manejar preflight request (OPTIONS)
 */
export function handlePreflight(
  request: NextRequest,
  config: CorsConfig = getCorsConfig()
): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return applyCorsHeaders(request, response, config)
}

/**
 * Headers de seguridad HTTP
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers

  // Content Security Policy
  // Política restrictiva para prevenir XSS
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requiere unsafe-inline/eval en dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://chatbot.zgamersa.com https://api.whatsapp.com http://localhost:11434",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // Strict Transport Security (solo en producción con HTTPS)
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Prevenir clickjacking
  headers.set('X-Frame-Options', 'DENY')

  // Prevenir MIME-type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy (antes Feature-Policy)
  headers.set(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // Disable FLoC
    ].join(', ')
  )

  // XSS Protection (legacy pero aún útil)
  headers.set('X-XSS-Protection', '1; mode=block')

  // Prevenir DNS prefetching
  headers.set('X-DNS-Prefetch-Control', 'off')

  // Download Options (IE)
  headers.set('X-Download-Options', 'noopen')

  // Permitted Cross-Domain Policies
  headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  return response
}

/**
 * Aplicar todos los headers de seguridad y CORS
 */
export function applyAllSecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  corsConfig?: CorsConfig
): NextResponse {
  response = applyCorsHeaders(request, response, corsConfig)
  response = applySecurityHeaders(response)
  return response
}

/**
 * Verificar HMAC signature de WhatsApp
 */
export function verifyWhatsAppWebhook(
  request: NextRequest,
  payload: string
): boolean {
  const signature = request.headers.get('x-hub-signature-256')
  const appSecret = process.env.WHATSAPP_APP_SECRET

  if (!signature || !appSecret) {
    return false
  }

  const crypto = require('crypto')

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex')}`

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Middleware para verificar webhook de WhatsApp
 */
export async function verifyWhatsAppWebhookMiddleware(
  request: NextRequest
): Promise<void> {
  // Solo verificar en producción
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const payload = await request.text()

  if (!verifyWhatsAppWebhook(request, payload)) {
    throw new Error('Invalid webhook signature')
  }
}
