import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'

// GET /api/admin/business - Obtener perfil del negocio
export async function GET() {
  try {
    let profile = await prisma.businessProfile.findFirst()

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: {
          name: 'Devlmer Tech Store',
          industry: 'technology',
          currency: 'CLP',
          currencySymbol: '$',
          description: 'Tienda de hardware, componentes gamer y tecnología',
          allowReservations: true,
          policies: 'Reservas válidas por 48 horas. Despacho a todo el país.',
        },
      })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    logError(apiLogger, error, { stage: 'get-business-profile' })
    return NextResponse.json(
      { success: false, error: 'Error al obtener perfil del negocio' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/business - Actualizar perfil del negocio (rubro, políticas, nombre)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      industry,
      description,
      currency,
      currencySymbol,
      address,
      phone,
      email,
      allowReservations,
      policies,
      customPrompt,
    } = body

    let profile = await prisma.businessProfile.findFirst()

    if (profile) {
      profile = await prisma.businessProfile.update({
        where: { id: profile.id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(industry !== undefined && { industry: industry.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(currency !== undefined && { currency: currency.trim() }),
          ...(currencySymbol !== undefined && { currencySymbol: currencySymbol.trim() }),
          ...(address !== undefined && { address: address?.trim() || null }),
          ...(phone !== undefined && { phone: phone?.trim() || null }),
          ...(email !== undefined && { email: email?.trim() || null }),
          ...(allowReservations !== undefined && { allowReservations: Boolean(allowReservations) }),
          ...(policies !== undefined && { policies: policies?.trim() || null }),
          ...(customPrompt !== undefined && { customPrompt: customPrompt?.trim() || null }),
        },
      })
    } else {
      profile = await prisma.businessProfile.create({
        data: {
          name: name || 'Mi Negocio',
          industry: industry || 'technology',
          description,
          currency: currency || 'CLP',
          currencySymbol: currencySymbol || '$',
          address,
          phone,
          email,
          allowReservations: allowReservations ?? true,
          policies,
          customPrompt,
        },
      })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    logError(apiLogger, error, { stage: 'update-business-profile' })
    return NextResponse.json(
      { success: false, error: 'Error al actualizar perfil del negocio' },
      { status: 500 }
    )
  }
}
