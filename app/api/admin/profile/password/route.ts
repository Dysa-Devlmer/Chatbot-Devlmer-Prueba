import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, verifyAdminPassword, updateAdminPassword } from '@/lib/auth';

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

    // Verify current password
    if (!verifyAdminPassword(currentPassword)) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Update password
    updateAdminPassword(newPassword);

    // In production, you would:
    // 1. Hash the new password with bcrypt
    // 2. Update it in the database
    // 3. Invalidate other sessions if needed

    console.log('Password changed successfully for user:', session.user?.name);

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Error al cambiar la contraseña' },
      { status: 500 }
    );
  }
}
