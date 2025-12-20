/**
 * Sistema de Logging Estructurado con Winston
 *
 * Logger centralizado enterprise-grade con:
 * - Logs estructurados en JSON (producción)
 * - Pretty print en desarrollo
 * - Niveles: error, warn, info, http, verbose, debug, silly
 * - Redacción automática de datos sensibles
 * - Rotación de archivos de log
 * - Compatible con Turbopack y Webpack
 */

import winston from 'winston'
import { format } from 'winston'

const { combine, timestamp, errors, json, printf, colorize } = format

/**
 * Formato custom para desarrollo (legible)
 */
const devFormat = printf(({ level, message, timestamp, module, ...metadata }) => {
  let msg = `${timestamp} [${level}]`

  if (module) {
    msg += ` [${module}]`
  }

  msg += `: ${message}`

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata, null, 2)}`
  }

  return msg
})

/**
 * Formato para redactar datos sensibles
 */
const redactFormat = format((info) => {
  const sensitiveKeys = [
    'password', 'token', 'secret', 'apiKey', 'authorization',
    'WHATSAPP_TOKEN', 'NEXTAUTH_SECRET', 'cookie', 'jwt'
  ]

  const redact = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj

    const redacted = Array.isArray(obj) ? [...obj] : { ...obj }

    for (const key in redacted) {
      const lowerKey = key.toLowerCase()

      if (sensitiveKeys.some(k => lowerKey.includes(k.toLowerCase()))) {
        redacted[key] = '[REDACTED]'
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = redact(redacted[key])
      }
    }

    return redacted
  }

  return redact(info)
})

/**
 * Crear logger base
 */
const createLogger = (module?: string) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')

  return winston.createLogger({
    level: logLevel,
    defaultMeta: {
      service: 'pithy-chatbot',
      env: process.env.NODE_ENV || 'development',
      module: module || 'app',
    },
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      redactFormat(),
      isDevelopment
        ? combine(colorize(), devFormat)
        : json()
    ),
    transports: [
      // Console output
      new winston.transports.Console({
        stderrLevels: ['error'],
      }),

      // Archivo de errores (solo producción)
      ...(!isDevelopment ? [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10,
        }),
      ] : []),
    ],
    // No salir en uncaught exceptions
    exitOnError: false,
  })
}

/**
 * Logger principal
 */
const logger = createLogger()

/**
 * Logger para WhatsApp
 */
export const whatsappLogger = createLogger('whatsapp')

/**
 * Logger para IA (Ollama, Claude, OpenAI)
 */
export const aiLogger = createLogger('ai')

/**
 * Logger para Base de Datos
 */
export const dbLogger = createLogger('database')

/**
 * Logger para Autenticación
 */
export const authLogger = createLogger('auth')

/**
 * Logger para Sistema de Aprendizaje (RAG)
 */
export const learningLogger = createLogger('learning')

/**
 * Logger para TTS (Text-to-Speech)
 */
export const ttsLogger = createLogger('tts')

/**
 * Logger para API Routes
 */
export const apiLogger = createLogger('api')

/**
 * Wrapper para capturar errores con contexto
 */
export function logError(
  logger: winston.Logger,
  error: unknown,
  context?: Record<string, any>
) {
  const errorObj = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    : { error: String(error) }

  logger.error('Error occurred', { ...errorObj, ...context })
}

/**
 * Helper para medir tiempo de ejecución
 */
export function createTimer(logger: winston.Logger, operation: string) {
  const start = Date.now()

  return {
    end: (metadata?: Record<string, any>) => {
      const duration = Date.now() - start
      logger.info(`Operation completed in ${duration}ms`, {
        operation,
        duration,
        ...metadata,
      })
    },
  }
}

export default logger
