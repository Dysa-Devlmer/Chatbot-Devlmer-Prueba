import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
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

Para cualquier otra consulta, simplemente escribe tu pregunta y te responderé usando IA.`,
        isActive: true,
      },
      {
        trigger: '/info',
        name: 'Información',
        description: 'Información sobre el sistema JARVIS',
        response: `ℹ️ *Sobre JARVIS*

JARVIS es un asistente de IA avanzado integrado con WhatsApp.

🔹 Powered by Ollama (Qwen 2.5 - 100% GRATUITO)
🔹 Procesamiento de lenguaje natural
🔹 Memoria de conversaciones
🔹 Soporte multimedia
🔹 Analytics en tiempo real

Versión: 2.0.0
Desarrollado con Next.js 16 + Prisma + WhatsApp Business API + Ollama`,
        isActive: true,
      },
      {
        trigger: '/contacto',
        name: 'Contacto',
        description: 'Información de contacto',
        response: `📞 *Información de Contacto*

WhatsApp: +56 9 6541 9765
Email: info@zgamersa.com
Web: zgamersa.com
Chatbot: chatbot.zgamersa.com

Horario de atención:
Lunes a Viernes: 9:00 - 18:00 (CLT)
Sábados: 10:00 - 14:00 (CLT)`,
        isActive: true,
      },
      {
        trigger: '/hora',
        name: 'Hora',
        description: 'Muestra la hora actual',
        response: `🕐 La hora actual es: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`,
        isActive: true,
      },
    ];

    console.log('Creating commands...');
    let createdCommands = 0;
    for (const cmd of commands) {
      await prisma.command.upsert({
        where: { trigger: cmd.trigger },
        update: cmd,
        create: cmd,
      });
      createdCommands++;
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
    let createdTemplates = 0;
    for (const template of templates) {
      await prisma.messageTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template,
      });
      createdTemplates++;
    }

    // Crear configuración del sistema
    const configs = [
      {
        key: 'ai_enabled',
        value: 'true',
        type: 'boolean',
        description: 'Habilitar procesamiento con IA usando Ollama (local y gratuito!)',
      },
      {
        key: 'ai_model',
        value: 'qwen2.5:7b',
        type: 'string',
        description: 'Modelo de Ollama a utilizar (qwen2.5:7b, mistral, phi3, etc.)',
      },
      {
        key: 'max_message_length',
        value: '4000',
        type: 'number',
        description: 'Longitud máxima de mensajes',
      },
    ];

    console.log('Creating system config...');
    let createdConfigs = 0;
    for (const config of configs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config,
      });
      createdConfigs++;
    }

    console.log('✅ Seed completado exitosamente!');

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada exitosamente',
      stats: {
        commands: createdCommands,
        templates: createdTemplates,
        configs: createdConfigs,
      },
    });
  } catch (error) {
    console.error('Error en seed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}