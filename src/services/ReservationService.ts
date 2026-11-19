/**
 * ReservationService
 *
 * Maneja la lógica de reservas y pedidos en la base de datos:
 * - Creación de órdenes con código único (ej: ORD-1001)
 * - Verificación de stock y productos activos
 * - Descuento de stock si aplica
 * - Listado y actualización de estado de órdenes
 */
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'

export interface CreateReservationInput {
  customerPhone: string
  customerName?: string
  productNames: string[]
  notes?: string
  channel?: 'whatsapp' | 'web' | 'manual'
}

export interface ReservationResult {
  success: boolean
  orderNumber?: string
  totalAmount?: number
  itemsSummary?: string
  error?: string
}

export class ReservationService {
  /**
   * Genera el siguiente código secuencial de orden (ej: ORD-1001, ORD-1002...)
   */
  private async getNextOrderNumber(): Promise<string> {
    const count = await prisma.order.count()
    const number = 1000 + count + 1
    return `ORD-${number}`
  }

  /**
   * Crea una reserva o pedido a partir de una lista de nombres de producto solicitados
   */
  async createReservation(input: CreateReservationInput): Promise<ReservationResult> {
    try {
      if (!input.customerPhone) {
        return { success: false, error: 'Teléfono de cliente requerido' }
      }

      if (!input.productNames || input.productNames.length === 0) {
        return { success: false, error: 'No se especificaron productos para reservar' }
      }

      // Buscar los productos en la base de datos (coincidencia flexible)
      const matchedProducts = []
      for (const nameQuery of input.productNames) {
        const found = await prisma.product.findFirst({
          where: {
            isActive: true,
            OR: [
              { name: { contains: nameQuery } },
              { sku: { contains: nameQuery } },
              { description: { contains: nameQuery } },
            ],
          },
        })

        if (found) {
          matchedProducts.push(found)
        }
      }

      if (matchedProducts.length === 0) {
        return {
          success: false,
          error: 'No se encontraron productos coincidentes en el catálogo para reservar',
        }
      }

      const orderNumber = await this.getNextOrderNumber()
      let totalAmount = 0
      const orderItemsData = []
      const summaryParts: string[] = []

      // Obtener símbolo de moneda del negocio si existe
      const business = await prisma.businessProfile.findFirst()
      const symbol = business?.currencySymbol || 'S/.'

      for (const prod of matchedProducts) {
        totalAmount += prod.price
        orderItemsData.push({
          productId: prod.id,
          quantity: 1,
          unitPrice: prod.price,
        })
        summaryParts.push(`• ${prod.name} (${symbol} ${prod.price.toFixed(2)})`)

        // Descontar stock si tiene stock disponible
        if (prod.stock > 0) {
          await prisma.product.update({
            where: { id: prod.id },
            data: { stock: prod.stock - 1 },
          })
        }
      }

      // Crear la orden en la base de datos
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerPhone: input.customerPhone,
          customerName: input.customerName || 'Cliente WhatsApp',
          status: 'pending',
          totalAmount,
          notes: input.notes || 'Reserva automática generada por WhatsApp',
          channel: input.channel || 'whatsapp',
          items: {
            create: orderItemsData,
          },
        },
      })

      apiLogger.info('Reserva creada exitosamente', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerPhone: input.customerPhone,
        total: totalAmount,
      })

      return {
        success: true,
        orderNumber: order.orderNumber,
        totalAmount,
        itemsSummary: summaryParts.join('\n'),
      }
    } catch (error) {
      logError(apiLogger, error, { stage: 'create-reservation', customerPhone: input.customerPhone })
      return { success: false, error: 'Error interno al registrar la reserva' }
    }
  }

  /**
   * Obtiene las órdenes recientes para el panel de administración
   */
  async getRecentOrders(limit: number = 20) {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })
  }
}

export const reservationService = new ReservationService()
