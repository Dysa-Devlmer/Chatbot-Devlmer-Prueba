import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    if (!avatar) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }

    // Validate base64 image
    if (!avatar.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Formato de imagen no válido' },
        { status: 400 }
      );
    }

    // Check size (max 2MB in base64 is roughly 2.7MB)
    if (avatar.length > 2700000) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande. Máximo 2MB.' },
        { status: 400 }
      );
    }

    // Get or create profile
    let profile = await prisma.adminProfile.findFirst();

    if (!profile) {
      profile = await prisma.adminProfile.create({
        data: {
          username: 'admin',
          password: 'pithy2024',
          avatar,
        },
      });
    } else {
      profile = await prisma.adminProfile.update({
        where: { id: profile.id },
        data: { avatar },
      });
    }

    return NextResponse.json({
      success: true,
      avatar: profile.avatar,
      message: 'Avatar actualizado correctamente',
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
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
