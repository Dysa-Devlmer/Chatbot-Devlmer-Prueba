import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'

// PUT /api/admin/products/[id] - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, price, stock, sku, categoryId, isActive, allowBackorder, imageUrl } = body

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(price !== undefined && { price: parseFloat(price) || 0 }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) || 0 }),
        ...(sku !== undefined && { sku: sku?.trim() || null }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(allowBackorder !== undefined && { allowBackorder: Boolean(allowBackorder) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ success: true, product: updated })
  } catch (error) {
    logError(apiLogger, error, { stage: 'update-product' })
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el producto' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Producto eliminado' })
  } catch (error) {
    logError(apiLogger, error, { stage: 'delete-product' })
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el producto' },
      { status: 500 }
    )
  }
}
