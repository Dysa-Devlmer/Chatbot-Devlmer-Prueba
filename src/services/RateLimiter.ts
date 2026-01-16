/**
 * RateLimiter
 *
 * Limita el numero de requests por usuario/IP para prevenir abuso.
 */
import { whatsappLogger } from '@/lib/logger'
import {
  RateLimitConfig,
  RateLimitResult,
  RateLimitStore,
} from '@/types/schemas'

export class RateLimiter {
  private store: Map<string, RateLimitStore> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(
    private config: RateLimitConfig = {
      windowMs: 60_000,
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    }
  ) {
    this.initializeCleanup()
    whatsappLogger.info('RateLimiter initialized', {
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
    })
  }

  /**
   * Inicializa la limpieza automatica cada 5 minutos.
   */
  private initializeCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Verifica si un request esta dentro del limite.
   */
  checkLimit(
    key: string,
    options?: {
      isSuccess?: boolean
    }
  ): RateLimitResult {
    const now = Date.now()

    let entry = this.store.get(key)

    if (!entry) {
      entry = {
        key,
        count: 0,
        firstRequestTime: now,
        lastRequestTime: now,
      }
      this.store.set(key, entry)
    }

    if (entry.isBlocked && entry.blockUntil && now < entry.blockUntil) {
      const remainingMs = entry.blockUntil - now
      whatsappLogger.warn('Rate limit block active', {
        key,
        remainingMs: Math.round(remainingMs / 1000),
      })

      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: entry.blockUntil,
        error: `Rate limit exceeded. Blocked until ${new Date(entry.blockUntil).toISOString()}`,
      }
    }

    const windowExpired = now - entry.firstRequestTime > this.config.windowMs

    if (windowExpired) {
      entry.count = 0
      entry.firstRequestTime = now
      entry.isBlocked = false
      entry.blockUntil = undefined
    }

    const shouldCount =
      (!this.config.skipSuccessfulRequests || !options?.isSuccess) &&
      (!this.config.skipFailedRequests || options?.isSuccess)

    if (shouldCount) {
      entry.count++
    }

    entry.lastRequestTime = now

    if (entry.count > this.config.maxRequests) {
      const blockDuration = 15 * 60 * 1000
      entry.isBlocked = true
      entry.blockUntil = now + blockDuration

      whatsappLogger.warn('Rate limit exceeded - blocking', {
        key,
        count: entry.count,
        limit: this.config.maxRequests,
        blockUntil: new Date(entry.blockUntil).toISOString(),
      })

      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: entry.blockUntil,
        error: 'Rate limit exceeded. Blocked for 15 minutes.',
      }
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count)
    const resetTime = entry.firstRequestTime + this.config.windowMs

    if (entry.count > this.config.maxRequests * 0.8) {
      whatsappLogger.debug('Rate limit approaching', {
        key,
        count: entry.count,
        limit: this.config.maxRequests,
        percentage: Math.round((entry.count / this.config.maxRequests) * 100),
      })
    }

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining,
      resetTime,
    }
  }

  /**
   * Limpia entradas expiradas del store.
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.store.entries()) {
      const isExpired = now - entry.firstRequestTime > this.config.windowMs * 2
      const blockExpired =
        entry.isBlocked && entry.blockUntil && now > entry.blockUntil

      if (isExpired) {
        expiredKeys.push(key)
      } else if (blockExpired) {
        entry.isBlocked = false
        entry.blockUntil = undefined
        entry.count = 0
      }
    }

    for (const key of expiredKeys) {
      this.store.delete(key)
    }

    if (expiredKeys.length > 0) {
      whatsappLogger.debug('Rate limit cleanup', {
        removedEntries: expiredKeys.length,
        totalEntries: this.store.size,
      })
    }
  }

  /**
   * Resetea manualmente el contador para una clave.
   */
  reset(key: string): void {
    this.store.delete(key)
    whatsappLogger.info('Rate limit reset', { key })
  }

  /**
   * Obtiene el estado actual de una clave.
   */
  getStatus(key: string): {
    count: number
    limit: number
    remaining: number
    isBlocked: boolean
    blockUntil?: number
  } {
    const entry = this.store.get(key)

    if (!entry) {
      return {
        count: 0,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        isBlocked: false,
      }
    }

    return {
      count: entry.count,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      isBlocked: entry.isBlocked || false,
      blockUntil: entry.blockUntil,
    }
  }

  /**
   * Detiene la limpieza automatica (para testing).
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

export const rateLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 100,
})
