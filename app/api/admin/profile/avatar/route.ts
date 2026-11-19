import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/security';
import { authLogger, logError } from '@/lib/logger';

// Allowed MIME types for avatar uploads
const ALLOWED_MIME_TYPES = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'];
const MAX_BASE64_LENGTH = 2800000; // ~2MB raw image

// POST - Upload avatar (base64)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { avatar } = body;

    if (!avatar || typeof avatar !== 'string') {
      return NextResponse.json(
        { error: 'No se proporcionó imagen válida' },
        { status: 400 }
      );
    }

    // Validate allowed image types (strict whitelist against XSS/SVG injection)
    const isAllowedType = ALLOWED_MIME_TYPES.some(prefix => avatar.startsWith(prefix));
    if (!isAllowedType) {
      return NextResponse.json(
        { error: 'Formato de imagen no permitido. Solo se aceptan JPEG, PNG o WebP.' },
        { status: 400 }
      );
    }

    // Check size limit (max 2MB)
    if (avatar.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: 'La imagen excede el tamaño máximo permitido de 2MB.' },
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
          avatar,
        },
      });
    } else {
      profile = await prisma.adminProfile.update({
        where: { id: profile.id },
        data: { avatar },
      });
    }

    authLogger.info('Avatar actualizado correctamente', { user: session.user?.name });

    return NextResponse.json({
      success: true,
      avatar: profile.avatar,
      message: 'Avatar actualizado correctamente',
    });
  } catch (error) {
    logError(authLogger, error, { action: 'upload-avatar' });
    return NextResponse.json(
      { error: 'Error al subir el avatar' },
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
      message: 'Avatar eliminado correctamente',
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el avatar' },
      { status: 500 }
    );
  }
}
