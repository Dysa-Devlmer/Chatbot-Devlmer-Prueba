import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { ConversationService } from '@/lib/conversation'
import { HorariosService } from '@/lib/horarios'

// GET /api/admin/orders - Listar reservas y pedidos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const phone = searchParams.get('phone')

    const where: any = {}
    if (status) where.status = status
    if (phone) where.customerPhone = { contains: phone }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    const business = await prisma.businessProfile.findFirst()
    const hoursStatus = HorariosService.estaAbierto()

    return NextResponse.json({ 
      success: true, 
      orders,
      currency: business?.currency || 'PEN',
      currencySymbol: business?.currencySymbol || 'S/.',
      businessName: business?.name || "Churu's Comida Rápida",
      isKitchenOpen: hoursStatus.abierto,
      todayHours: hoursStatus.horarioHoy,
      statusMode: hoursStatus.modo,
    })
  } catch (error) {
    logError(apiLogger, error, { stage: 'get-orders' })
    return NextResponse.json(
      { success: false, error: 'Error al obtener pedidos' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/orders/[id] - Cambiar estado (confirmar, cancelar, completar)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, notes } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'orderId y status requeridos' },
        { status: 400 }
      )
    }

    const previousOrder = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!previousOrder) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(notes !== undefined && { notes }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Si el estado cambió y el cliente tiene número de WhatsApp, enviar notificación automática
    if (previousOrder.status !== status && updated.customerPhone) {
      const isDelivery = (updated.notes || '').toLowerCase().includes('delivery') || !(updated.notes || '').toLowerCase().includes('retiro')
      let notifyText = ''

      const trackingUrl = `https://chatbot.zgamersa.com/tracking?order=${updated.orderNumber}`

      if (status === 'confirmed') {
        notifyText = `👨‍🍳🔥 *¡Tu pedido #${updated.orderNumber} ya está en preparación en cocina!*\n\nNuestros cocineros ya están elaborando tus platos con los mejores ingredientes y todo el sabor.\n\n🛵 *Seguimiento en Vivo y Boleta Electrónica:*\nPuedes seguir la preparación de tus platos y descargar tu boleta completa aquí:\n👉 ${trackingUrl}\n\n¡Te avisaremos apenas esté listo!`
      } else if (status === 'ready') {
        if (isDelivery) {
          notifyText = `🛵💨 *¡Tu pedido #${updated.orderNumber} está listo y en camino!*\n\nNuestro repartidor Carlos Mendoza ya salió rumbo a tu dirección con tu pedido calientito.\n\n🛵 *Sigue al repartidor en vivo:*\n👉 ${trackingUrl}\n\n¡Por favor mantente atento para recibirlo! 🍗📦`
        } else {
          notifyText = `🍗✨ *¡Tu pedido #${updated.orderNumber} ya está listo para retirar!*\n\nPuedes pasar a recogerlo en nuestro local:\n📍 *Av. Los Próceres 458* (Ref: A media cuadra del parque principal).\n\n📄 *Ver boleta y detalles:*\n👉 ${trackingUrl}\n\n¡Te esperamos!`
        }
      } else if (status === 'delivered') {
        notifyText = `🎉 *¡Tu pedido #${updated.orderNumber} ha sido entregado!*\n\nMuchísimas gracias por tu preferencia en *Churu's Comida Rápida*. Esperamos que lo disfrutes mucho. ⭐⭐⭐⭐⭐\n\n📄 *Descarga tu boleta electrónica:*\n👉 ${trackingUrl}\n\n¡Buen provecho y que tengas un excelente día!`
      } else if (status === 'cancelled') {
        notifyText = `⚠️ *Aviso sobre tu pedido #${updated.orderNumber}*\n\nTu pedido ha sido cancelado en nuestro sistema. Si tienes alguna consulta o deseas reprogramarlo, puedes escribirnos por este mismo medio.`
      }

      if (notifyText) {
        try {
          await sendWhatsAppMessage(updated.customerPhone, notifyText)
          apiLogger.info('Notificación de cambio de estado enviada a WhatsApp', {
            phone: updated.customerPhone,
            orderNumber: updated.orderNumber,
            newStatus: status,
          })

          // Registrar en la conversación del inbox para que el operador y cliente lo vean en tiempo real
          const user = await prisma.user.findUnique({
            where: { phoneNumber: updated.customerPhone },
          })
          if (user) {
            const conv = await ConversationService.getOrCreateConversation(user.id)
            if (conv) {
              await ConversationService.saveMessage({
                conversationId: conv.id,
                userId: user.id,
                type: 'text',
                content: notifyText,
                direction: 'outbound',
                sentBy: 'system',
                aiProcessed: false,
              })
            }
          }
        } catch (notifyErr) {
          logError(apiLogger, notifyErr, {
            stage: 'notify-order-status-whatsapp',
            phone: updated.customerPhone,
            orderNumber: updated.orderNumber,
          })
        }
      }
    }

    return NextResponse.json({ success: true, order: updated })
  } catch (error) {
    logError(apiLogger, error, { stage: 'update-order' })
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el pedido' },
      { status: 500 }
    )
  }
}
