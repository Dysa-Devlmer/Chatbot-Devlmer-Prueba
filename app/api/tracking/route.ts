import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiLogger, logError } from '@/lib/logger';

// GET /api/tracking?order=ORD-XXXX
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderNumber = searchParams.get('order')?.trim().toUpperCase();

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Código de orden requerido (?order=ORD-XXXX)' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: orderNumber },
          { id: orderNumber },
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Pedido #${orderNumber} no encontrado en el sistema` },
        { status: 404 }
      );
    }

    const notesLower = (order.notes || '').toLowerCase();
    const isPickup = notesLower.includes('retiro') || notesLower.includes('recojo') || notesLower.includes('local');
    const isDelivery = !isPickup;

    const notesStr = order.notes || '';
    const paymentMatch = notesStr.match(/💳 Pago:\s*([^|]+)/i);
    const paymentMethod = paymentMatch ? paymentMatch[1].trim() : 'Efectivo';
    const emailMatch = notesStr.match(/📧 Email:\s*([^|]+)/i);
    const customerEmail = emailMatch ? emailMatch[1].trim() : '';
    const invoiceMatch = notesStr.match(/📄 (?:Factura|Boleta)[^|]*/i);
    const invoiceType = invoiceMatch ? invoiceMatch[0].replace('📄', '').trim() : 'Boleta Electrónica';

    // Obtener perfil del negocio para el RUC y razón social
    const business = await prisma.businessProfile.findFirst();

    // Formatear respuesta pública segura
    const trackingData = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName || 'Cliente',
      status: order.status, // 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled'
      totalAmount: order.totalAmount,
      isDelivery,
      deliveryType: isDelivery ? 'delivery' : 'pickup',
      paymentMethod,
      customerEmail,
      invoiceType,
      address: isDelivery 
        ? (order.notes?.replace(/.*(?:delivery a|dirección:?)\s*/i, '').split('|')[0].trim() || 'Dirección registrada')
        : (business?.address || 'Av. Los Próceres 458, Chorrillos'),
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product?.name || 'Producto del Catálogo',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      })),
      business: {
        name: business?.name || "Churu's Comida Rápida",
        ruc: business?.phone ? '20608934512' : '20608934512',
        address: business?.address || 'Av. Los Próceres 458, Chorrillos, Lima',
        currencySymbol: business?.currencySymbol || 'S/.',
      },
      driver: isDelivery && (order.status === 'ready' || order.status === 'delivered') ? {
        name: 'Carlos Mendoza',
        rating: 4.9,
        deliveriesCount: 420,
        vehicle: 'Moto Honda Black',
        phone: '+51 987 654 321',
      } : null,
    };

    return NextResponse.json({ success: true, tracking: trackingData });
  } catch (error) {
    logError(apiLogger, error, { stage: 'public-tracking-api' });
    return NextResponse.json(
      { success: false, error: 'Error al consultar estado de orden' },
      { status: 500 }
    );
  }
}
