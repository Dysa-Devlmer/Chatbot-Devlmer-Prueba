import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'

// GET /api/admin/categories - Listar categorías
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    logError(apiLogger, error, { stage: 'get-categories' })
    return NextResponse.json(
      { success: false, error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Crear categoría
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json()
    const { name, description } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre de la categoría es obligatorio' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, category }, { status: 201 })
  } catch (error) {
    logError(apiLogger, error, { stage: 'create-category' })
    return NextResponse.json(
      { success: false, error: 'Error al crear la categoría (podría estar duplicada)' },
      { status: 500 }
    )
  }
}
