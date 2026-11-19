import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/utils/security';
import { authLogger, logError } from '@/lib/logger';

// PUT - Change password
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual y nueva contraseña requeridas' },
        { status: 400 }
      );
    }

    // Get admin profile
    const profile = await prisma.adminProfile.findFirst();

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    // Verify current password with bcrypt or legacy fallback
    let isMatch = false;
    if (profile.password.startsWith('$2')) {
      isMatch = await verifyPassword(currentPassword, profile.password);
    } else {
      isMatch = (currentPassword === profile.password);
    }

    if (!isMatch) {
      authLogger.warn('Intento fallido de cambio de contraseña: credencial actual errónea', {
        user: session.user?.name,
      });
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Securely hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in database
    await prisma.adminProfile.update({
      where: { id: profile.id },
      data: { password: hashedPassword },
    });

    authLogger.info('Contraseña de administrador actualizada con hash bcrypt seguro', {
      user: session.user?.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente y protegida con cifrado bcrypt',
    });
  } catch (error) {
    logError(authLogger, error, { action: 'change-password' });
    return NextResponse.json(
      { error: 'Error interno al actualizar la contraseña' },
      { status: 500 }
    );
  }
}
