import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiLogger, logError } from '@/lib/logger';
import { reservationService } from '@/services/ReservationService';
import { PRODUCT_PRICES } from '@/lib/currencyCatalog';

// POST /api/orders - Crear pedido público desde Menú / Carrito Checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail = '',
      deliveryMode = 'delivery',
      deliveryAddress = '',
      paymentMethod = 'Efectivo',
      invoiceType = 'boleta',
      invoiceRuc = '',
      invoiceRazonSocial = '',
      items = [],
      notes = '',
    } = body;

    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json(
        { success: false, error: 'El número de teléfono/WhatsApp es obligatorio' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El carrito no contiene productos' },
        { status: 400 }
      );
    }

    // Cargar perfil del negocio y productos activos
    const [business, allActiveProducts] = await Promise.all([
      prisma.businessProfile.findFirst(),
      prisma.product.findMany({ where: { isActive: true } }),
    ]);

    const activeCurrency = ((business?.currency || 'PEN').toUpperCase()) as 'PEN' | 'CLP' | 'ARS';
    const currencySymbol = business?.currencySymbol || (activeCurrency === 'PEN' ? 'S/.' : '$');

    // Procesar cada item del carrito y calcular total real
    let totalAmount = 0;
    const orderItemsData: Array<{ productId: string; quantity: number; unitPrice: number }> = [];
    const summaryLines: string[] = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemName = item.productName || item.name || '';
      
      // Buscar producto en DB por ID o por nombre
      let matched = allActiveProducts.find(p => p.id === item.productId || p.id === item.id);
      if (!matched && itemName) {
        matched = allActiveProducts.find(p => p.name.toLowerCase() === itemName.toLowerCase());
      }
      if (!matched && itemName) {
        matched = allActiveProducts.find(p => p.name.toLowerCase().includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(p.name.toLowerCase()));
      }

      if (!matched && allActiveProducts.length > 0) {
        matched = allActiveProducts[0];
      }

      if (matched) {
        const multi = PRODUCT_PRICES[matched.name];
        // SEGURIDAD FINANCIERA (OWASP): El precio unitario SIEMPRE se calcula en el servidor desde la base de datos oficial.
        // NUNCA se confía en item.price enviado por el cliente para evitar manipulación de montos.
        const unitPrice = multi ? (multi[activeCurrency] ?? matched.price) : matched.price;
        const lineTotal = unitPrice * qty;
        totalAmount += lineTotal;

        orderItemsData.push({
          productId: matched.id,
          quantity: qty,
          unitPrice,
        });

        summaryLines.push(`• ${qty}x ${matched.name} (${currencySymbol} ${lineTotal.toFixed(2)})`);

        // Descontar stock
        if (matched.stock > 0) {
          await prisma.product.update({
            where: { id: matched.id },
            data: { stock: Math.max(0, matched.stock - qty) },
          });
        }
      }
    }

    // Agregar costo de delivery si aplica
    const isDelivery = deliveryMode === 'delivery';
    const isHighDenom = ['CLP', 'COP', 'ARS'].includes(activeCurrency);
    const deliveryFee = isDelivery ? (isHighDenom ? 2500 : 4.00) : 0.00;
    totalAmount += deliveryFee;

    // Obtener siguiente correlativo seguro (ORD-XXXX)
    const orderNumber = await reservationService.getNextOrderNumber();

    // Formatear notas claras para el Tablero de Cocina KDS y Motorizado
    const formattedNotes = [
      isDelivery ? `🛵 Delivery a: ${deliveryAddress || 'Sin dirección'}` : `🏬 Retiro en Local`,
      `💳 Pago: ${paymentMethod}`,
      customerEmail ? `📧 Email: ${customerEmail.trim()}` : null,
      invoiceType === 'factura' && invoiceRuc ? `📄 Factura RUC: ${invoiceRuc} (${invoiceRazonSocial || 'Empresa'})` : '📄 Boleta Electrónica',
      deliveryFee > 0 ? `Envío: ${currencySymbol} ${deliveryFee.toFixed(2)}` : null,
      notes ? `Nota comensal: ${notes}` : null,
      `Detalle: ${summaryLines.join(' | ')}`
    ].filter(Boolean).join(' | ');

    // Crear la orden en base de datos
    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerPhone: customerPhone.trim(),
        customerName: customerName?.trim() || 'Cliente Web',
        status: 'pending',
        totalAmount,
        notes: formattedNotes,
        channel: 'web',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    apiLogger.info('✅ Pedido Web Creado Exitosamente', {
      orderNumber,
      totalAmount,
      channel: 'web',
      customerPhone,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        totalAmount: createdOrder.totalAmount,
        customerName: createdOrder.customerName,
        status: createdOrder.status,
      },
    });
  } catch (error) {
    logError(apiLogger, error, { stage: 'create-web-order' });
    return NextResponse.json(
      { success: false, error: 'Error al procesar el pedido' },
      { status: 500 }
    );
  }
}
