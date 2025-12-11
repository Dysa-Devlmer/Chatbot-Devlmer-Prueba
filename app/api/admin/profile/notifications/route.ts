import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simulated notification preferences storage
let notificationPreferences = {
  emailNewMessage: true,
  emailDailyReport: false,
  pushNewMessage: true,
  pushMentions: true,
  soundEnabled: true,
  desktopNotifications: true,
};

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

    return NextResponse.json({
      preferences: notificationPreferences,
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

    // Update preferences
    notificationPreferences = {
      ...notificationPreferences,
      ...body,
    };

    console.log('Notification preferences updated for user:', session.user?.name);

    return NextResponse.json({
      success: true,
      preferences: notificationPreferences,
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
