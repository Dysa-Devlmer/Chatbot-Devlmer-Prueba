const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWebhooks() {
  console.log('\n📊 Últimos 20 webhooks recibidos:\n');

  const webhooks = await prisma.webhookLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      event: true,
      status: true,
      createdAt: true,
      payload: true
    }
  });

  webhooks.forEach(wh => {
    const time = new Date(wh.createdAt).toLocaleString('es-CL');
    const message = wh.payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const statusUpdate = wh.payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];

    if (message) {
      const msgId = message.id ? message.id.substring(0, 15) + '...' : 'N/A';
      console.log(`[${time}] 📩 MESSAGE - Type: ${message.type}, From: ${message.from}, ID: ${msgId}`);
    } else if (statusUpdate) {
      const statusId = statusUpdate.id ? statusUpdate.id.substring(0, 15) + '...' : 'N/A';
      console.log(`[${time}] 📊 STATUS - ${statusUpdate.status}, ID: ${statusId}`);
    } else {
      console.log(`[${time}] ❓ ${wh.event} - ${wh.status}`);
    }
  });

  console.log('\n📝 Últimos 10 mensajes guardados:\n');

  const messages = await prisma.message.findMany({
    orderBy: { timestamp: 'desc' },
    take: 10,
    select: {
      timestamp: true,
      direction: true,
      type: true,
      content: true,
      whatsappId: true
    }
  });

  messages.forEach(msg => {
    const time = new Date(msg.timestamp).toLocaleString('es-CL');
    const direction = msg.direction === 'inbound' ? '📨' : '📤';
    const content = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
    console.log(`[${time}] ${direction} ${msg.type}: ${content}`);
  });

  await prisma.$disconnect();
}

checkWebhooks().catch(console.error);
