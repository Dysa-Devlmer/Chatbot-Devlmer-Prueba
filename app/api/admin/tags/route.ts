import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Tags por defecto
const DEFAULT_TAGS = [
  // Prioridad
  { name: 'Urgente', color: '#FF4444', icon: '🔥', category: 'priority', description: 'Requiere atención inmediata' },
  { name: 'Alta Prioridad', color: '#FF6B6B', icon: '⚡', category: 'priority', description: 'Prioridad alta' },
  { name: 'Normal', color: '#4ECDC4', icon: '📋', category: 'priority', description: 'Prioridad normal' },
  { name: 'Baja Prioridad', color: '#95E1D3', icon: '📝', category: 'priority', description: 'Puede esperar' },

  // Estado
  { name: 'Nuevo', color: '#25D366', icon: '🆕', category: 'status', description: 'Cliente nuevo' },
  { name: 'Pendiente', color: '#FFA500', icon: '⏳', category: 'status', description: 'Esperando respuesta' },
  { name: 'En Progreso', color: '#667eea', icon: '🔄', category: 'status', description: 'En proceso' },
  { name: 'Resuelto', color: '#00C851', icon: '✅', category: 'status', description: 'Caso resuelto' },
  { name: 'Cerrado', color: '#6C757D', icon: '🔒', category: 'status', description: 'Conversación cerrada' },

  // Tipo de cliente
  { name: 'VIP', color: '#FFD700', icon: '⭐', category: 'general', description: 'Cliente VIP' },
  { name: 'Potencial', color: '#764ba2', icon: '💎', category: 'general', description: 'Cliente potencial' },
  { name: 'Recurrente', color: '#17A2B8', icon: '🔁', category: 'general', description: 'Cliente frecuente' },
  { name: 'Nuevo Lead', color: '#28A745', icon: '🌱', category: 'general', description: 'Nuevo prospecto' },

  // Departamento/Tema
  { name: 'Ventas', color: '#E91E63', icon: '💰', category: 'general', description: 'Consulta de ventas' },
  { name: 'Soporte', color: '#2196F3', icon: '🔧', category: 'general', description: 'Soporte técnico' },
  { name: 'Facturación', color: '#9C27B0', icon: '🧾', category: 'general', description: 'Tema de facturación' },
  { name: 'Reclamo', color: '#F44336', icon: '⚠️', category: 'general', description: 'Reclamo o queja' },
];

// GET - Obtener todos los tags
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // Verificar si existen tags, si no, crearlos
    let tags: Tag[];

    try {
      const existingCount = await prisma.tag.count();

      if (existingCount === 0) {
        // Crear tags por defecto
        await prisma.tag.createMany({
          data: DEFAULT_TAGS.map((tag) => ({
            name: tag.name,
            color: tag.color,
            icon: tag.icon,
            category: tag.category,
            description: tag.description,
            isActive: true,
            usageCount: 0,
          })),
        });
      }

      // Obtener tags
      const whereClause: { isActive?: boolean; category?: string } = { isActive: true };
      if (category) {
        whereClause.category = category;
      }

      tags = await prisma.tag.findMany({
        where: whereClause,
        orderBy: [{ category: 'asc' }, { usageCount: 'desc' }],
      });
    } catch {
      // Si el modelo Tag no existe aún (migración pendiente), usar tags en memoria
      tags = DEFAULT_TAGS.map((tag, index) => ({
        id: `default-${index}`,
        name: tag.name,
        color: tag.color,
        icon: tag.icon,
        description: tag.description,
        category: tag.category,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (category) {
        tags = tags.filter((t) => t.category === category);
      }
    }

    // Agrupar por categoría
    const byCategory = tags.reduce((acc: Record<string, Tag[]>, tag: Tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    }, {});

    return NextResponse.json({
      tags,
      byCategory,
      categories: Object.keys(byCategory),
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Error al obtener tags' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, icon, description, category } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    try {
      const tag = await prisma.tag.create({
        data: {
          name,
          color: color || '#667eea',
          icon: icon || '🏷️',
          description: description || null,
          category: category || 'custom',
          isActive: true,
          usageCount: 0,
        },
      });

      return NextResponse.json({ tag });
    } catch {
      // Si el modelo no existe, retornar un tag temporal
      return NextResponse.json({
        tag: {
          id: `temp-${Date.now()}`,
          name,
          color: color || '#667eea',
          icon: icon || '🏷️',
          description: description || null,
          category: category || 'custom',
          isActive: true,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        warning: 'Tag creado temporalmente. Ejecute la migración de base de datos.',
      });
    }
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Error al crear tag' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar tag o asignar tags a entidad
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color, icon, description, category, isActive } = body;

    // Caso 1: Asignar tags a usuario
    if (body.userId && body.tagIds !== undefined) {
      const { userId, tagIds } = body;

      await prisma.user.update({
        where: { id: userId },
        data: { tags: JSON.stringify(tagIds) },
      });

      // Incrementar contador de uso de los tags
      if (tagIds.length > 0) {
        try {
          await prisma.tag.updateMany({
            where: { id: { in: tagIds } },
            data: { usageCount: { increment: 1 } },
          });
        } catch {
          // Ignorar si el modelo Tag no existe
        }
      }

      return NextResponse.json({ success: true, userId, tagIds });
    }

    // Caso 2: Asignar tags a conversación
    if (body.conversationId && body.tagIds !== undefined) {
      const { conversationId, tagIds } = body;

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { tags: JSON.stringify(tagIds) },
      });

      // Incrementar contador de uso de los tags
      if (tagIds.length > 0) {
        try {
          await prisma.tag.updateMany({
            where: { id: { in: tagIds } },
            data: { usageCount: { increment: 1 } },
          });
        } catch {
          // Ignorar si el modelo Tag no existe
        }
      }

      return NextResponse.json({ success: true, conversationId, tagIds });
    }

    // Caso 3: Actualizar tag
    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    try {
      const updateData: Partial<Tag> = {};
      if (name !== undefined) updateData.name = name;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (isActive !== undefined) updateData.isActive = isActive;

      const tag = await prisma.tag.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ tag });
    } catch {
      return NextResponse.json(
        { error: 'Tag no encontrado o modelo no disponible' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tag' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tag
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    try {
      await prisma.tag.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { error: 'Tag no encontrado o modelo no disponible' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tag' },
      { status: 500 }
    );
  }
}
