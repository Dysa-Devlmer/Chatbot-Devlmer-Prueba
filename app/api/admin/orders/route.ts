import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'

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

    return NextResponse.json({ success: true, orders })
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

    return NextResponse.json({ success: true, order: updated })
  } catch (error) {
    logError(apiLogger, error, { stage: 'update-order' })
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el pedido' },
      { status: 500 }
    )
  }
}
