import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'
import { PRODUCT_PRICES } from '@/lib/currencyCatalog'

// GET /api/admin/products - Listar productos (con filtro opcional por categoría o búsqueda)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (activeOnly) {
      where.isActive = true
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const business = await prisma.businessProfile.findFirst()
    const activeCurrency = ((business?.currency || 'PEN').toUpperCase()) as 'PEN' | 'CLP' | 'ARS'
    const currencySymbol = business?.currencySymbol || (activeCurrency === 'PEN' ? 'S/.' : '$')

    const adaptedProducts = products.map((p) => {
      const multiKey = Object.keys(PRODUCT_PRICES).find(k => k.toLowerCase() === p.name.toLowerCase().trim())
      const multi = multiKey ? PRODUCT_PRICES[multiKey] : null
      const finalPrice = multi ? (multi[activeCurrency] ?? p.price) : p.price
      return {
        ...p,
        price: finalPrice,
      }
    })

    return NextResponse.json({ 
      success: true, 
      products: adaptedProducts,
      currency: activeCurrency,
      currencySymbol
    })
  } catch (error) {
    logError(apiLogger, error, { stage: 'get-products' })
    return NextResponse.json(
      { success: false, error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, stock, sku, categoryId, allowBackorder, imageUrl } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'El nombre y el precio son obligatorios' },
        { status: 400 }
      )
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        sku: sku ? sku.trim() : null,
        categoryId: categoryId || null,
        allowBackorder: Boolean(allowBackorder),
        imageUrl: imageUrl ? imageUrl.trim() : null,
        isActive: true,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 })
  } catch (error) {
    logError(apiLogger, error, { stage: 'create-product' })
    return NextResponse.json(
      { success: false, error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
