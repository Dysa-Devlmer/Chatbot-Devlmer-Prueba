/**
 * API Handler Utility
 *
 * Wrapper unificado para route handlers con:
 * - Manejo automático de errores
 * - Rate limiting
 * - CORS
 * - Security headers
 * - Logging
 * - Validación
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import {
  withErrorHandling,
  validateBody,
  validateQuery,
  successResponse,
  AuthenticationError,
} from '@/middleware/validation'
import {
  rateLimit,
  RateLimitConfig,
  getRateLimitInfo,
  addRateLimitHeaders,
  rateLimitPresets,
} from '@/middleware/rateLimit'
import {
  applyAllSecurityHeaders,
  handlePreflight,
  CorsConfig,
} from '@/middleware/security'
import { apiLogger, createTimer } from '@/lib/logger'

/**
 * Opciones para el API handler
 */
export interface ApiHandlerOptions {
  /**
   * Requiere autenticación
   */
  requireAuth?: boolean

  /**
   * Configuración de rate limiting
   */
  rateLimit?: RateLimitConfig | keyof typeof rateLimitPresets

  /**
   * Configuración de CORS
   */
  cors?: CorsConfig

  /**
   * Schema de validación para body
   */
  bodySchema?: ZodSchema

  /**
   * Schema de validación para query params
   */
  querySchema?: ZodSchema

  /**
   * Logging deshabilitado
   */
  disableLogging?: boolean
}

/**
 * Handler function type
 */
export type ApiHandler = (
  request: NextRequest,
  context?: { params?: any }
) => Promise<NextResponse | Response>

/**
 * Verificar autenticación (placeholder - implementar según NextAuth)
 */
async function checkAuthentication(request: NextRequest): Promise<boolean> {
  // TODO: Implementar verificación con NextAuth
  // Por ahora, verificar header básico
  const authHeader = request.headers.get('authorization')
  return !!authHeader
}

/**
 * Crear API handler con middleware aplicado
 *
 * @example
 * ```typescript
 * export const POST = createApiHandler(
 *   async (request) => {
 *     const data = await request.json()
 *     return successResponse({ message: 'OK' })
 *   },
 *   {
 *     requireAuth: true,
 *     rateLimit: 'moderate',
 *     bodySchema: mySchema,
 *   }
 * )
 * ```
 */
export function createApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
): ApiHandler {
  return withErrorHandling(async (request: NextRequest, context?: any) => {
    const timer = createTimer(apiLogger, `${request.method} ${request.url}`)

    try {
      // 1. Manejar preflight (OPTIONS)
      if (request.method === 'OPTIONS') {
        return handlePreflight(request, options.cors)
      }

      // 2. Aplicar rate limiting
      if (options.rateLimit) {
        const rateLimitConfig =
          typeof options.rateLimit === 'string'
            ? rateLimitPresets[options.rateLimit]
            : options.rateLimit

        const rateLimitMiddleware = rateLimit(rateLimitConfig)
        rateLimitMiddleware(request)
      }

      // 3. Verificar autenticación
      if (options.requireAuth) {
        const isAuthenticated = await checkAuthentication(request)
        if (!isAuthenticated) {
          throw new AuthenticationError('Authentication required')
        }
      }

      // 4. Validar body si hay schema
      if (options.bodySchema && request.method !== 'GET') {
        const validatedBody = await validateBody(request, options.bodySchema)
        // @ts-ignore - Añadir body validado al request
        request.validatedBody = validatedBody
      }

      // 5. Validar query params si hay schema
      if (options.querySchema) {
        const validatedQuery = validateQuery(request, options.querySchema)
        // @ts-ignore - Añadir query validado al request
        request.validatedQuery = validatedQuery
      }

      // 6. Logging de request
      if (!options.disableLogging) {
        apiLogger.info({
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for'),
        })
      }

      // 7. Ejecutar handler
      const response = await handler(request, context)

      // 8. Aplicar security headers y CORS
      let finalResponse: NextResponse

      if (response instanceof NextResponse) {
        finalResponse = response
      } else {
        // Convertir Response a NextResponse
        finalResponse = new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        })
      }

      finalResponse = applyAllSecurityHeaders(request, finalResponse, options.cors)

      // 9. Añadir rate limit headers
      const rateLimitInfo = getRateLimitInfo(request)
      addRateLimitHeaders(finalResponse.headers, rateLimitInfo)

      // 10. Log de respuesta
      if (!options.disableLogging) {
        timer.end({ status: finalResponse.status })
      }

      return finalResponse
    } catch (error) {
      // Error handling delegado a withErrorHandling
      throw error
    }
  })
}

/**
 * Obtener body validado del request
 */
export function getValidatedBody<T = any>(request: NextRequest): T {
  // @ts-ignore
  return request.validatedBody
}

/**
 * Obtener query validado del request
 */
export function getValidatedQuery<T = any>(request: NextRequest): T {
  // @ts-ignore
  return request.validatedQuery
}

/**
 * Presets de handlers comunes
 */

/**
 * Handler para endpoints públicos sin autenticación
 */
export function createPublicHandler(
  handler: ApiHandler,
  options: Omit<ApiHandlerOptions, 'requireAuth'> = {}
) {
  return createApiHandler(handler, {
    ...options,
    requireAuth: false,
    rateLimit: options.rateLimit || 'lenient',
  })
}

/**
 * Handler para endpoints protegidos
 */
export function createProtectedHandler(
  handler: ApiHandler,
  options: Omit<ApiHandlerOptions, 'requireAuth'> = {}
) {
  return createApiHandler(handler, {
    ...options,
    requireAuth: true,
    rateLimit: options.rateLimit || 'moderate',
  })
}

/**
 * Handler para webhooks externos
 */
export function createWebhookHandler(
  handler: ApiHandler,
  options: Omit<ApiHandlerOptions, 'requireAuth' | 'rateLimit'> = {}
) {
  return createApiHandler(handler, {
    ...options,
    requireAuth: false,
    rateLimit: 'webhook',
  })
}

/**
 * Handler para endpoints de IA
 */
export function createAiHandler(
  handler: ApiHandler,
  options: Omit<ApiHandlerOptions, 'rateLimit'> = {}
) {
  return createApiHandler(handler, {
    ...options,
    rateLimit: 'ai',
  })
}

/**
 * Handler para login/auth endpoints
 */
export function createAuthHandler(
  handler: ApiHandler,
  options: Omit<ApiHandlerOptions, 'requireAuth' | 'rateLimit'> = {}
) {
  return createApiHandler(handler, {
    ...options,
    requireAuth: false,
    rateLimit: 'strict',
  })
}
