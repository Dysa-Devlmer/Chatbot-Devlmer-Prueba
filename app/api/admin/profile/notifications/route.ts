import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const profile = await prisma.adminProfile.findFirst();

    if (!profile) {
      return NextResponse.json({
        preferences: {
          emailNewMessage: true,
          emailDailyReport: false,
          pushNewMessage: true,
          pushMentions: true,
          soundEnabled: true,
          desktopNotifications: true,
        },
      });
    }

    return NextResponse.json({
      preferences: {
        emailNewMessage: profile.emailNewMessage,
        emailDailyReport: profile.emailDailyReport,
        pushNewMessage: profile.pushNewMessage,
        pushMentions: profile.pushMentions,
        soundEnabled: profile.soundEnabled,
        desktopNotifications: profile.desktopNotifications,
      },
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Error al obtener preferencias' },
      { status: 500 }
    );
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      emailNewMessage,
      emailDailyReport,
      pushNewMessage,
      pushMentions,
      soundEnabled,
      desktopNotifications,
    } = body;

    // Get or create profile
    let profile = await prisma.adminProfile.findFirst();

    if (!profile) {
      profile = await prisma.adminProfile.create({
        data: {
          username: 'admin',
          password: 'pithy2024',
        },
      });
    }

    // Update preferences
    const updatedProfile = await prisma.adminProfile.update({
      where: { id: profile.id },
      data: {
        ...(emailNewMessage !== undefined && { emailNewMessage }),
        ...(emailDailyReport !== undefined && { emailDailyReport }),
        ...(pushNewMessage !== undefined && { pushNewMessage }),
        ...(pushMentions !== undefined && { pushMentions }),
        ...(soundEnabled !== undefined && { soundEnabled }),
        ...(desktopNotifications !== undefined && { desktopNotifications }),
      },
    });

    console.log('Notification preferences updated for user:', session.user?.name);

    return NextResponse.json({
      success: true,
      preferences: {
        emailNewMessage: updatedProfile.emailNewMessage,
        emailDailyReport: updatedProfile.emailDailyReport,
        pushNewMessage: updatedProfile.pushNewMessage,
        pushMentions: updatedProfile.pushMentions,
        soundEnabled: updatedProfile.soundEnabled,
        desktopNotifications: updatedProfile.desktopNotifications,
      },
      message: 'Preferencias de notificaciones actualizadas',
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Error al actualizar preferencias' },
      { status: 500 }
    );
  }
}
