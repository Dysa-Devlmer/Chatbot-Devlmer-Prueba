const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.order.deleteMany({
    where: {
      orderNumber: { in: ['ORD-1001', 'ORD-1002', 'ORD-1003', 'ORD-1004', 'ORD-1005', 'ORD-1006', 'ORD-1007', 'ORD-1008'] }
    }
  });
  console.log('Pedidos ficticios / duplicados eliminados:', deleted.count);

  await prisma.order.updateMany({
    where: { orderNumber: 'ORD-1009' },
    data: { 
      status: 'pending', 
      notes: 'Delivery a San Genaro, Chorrillos - Pago contraentrega en efectivo' 
    }
  });

  const remaining = await prisma.order.findMany({
    include: { items: { include: { product: true } } }
  });
  console.log('Pedidos reales activos restantes:', remaining.length);
  for (const o of remaining) {
    console.log(`- ${o.orderNumber}: ${o.customerName} (${o.customerPhone}) | Total: S/. ${o.totalAmount} | Estado: ${o.status}`);
    for (const item of o.items) {
      console.log(`    ${item.quantity}x ${item.product.name} (S/. ${item.unitPrice})`);
    }
  }
}

main().finally(() => prisma.$disconnect());
