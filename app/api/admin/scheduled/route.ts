import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ScheduledMessage {
  id: string;
  phoneNumber: string;
  content: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled' | 'completed';
  userId?: string;
  userName?: string;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

type CampaignRecord = {
  id: string;
  message: string;
  targetUsers: unknown;
  status: string;
  scheduledFor: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// GET - Obtener mensajes programados
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Usar la tabla Campaign para almacenar mensajes programados
    const whereClause: { status?: string } = {};
    if (status) {
      whereClause.status = status;
    }

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      orderBy: { scheduledFor: 'asc' },
    });

    // Transformar a formato de ScheduledMessage
    const scheduledMessages: ScheduledMessage[] = campaigns.map((c: CampaignRecord) => {
      const targetUsers = c.targetUsers as { phoneNumber?: string; userName?: string } | null;
      return {
        id: c.id,
        phoneNumber: targetUsers?.phoneNumber || '',
        content: c.message,
        scheduledFor: c.scheduledFor || new Date(),
        status: c.status as ScheduledMessage['status'],
        userId: undefined,
        userName: targetUsers?.userName,
        createdAt: c.createdAt,
        sentAt: c.status === 'completed' ? c.updatedAt : undefined,
      };
    });

    // Estadísticas
    const stats = {
      total: scheduledMessages.length,
      pending: scheduledMessages.filter((m) => m.status === 'pending').length,
      sent: scheduledMessages.filter((m) => m.status === 'sent' || m.status === 'completed').length,
      failed: scheduledMessages.filter((m) => m.status === 'failed').length,
      cancelled: scheduledMessages.filter((m) => m.status === 'cancelled').length,
    };

    return NextResponse.json({
      scheduledMessages,
      stats,
    });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes programados' },
      { status: 500 }
    );
  }
}

// POST - Crear mensaje programado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, content, scheduledFor, userName } = body;

    if (!phoneNumber || !content || !scheduledFor) {
      return NextResponse.json(
        { error: 'phoneNumber, content y scheduledFor son requeridos' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'La fecha programada debe ser en el futuro' },
        { status: 400 }
      );
    }

    // Crear como campaign individual
    const campaign = await prisma.campaign.create({
      data: {
        name: `Mensaje a ${userName || phoneNumber}`,
        message: content,
        targetUsers: { phoneNumber, userName },
        status: 'pending',
        scheduledFor: scheduledDate,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
      },
    });

    const scheduledMessage: ScheduledMessage = {
      id: campaign.id,
      phoneNumber,
      content,
      scheduledFor: scheduledDate,
      status: 'pending',
      userName,
      createdAt: campaign.createdAt,
    };

    return NextResponse.json({ scheduledMessage });
  } catch (error) {
    console.error('Error creating scheduled message:', error);
    return NextResponse.json(
      { error: 'Error al crear mensaje programado' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar mensaje programado
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, scheduledFor, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    const updateData: {
      message?: string;
      scheduledFor?: Date;
      status?: string;
    } = {};

    if (content !== undefined) updateData.message = content;
    if (scheduledFor !== undefined) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'La fecha programada debe ser en el futuro' },
          { status: 400 }
        );
      }
      updateData.scheduledFor = scheduledDate;
    }
    if (status !== undefined) updateData.status = status;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    const targetUsers = campaign.targetUsers as { phoneNumber?: string; userName?: string } | null;

    const scheduledMessage: ScheduledMessage = {
      id: campaign.id,
      phoneNumber: targetUsers?.phoneNumber || '',
      content: campaign.message,
      scheduledFor: campaign.scheduledFor || new Date(),
      status: campaign.status as ScheduledMessage['status'],
      userName: targetUsers?.userName,
      createdAt: campaign.createdAt,
    };

    return NextResponse.json({ scheduledMessage });
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    return NextResponse.json(
      { error: 'Error al actualizar mensaje programado' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar mensaje programado
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

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled message:', error);
    return NextResponse.json(
      { error: 'Error al eliminar mensaje programado' },
      { status: 500 }
    );
  }
}
