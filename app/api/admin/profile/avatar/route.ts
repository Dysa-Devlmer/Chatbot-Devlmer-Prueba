import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/security';
import { authLogger, logError } from '@/lib/logger';

// Maximum allowed base64 length (approx 5MB to comfortably allow direct or resized uploads)
const MAX_BASE64_LENGTH = 7000000;

// POST - Upload avatar (base64)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { avatar } = body;

    if (!avatar || typeof avatar !== 'string') {
      return NextResponse.json(
        { error: 'No se proporcionó una imagen válida.' },
        { status: 400 }
      );
    }

    // Validate allowed image types (strict whitelist against XSS/SVG injection)
    const isAllowedType = /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(avatar);
    if (!isAllowedType) {
      return NextResponse.json(
        { error: 'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.' },
        { status: 400 }
      );
    }

    // Check size limit
    if (avatar.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: 'La imagen excede el tamaño máximo permitido. Por favor elige una imagen más ligera.' },
        { status: 400 }
      );
    }

    // Get or create profile
    let profile = await prisma.adminProfile.findFirst();

    if (!profile) {
      const defaultHashedPassword = await hashPassword('pithy2024');
      profile = await prisma.adminProfile.create({
        data: {
          username: 'admin',
          password: defaultHashedPassword,
          name: 'Admin Devlmer',
          email: 'admin@zgamersa.com',
          avatar,
        },
      });
    } else {
      profile = await prisma.adminProfile.update({
        where: { id: profile.id },
        data: { avatar },
      });
    }

    authLogger.info('Avatar actualizado correctamente en base de datos', { user: session.user?.name });

    return NextResponse.json({
      success: true,
      avatar: profile.avatar,
      message: 'Foto de perfil actualizada correctamente',
    });
  } catch (error: any) {
    logError(authLogger, error, { action: 'upload-avatar' });
    return NextResponse.json(
      { error: error?.message || 'Error interno al guardar la foto de perfil en el servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const profile = await prisma.adminProfile.findFirst();

    if (profile) {
      await prisma.adminProfile.update({
        where: { id: profile.id },
        data: { avatar: null },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Foto de perfil eliminada correctamente',
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el avatar' },
      { status: 500 }
    );
  }
}
