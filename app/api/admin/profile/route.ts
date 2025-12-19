import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get or create admin profile
async function getOrCreateAdminProfile() {
  let profile = await prisma.adminProfile.findFirst();

  if (!profile) {
    profile = await prisma.adminProfile.create({
      data: {
        username: 'admin',
        password: 'pithy2024',
        name: 'Pierre Benites (Devlmer)',
        email: 'bpier@zgamersa.com',
        company: 'zgamersa.com',
        role: 'CEO',
      },
    });
  }

  return profile;
}

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const profile = await getOrCreateAdminProfile();

    // Don't send password to client
    const { password, ...safeProfile } = profile;

    return NextResponse.json({ profile: safeProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
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
    const { name, email, phone, company, timezone, language, avatar, theme, accentColor } = body;

    // Get existing profile
    const existingProfile = await getOrCreateAdminProfile();

    // Update profile
    const profile = await prisma.adminProfile.update({
      where: { id: existingProfile.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(timezone !== undefined && { timezone }),
        ...(language !== undefined && { language }),
        ...(avatar !== undefined && { avatar }),
        ...(theme !== undefined && { theme }),
        ...(accentColor !== undefined && { accentColor }),
      },
    });

    // Don't send password to client
    const { password, ...safeProfile } = profile;

    return NextResponse.json({
      success: true,
      profile: safeProfile,
      message: 'Perfil actualizado correctamente',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
