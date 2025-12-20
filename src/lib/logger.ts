/**
 * Sistema de Logging Estructurado con Pino
 *
 * Logger centralizado para toda la aplicación con:
 * - Logs estructurados en JSON (producción)
 * - Pretty print en desarrollo
 * - Niveles: trace, debug, info, warn, error, fatal
 * - Contexto automático (timestamp, pid, hostname)
 */

import pino from 'pino'

// Configuración del logger según entorno
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),

  // Formato pretty en desarrollo, JSON en producción
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,

  // Configuración base
  base: {
    env: process.env.NODE_ENV || 'development',
    app: 'pithy-chatbot',
  },

  // Serializers para formatear datos sensibles
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },

  // Redactar datos sensibles
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'apiKey',
      'WHATSAPP_TOKEN',
      'NEXTAUTH_SECRET',
    ],
    remove: true,
  },
})

/**
 * Logger para WhatsApp
 */
export const whatsappLogger = logger.child({ module: 'whatsapp' })

/**
 * Logger para IA (Ollama, Claude, OpenAI)
 */
export const aiLogger = logger.child({ module: 'ai' })

/**
 * Logger para Base de Datos
 */
export const dbLogger = logger.child({ module: 'database' })

/**
 * Logger para Autenticación
 */
export const authLogger = logger.child({ module: 'auth' })

/**
 * Logger para Sistema de Aprendizaje (RAG)
 */
export const learningLogger = logger.child({ module: 'learning' })

/**
 * Logger para TTS (Text-to-Speech)
 */
export const ttsLogger = logger.child({ module: 'tts' })

/**
 * Logger para API Routes
 */
export const apiLogger = logger.child({ module: 'api' })

/**
 * Wrapper para capturar errores con contexto
 */
export function logError(
  logger: pino.Logger,
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

  logger.error({ ...errorObj, ...context }, 'Error occurred')
}

/**
 * Helper para medir tiempo de ejecución
 */
export function createTimer(logger: pino.Logger, operation: string) {
  const start = Date.now()

  return {
    end: (metadata?: Record<string, any>) => {
      const duration = Date.now() - start
      logger.info({ operation, duration, ...metadata }, `Operation completed in ${duration}ms`)
    },
  }
}

export default logger
