import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QuickReply {
  id: string;
  title: string;
  shortcut: string; // ej: /saludo, /precio, /horario
  content: string;
  category: string;
  emoji: string;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Templates por defecto
const DEFAULT_QUICK_REPLIES = [
  {
    title: 'Saludo',
    shortcut: '/saludo',
    content: '¡Hola! 👋 Gracias por contactarnos. ¿En qué puedo ayudarte hoy?',
    category: 'general',
    emoji: '👋',
  },
  {
    title: 'Despedida',
    shortcut: '/bye',
    content: 'Gracias por contactarnos. ¡Que tengas un excelente día! 😊',
    category: 'general',
    emoji: '👋',
  },
  {
    title: 'Horarios',
    shortcut: '/horario',
    content: '📅 Nuestro horario de atención es:\n\n• Lunes a Viernes: 9:00 AM - 6:00 PM\n• Sábados: 10:00 AM - 2:00 PM\n• Domingos: Cerrado',
    category: 'info',
    emoji: '🕐',
  },
  {
    title: 'Espera',
    shortcut: '/espera',
    content: 'Un momento por favor, estoy revisando tu consulta... ⏳',
    category: 'general',
    emoji: '⏳',
  },
  {
    title: 'Contacto',
    shortcut: '/contacto',
    content: '📞 Puedes contactarnos por:\n\n• WhatsApp: +56 9 6541 9765\n• Email: info@zgamersa.com\n• Web: zgamersa.com\n• Chatbot: chatbot.zgamersa.com',
    category: 'info',
    emoji: '📞',
  },
  {
    title: 'Servicios',
    shortcut: '/servicios',
    content: '🛠️ Nuestros servicios incluyen:\n\n• Desarrollo de software a medida\n• Chatbots con IA\n• Automatización de procesos\n• Integración de APIs\n\n¿Te interesa alguno en particular?',
    category: 'ventas',
    emoji: '🛠️',
  },
  {
    title: 'Precio',
    shortcut: '/precio',
    content: '💰 Los precios varían según el proyecto. ¿Podrías contarme más sobre lo que necesitas para darte una cotización personalizada?',
    category: 'ventas',
    emoji: '💰',
  },
  {
    title: 'Confirmar',
    shortcut: '/ok',
    content: '✅ Perfecto, entendido. ¿Hay algo más en lo que pueda ayudarte?',
    category: 'general',
    emoji: '✅',
  },
  {
    title: 'Transferir',
    shortcut: '/transferir',
    content: '🔄 Voy a transferir tu caso a un especialista. Te contactará en breve.',
    category: 'soporte',
    emoji: '🔄',
  },
  {
    title: 'Agradecimiento',
    shortcut: '/gracias',
    content: '¡Gracias por tu preferencia! 🙏 Fue un placer atenderte.',
    category: 'general',
    emoji: '🙏',
  },
];

// GET - Obtener todas las respuestas rápidas
export async function GET() {
  try {
    // Verificar si existen templates, si no, crearlos
    const existingCount = await prisma.messageTemplate.count();

    if (existingCount === 0) {
      // Crear templates por defecto
      await prisma.messageTemplate.createMany({
        data: DEFAULT_QUICK_REPLIES.map((reply) => ({
          name: reply.title,
          category: reply.category,
          content: reply.content,
          language: 'es',
          isActive: true,
          usageCount: 0,
          // Guardar shortcut y emoji en metadata
          variables: { shortcut: reply.shortcut, emoji: reply.emoji },
        })),
      });
    }

    // Obtener templates
    const templates = await prisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
    });

    // Transformar a formato QuickReply
    type TemplateRecord = typeof templates[number];
    const quickReplies = templates.map((t: TemplateRecord) => ({
      id: t.id,
      title: t.name,
      shortcut: (t.variables as Record<string, string> | null)?.shortcut || `/${t.name.toLowerCase()}`,
      content: t.content,
      category: t.category,
      emoji: (t.variables as Record<string, string> | null)?.emoji || '📝',
      usageCount: t.usageCount,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    // Agrupar por categoría
    type QuickReplyItem = typeof quickReplies[number];
    const byCategory = quickReplies.reduce((acc: Record<string, QuickReplyItem[]>, reply: QuickReplyItem) => {
      if (!acc[reply.category]) {
        acc[reply.category] = [];
      }
      acc[reply.category].push(reply);
      return acc;
    }, {});

    return NextResponse.json({
      quickReplies,
      byCategory,
      categories: Object.keys(byCategory),
    });
  } catch (error) {
    console.error('Error fetching quick replies:', error);
    return NextResponse.json(
      { error: 'Error al obtener respuestas rápidas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva respuesta rápida
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, shortcut, content, category, emoji } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'title, content y category son requeridos' },
        { status: 400 }
      );
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name: title,
        category,
        content,
        language: 'es',
        isActive: true,
        usageCount: 0,
        variables: { shortcut: shortcut || `/${title.toLowerCase()}`, emoji: emoji || '📝' },
      },
    });

    return NextResponse.json({
      quickReply: {
        id: template.id,
        title: template.name,
        shortcut: (template.variables as any)?.shortcut,
        content: template.content,
        category: template.category,
        emoji: (template.variables as any)?.emoji,
        usageCount: template.usageCount,
        isActive: template.isActive,
      },
    });
  } catch (error) {
    console.error('Error creating quick reply:', error);
    return NextResponse.json(
      { error: 'Error al crear respuesta rápida' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar respuesta rápida
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, shortcut, content, category, emoji, isActive, incrementUsage } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    // Si solo es incrementar uso
    if (incrementUsage) {
      await prisma.messageTemplate.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });
      return NextResponse.json({ success: true });
    }

    const updateData: any = {};
    if (title) updateData.name = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Actualizar variables (shortcut, emoji)
    const current = await prisma.messageTemplate.findUnique({ where: { id } });
    if (current) {
      const currentVars = current.variables as any || {};
      updateData.variables = {
        ...currentVars,
        ...(shortcut && { shortcut }),
        ...(emoji && { emoji }),
      };
    }

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      quickReply: {
        id: template.id,
        title: template.name,
        shortcut: (template.variables as any)?.shortcut,
        content: template.content,
        category: template.category,
        emoji: (template.variables as any)?.emoji,
        usageCount: template.usageCount,
        isActive: template.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating quick reply:', error);
    return NextResponse.json(
      { error: 'Error al actualizar respuesta rápida' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar respuesta rápida o resetear todas
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reset = searchParams.get('reset');

    // Si es reset, eliminar todas y recrear templates por defecto
    if (reset === 'true') {
      await prisma.messageTemplate.deleteMany({});

      // Recrear templates por defecto
      await prisma.messageTemplate.createMany({
        data: DEFAULT_QUICK_REPLIES.map((reply) => ({
          name: reply.title,
          category: reply.category,
          content: reply.content,
          language: 'es',
          isActive: true,
          usageCount: 0,
          variables: { shortcut: reply.shortcut, emoji: reply.emoji },
        })),
      });

      return NextResponse.json({ success: true, message: 'Templates reseteados correctamente' });
    }

    // Eliminar template individual
    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    await prisma.messageTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quick reply:', error);
    return NextResponse.json(
      { error: 'Error al eliminar respuesta rápida' },
      { status: 500 }
    );
  }
}
