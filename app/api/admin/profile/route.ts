import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simulated user data storage (in production, this would be in database)
let userProfile = {
  name: 'Admin',
  email: 'admin@pithy.cl',
  phone: '',
  company: 'PITHY',
  role: 'Administrador',
  timezone: 'America/Santiago',
  language: 'es',
  avatar: null as string | null,
};

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

    return NextResponse.json({
      profile: {
        ...userProfile,
        name: session.user?.name || userProfile.name,
        email: session.user?.email || userProfile.email,
      },
    });
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
    const { name, email, phone, company, timezone, language } = body;

    // Update profile
    userProfile = {
      ...userProfile,
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(company && { company }),
      ...(timezone && { timezone }),
      ...(language && { language }),
    };

    return NextResponse.json({
      success: true,
      profile: userProfile,
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
