/**
 * WebhookLogRepository
 *
 * Repository para logging de eventos de webhook.
 * Responsable de:
 * - Registrar eventos de webhook entrantes
 * - Actualizar estado de procesamiento
 * - Consultar historial de webhooks
 * - Debugging y auditoría
 */

import { prisma } from '@/lib/prisma'
import { WebhookLog } from '@prisma/client'
import { dbLogger } from '@/lib/logger'

/**
 * Datos para crear un log de webhook
 */
export interface CreateWebhookLogData {
  event: string
  payload: any
  status?: string
  error?: string
}

/**
 * Filtros para buscar logs de webhook
 */
export interface WebhookLogFilters {
  event?: string
  status?: string
  limit?: number
  offset?: number
  since?: Date
  until?: Date
}

/**
 * Repository para operaciones con logs de webhook
 */
export class WebhookLogRepository {
  /**
   * Crear un nuevo log de webhook
   */
  async create(data: CreateWebhookLogData): Promise<WebhookLog> {
    dbLogger.debug('Creating webhook log', {
      event: data.event,
      status: data.status || 'pending',
    })

    const webhookLog = await prisma.webhookLog.create({
      data: {
        event: data.event,
        payload: data.payload,
        status: data.status || 'pending',
        error: data.error,
      },
    })

    dbLogger.debug('Webhook log created', {
      webhookLogId: webhookLog.id,
      event: webhookLog.event,
    })

    return webhookLog
  }

  /**
   * Actualizar un log de webhook
   */
  async update(
    webhookLogId: string,
    status: string,
    error?: string
  ): Promise<WebhookLog> {
    dbLogger.debug('Updating webhook log', {
      webhookLogId,
      status,
      hasError: !!error,
    })

    const webhookLog = await prisma.webhookLog.update({
      where: { id: webhookLogId },
      data: {
        status,
        error,
        processedAt: status === 'processed' || status === 'failed' ? new Date() : undefined,
      },
    })

    dbLogger.debug('Webhook log updated', {
      webhookLogId,
      status: webhookLog.status,
    })

    return webhookLog
  }

  /**
   * Marcar webhook como procesado
   */
  async markAsProcessed(webhookLogId: string): Promise<WebhookLog> {
    return this.update(webhookLogId, 'processed')
  }

  /**
   * Marcar webhook como fallido
   */
  async markAsFailed(webhookLogId: string, error: string): Promise<WebhookLog> {
    return this.update(webhookLogId, 'failed', error)
  }

  /**
   * Obtener log de webhook por ID
   */
  async findById(webhookLogId: string): Promise<WebhookLog | null> {
    dbLogger.debug('Finding webhook log by ID', { webhookLogId })

    const webhookLog = await prisma.webhookLog.findUnique({
      where: { id: webhookLogId },
    })

    dbLogger.debug('Webhook log lookup result', {
      webhookLogId,
      found: webhookLog !== null,
    })

    return webhookLog
  }

  /**
   * Buscar logs de webhook con filtros
   */
  async findMany(filters: WebhookLogFilters = {}): Promise<WebhookLog[]> {
    dbLogger.debug('Finding webhook logs with filters', filters)

    const where: any = {}

    if (filters.event) {
      where.event = filters.event
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.since || filters.until) {
      where.createdAt = {}
      if (filters.since) {
        where.createdAt.gte = filters.since
      }
      if (filters.until) {
        where.createdAt.lte = filters.until
      }
    }

    const webhookLogs = await prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    })

    dbLogger.debug('Webhook logs retrieved', {
      count: webhookLogs.length,
      filters,
    })

    return webhookLogs
  }

  /**
   * Obtener logs pendientes
   */
  async findPending(): Promise<WebhookLog[]> {
    dbLogger.debug('Finding pending webhook logs')

    const webhookLogs = await this.findMany({ status: 'pending' })

    dbLogger.debug('Pending webhook logs retrieved', { count: webhookLogs.length })

    return webhookLogs
  }

  /**
   * Obtener logs fallidos
   */
  async findFailed(limit: number = 100): Promise<WebhookLog[]> {
    dbLogger.debug('Finding failed webhook logs', { limit })

    const webhookLogs = await this.findMany({ status: 'failed', limit })

    dbLogger.debug('Failed webhook logs retrieved', { count: webhookLogs.length })

    return webhookLogs
  }

  /**
   * Contar logs de webhook con filtros
   */
  async count(filters: WebhookLogFilters = {}): Promise<number> {
    dbLogger.debug('Counting webhook logs with filters', filters)

    const where: any = {}

    if (filters.event) {
      where.event = filters.event
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.since || filters.until) {
      where.createdAt = {}
      if (filters.since) {
        where.createdAt.gte = filters.since
      }
      if (filters.until) {
        where.createdAt.lte = filters.until
      }
    }

    const count = await prisma.webhookLog.count({ where })

    dbLogger.debug('Webhook log count result', { count, filters })

    return count
  }

  /**
   * Limpiar logs antiguos (más de X días)
   */
  async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    dbLogger.info('Cleaning up old webhook logs', {
      daysToKeep,
      cutoffDate,
    })

    const result = await prisma.webhookLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: 'processed', // Solo limpiar los procesados exitosamente
      },
    })

    dbLogger.info('Webhook logs cleaned up', {
      count: result.count,
      daysToKeep,
    })

    return result.count
  }

  /**
   * Obtener estadísticas de webhooks
   */
  async getStats(since?: Date): Promise<{
    total: number
    pending: number
    processed: number
    failed: number
  }> {
    dbLogger.debug('Getting webhook log stats', { since })

    const [total, pending, processed, failed] = await Promise.all([
      this.count({ since }),
      this.count({ status: 'pending', since }),
      this.count({ status: 'processed', since }),
      this.count({ status: 'failed', since }),
    ])

    const stats = { total, pending, processed, failed }

    dbLogger.debug('Webhook log stats retrieved', stats)

    return stats
  }
}

/**
 * Instancia singleton del repositorio
 */
export const webhookLogRepository = new WebhookLogRepository()
