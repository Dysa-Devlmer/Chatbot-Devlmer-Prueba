const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('\n🔍 Buscando webhooks duplicados...\n');

  // Obtener todos los webhooks de tipo message_received de las últimas 24 horas
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const webhooks = await prisma.webhookLog.findMany({
    where: {
      event: 'message_received',
      createdAt: { gte: yesterday }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      payload: true,
      status: true
    }
  });

  const messageIds = new Map(); // whatsappId -> array of webhook IDs

  webhooks.forEach(wh => {
    const message = wh.payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message?.id) {
      if (!messageIds.has(message.id)) {
        messageIds.set(message.id, []);
      }
      messageIds.get(message.id).push({
        webhookId: wh.id.substring(0, 8),
        time: new Date(wh.createdAt).toLocaleTimeString('es-CL'),
        status: wh.status
      });
    }
  });

  console.log('📊 Estadísticas de duplicados:\n');
  let duplicateCount = 0;
  let uniqueCount = 0;

  for (const [msgId, webhookList] of messageIds.entries()) {
    if (webhookList.length > 1) {
      duplicateCount++;
      console.log(`❌ DUPLICADO (${webhookList.length}x): ${msgId.substring(0, 20)}...`);
      webhookList.forEach((wh, idx) => {
        console.log(`   ${idx + 1}. [${wh.time}] Webhook: ${wh.webhookId} - ${wh.status}`);
      });
      console.log('');
    } else {
      uniqueCount++;
    }
  }

  console.log(`\n✅ Mensajes únicos: ${uniqueCount}`);
  console.log(`❌ Mensajes duplicados: ${duplicateCount}`);

  console.log('\n\n🔍 Verificando mensajes guardados con el mismo whatsappId...\n');

  const messages = await prisma.message.findMany({
    where: {
      whatsappId: { not: null },
      timestamp: { gte: yesterday }
    },
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      whatsappId: true,
      timestamp: true,
      direction: true,
      content: true
    }
  });

  const savedMessageIds = new Map();

  messages.forEach(msg => {
    if (!savedMessageIds.has(msg.whatsappId)) {
      savedMessageIds.set(msg.whatsappId, []);
    }
    savedMessageIds.get(msg.whatsappId).push({
      msgId: msg.id.substring(0, 8),
      time: new Date(msg.timestamp).toLocaleTimeString('es-CL'),
      direction: msg.direction,
      content: msg.content.substring(0, 40) + '...'
    });
  });

  let duplicateSavedCount = 0;

  for (const [whatsappId, msgList] of savedMessageIds.entries()) {
    if (msgList.length > 1) {
      duplicateSavedCount++;
      console.log(`❌ MENSAJE GUARDADO DUPLICADO (${msgList.length}x): ${whatsappId.substring(0, 20)}...`);
      msgList.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. [${msg.time}] ${msg.direction === 'inbound' ? '📨' : '📤'} ${msg.content}`);
      });
      console.log('');
    }
  }

  console.log(`\n❌ Total de mensajes guardados con whatsappId duplicado: ${duplicateSavedCount}\n`);

  await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
