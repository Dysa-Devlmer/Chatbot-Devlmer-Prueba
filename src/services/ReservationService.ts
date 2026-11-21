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
  deliveryType?: 'delivery' | 'pickup'
  deliveryAddress?: string
  paymentMethod?: string
}

export interface ReservationResult {
  success: boolean
  orderNumber?: string
  totalAmount?: number
  itemsSummary?: string
  error?: string
  isExisting?: boolean
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

      // Verificación estricta anti-duplicados: Si el cliente ya tiene una orden activa
      // en estado 'pending' o 'confirmed' generada en los últimos 15 minutos, NO duplicar
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
      const existingActiveOrder = await prisma.order.findFirst({
        where: {
          customerPhone: input.customerPhone,
          createdAt: { gte: fifteenMinutesAgo },
          status: { in: ['pending', 'confirmed'] },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingActiveOrder) {
        apiLogger.info('Duplicado prevenido: Orden activa existente encontrada', {
          customerPhone: input.customerPhone,
          orderNumber: existingActiveOrder.orderNumber,
          status: existingActiveOrder.status,
        })
        return {
          success: true,
          orderNumber: existingActiveOrder.orderNumber,
          totalAmount: existingActiveOrder.totalAmount,
          isExisting: true,
        }
      }

      // Parsear nombres de productos, cantidades y multiplicadores (ej: "2x Hamburguesa Doble" o "1 Hamburguesa Clásica")
      const parsedItems: { rawQuery: string; cleanName: string; quantity: number }[] = []
      for (const nameQuery of input.productNames) {
        const trimmed = nameQuery.trim()
        if (!trimmed) continue

        // Detectar multiplicador inicial "2x Hamburguesa" o "2 Hamburguesa"
        const prefixMatch = trimmed.match(/^(\d+)\s*[xX*]?\s+(.+)$/)
        // Detectar multiplicador final "Hamburguesa x 2" o "Hamburguesa (2)"
        const suffixMatch = trimmed.match(/^(.+?)\s*[(xX*]\s*(\d+)\s*\)?$/)

        if (prefixMatch) {
          parsedItems.push({
            rawQuery: trimmed,
            quantity: Math.max(1, parseInt(prefixMatch[1], 10)),
            cleanName: prefixMatch[2].trim(),
          })
        } else if (suffixMatch) {
          parsedItems.push({
            rawQuery: trimmed,
            quantity: Math.max(1, parseInt(suffixMatch[2], 10)),
            cleanName: suffixMatch[1].trim(),
          })
        } else {
          parsedItems.push({
            rawQuery: trimmed,
            quantity: 1,
            cleanName: trimmed,
          })
        }
      }

      // Buscar los productos en la base de datos (coincidencia inteligente de texto)
      const allActiveProducts = await prisma.product.findMany({
        where: { isActive: true },
      })

      const orderItemsData = []
      let totalAmount = 0
      const summaryParts: string[] = []

      // Obtener símbolo de moneda del negocio si existe
      const business = await prisma.businessProfile.findFirst()
      const symbol = business?.currencySymbol || 'S/.'

      for (const item of parsedItems) {
        const searchLower = item.cleanName.toLowerCase()
        // 1. Coincidencia exacta o por inclusión de nombre
        let matched = allActiveProducts.find((p) => p.name.toLowerCase() === searchLower)
        if (!matched) {
          matched = allActiveProducts.find((p) => p.name.toLowerCase().includes(searchLower) || searchLower.includes(p.name.toLowerCase()))
        }
        // 2. Coincidencia por palabras clave (ej: "hamburguesa doble")
        if (!matched) {
          const words = searchLower.split(/\s+/).filter((w) => w.length > 2)
          matched = allActiveProducts.find((p) => words.every((w) => p.name.toLowerCase().includes(w)))
        }

        if (matched) {
          const lineTotal = matched.price * item.quantity
          totalAmount += lineTotal
          orderItemsData.push({
            productId: matched.id,
            quantity: item.quantity,
            unitPrice: matched.price,
          })
          summaryParts.push(`• ${item.quantity}x ${matched.name} (${symbol} ${lineTotal.toFixed(2)})`)

          // Descontar stock si tiene stock disponible
          if (matched.stock > 0) {
            await prisma.product.update({
              where: { id: matched.id },
              data: { stock: Math.max(0, matched.stock - item.quantity) },
            })
          }
        } else {
          // Producto no encontrado en catálogo DB, registrar en notas para cocina
          summaryParts.push(`• ${item.quantity}x ${item.cleanName} (Manual)`)
        }
      }

      // Si ningún producto coincidió pero el cliente solicitó productos, crear con el primer producto activo o genérico
      // para que COCINA NUNCA PIERDA UNA COMANDA
      if (orderItemsData.length === 0 && allActiveProducts.length > 0) {
        const fallbackProduct = allActiveProducts[0]
        orderItemsData.push({
          productId: fallbackProduct.id,
          quantity: 1,
          unitPrice: fallbackProduct.price,
        })
        totalAmount = fallbackProduct.price
      }

      const orderNumber = await this.getNextOrderNumber()

      // Construir notas claras para cocina y despacho
      let formattedNotes = input.notes || ''
      if (input.deliveryType === 'delivery') {
        formattedNotes = `🛵 Delivery a: ${input.deliveryAddress || 'Dirección acordada'}${input.paymentMethod ? ` | Pago: ${input.paymentMethod}` : ''}${input.notes ? ` (${input.notes})` : ''}`
      } else if (input.deliveryType === 'pickup') {
        formattedNotes = `🏬 Retiro en Local: Av. Los Próceres 458${input.paymentMethod ? ` | Pago: ${input.paymentMethod}` : ''}${input.notes ? ` (${input.notes})` : ''}`
      }
      if (!formattedNotes) {
        formattedNotes = 'Pedido confirmado por WhatsApp'
      }

      // Crear la orden en la base de datos
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerPhone: input.customerPhone,
          customerName: input.customerName || 'Cliente WhatsApp',
          status: 'pending',
          totalAmount,
          notes: formattedNotes,
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
