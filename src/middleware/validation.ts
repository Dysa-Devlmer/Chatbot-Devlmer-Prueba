/**
 * Middleware de Validación con Zod
 *
 * Validación automática de request body, query params y headers
 * usando schemas de Zod
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'
import { apiLogger, logError } from '@/lib/logger'

/**
 * Tipos de error personalizados
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests') {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Wrapper para validar request con Zod schema
 *
 * @param schema - Zod schema para validar
 * @param data - Datos a validar
 * @returns Datos validados y parseados
 * @throws ValidationError si la validación falla
 */
export function validateSchema<T extends ZodSchema>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error)
    }
    throw error
  }
}

/**
 * Validar JSON body de un request
 */
export async function validateBody<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json()
    return validateSchema(schema, body)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON', {} as z.ZodError)
    }
    throw error
  }
}

/**
 * Validar query parameters
 */
export function validateQuery<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const { searchParams } = new URL(request.url)
  const queryObj = Object.fromEntries(searchParams.entries())
  return validateSchema(schema, queryObj)
}

/**
 * Formatear errores de Zod para respuesta API
 */
export function formatZodErrors(zodError: z.ZodError) {
  return zodError.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))
}

/**
 * Response estándar de error
 */
export function errorResponse(
  error: Error,
  status: number = 500
): NextResponse {
  const response: {
    error: string
    message: string
    details?: any
    timestamp: string
  } = {
    error: error.name,
    message: error.message,
    timestamp: new Date().toISOString(),
  }

  // Añadir detalles de validación si es ValidationError
  if (error instanceof ValidationError) {
    response.details = formatZodErrors(error.errors)
  }

  // Log del error
  logError(apiLogger, error, { status })

  return NextResponse.json(response, { status })
}

/**
 * Response estándar de éxito
 */
export function successResponse<T = any>(
  data: T,
  status: number = 200,
  metadata?: Record<string, any>
): NextResponse {
  const response: {
    success: true
    data: T
    timestamp: string
    metadata?: Record<string, any>
  } = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }

  if (metadata) {
    response.metadata = metadata
  }

  return NextResponse.json(response, { status })
}

/**
 * Wrapper para manejar errores en route handlers
 *
 * Uso:
 * export const POST = withErrorHandling(async (request) => {
 *   // tu lógica aquí
 * })
 */
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      if (error instanceof ValidationError) {
        return errorResponse(error, 400)
      }

      if (error instanceof AuthenticationError) {
        return errorResponse(error, 401)
      }

      if (error instanceof AuthorizationError) {
        return errorResponse(error, 403)
      }

      if (error instanceof RateLimitError) {
        return errorResponse(error, 429)
      }

      // Error desconocido
      logError(apiLogger, error, {
        url: request.url,
        method: request.method,
      })

      return NextResponse.json(
        {
          error: 'InternalServerError',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
  }
}
