import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear comandos predeterminados
  const commands = [
    {
      trigger: '/ayuda',
      name: 'Ayuda',
      description: 'Muestra la lista de comandos disponibles',
      response: `🤖 *JARVIS - Comandos Disponibles*

/ayuda - Muestra este mensaje
/info - Información sobre JARVIS
/contacto - Información de contacto
/hora - Hora actual
/clima - Información del clima (próximamente)

Para cualquier otra consulta, simplemente escribe tu pregunta y te responderé usando IA.`,
      isActive: true,
    },
    {
      trigger: '/info',
      name: 'Información',
      description: 'Información sobre el sistema JARVIS',
      response: `ℹ️ *Sobre JARVIS*

JARVIS es un asistente de IA avanzado integrado con WhatsApp.

🔹 Powered by Claude AI
🔹 Procesamiento de lenguaje natural
🔹 Memoria de conversaciones
🔹 Soporte multimedia
🔹 Analytics en tiempo real

Versión: 1.0.0
Desarrollado con Next.js 16 + Prisma + WhatsApp Business API`,
      isActive: true,
    },
    {
      trigger: '/contacto',
      name: 'Contacto',
      description: 'Información de contacto',
      response: `📞 *Información de Contacto*

WhatsApp: +56 9 6541 9765
Email: contacto@devlmer.cl
Web: chatbot.zgamersa.com

Horario de atención:
Lunes a Viernes: 9:00 - 18:00 (CLT)
Sábados: 10:00 - 14:00 (CLT)`,
      isActive: true,
    },
    {
      trigger: '/hora',
      name: 'Hora',
      description: 'Muestra la hora actual',
      response: `🕐 Hora actual: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`,
      isActive: true,
    },
  ];

  console.log('Creating commands...');
  for (const cmd of commands) {
    await prisma.command.upsert({
      where: { trigger: cmd.trigger },
      update: cmd,
      create: cmd,
    });
  }

  // Crear templates de mensajes
  const templates = [
    {
      name: 'greeting',
      category: 'greeting',
      language: 'es',
      content: '👋 ¡Hola! Soy JARVIS, tu asistente de IA. ¿En qué puedo ayudarte hoy?',
      isActive: true,
    },
    {
      name: 'farewell',
      category: 'farewell',
      language: 'es',
      content: '👋 ¡Hasta pronto! Si necesitas ayuda, no dudes en escribirme.',
      isActive: true,
    },
    {
      name: 'error',
      category: 'error',
      language: 'es',
      content: '❌ Lo siento, ha ocurrido un error. Por favor, intenta nuevamente o contacta con soporte.',
      isActive: true,
    },
    {
      name: 'media_received',
      category: 'media_received',
      language: 'es',
      content: '📎 He recibido tu archivo. ¿Hay algo específico que necesites?',
      isActive: true,
    },
  ];

  console.log('Creating message templates...');
  for (const template of templates) {
    await prisma.messageTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
  }

  // Crear configuración del sistema
  const configs = [
    {
      key: 'ai_enabled',
      value: 'true',
      type: 'boolean',
      description: 'Habilitar procesamiento con IA',
    },
    {
      key: 'ai_model',
      value: 'claude-3-5-sonnet-20241022',
      type: 'string',
      description: 'Modelo de IA a utilizar',
    },
    {
      key: 'max_message_length',
      value: '4000',
      type: 'number',
      description: 'Longitud máxima de mensajes',
    },
    {
      key: 'response_timeout',
      value: '30',
      type: 'number',
      description: 'Timeout para respuestas en segundos',
    },
    {
      key: 'auto_close_conversation_hours',
      value: '24',
      type: 'number',
      description: 'Horas para cerrar conversación automáticamente',
    },
  ];

  console.log('Creating system config...');
  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }

  console.log('✅ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });