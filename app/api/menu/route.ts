import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'
import { PRODUCT_PRICES } from '@/lib/currencyCatalog'
import { HorariosService } from '@/lib/horarios'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [business, categories, products] = await Promise.all([
      prisma.businessProfile.findFirst(),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { name: 'asc' },
      }),
    ])

    const activeCurrency = ((business?.currency || 'PEN').toUpperCase()) as 'PEN' | 'CLP' | 'ARS'
    const status = HorariosService.estaAbierto()

    return NextResponse.json({
      success: true,
      business: {
        name: business?.name || 'Mi Negocio',
        industry: business?.industry || 'fast_food',
        currency: business?.currency || 'PEN',
        currencySymbol: business?.currencySymbol || 'S/.',
        phone: business?.phone || '+51922931433',
        address: business?.address || 'Av. Los Próceres 458',
        description: business?.description || '',
        policies: business?.policies || '',
        isOpen: status.abierto,
        todayHours: status.horarioHoy,
        statusMode: status.modo,
        statusMessage: status.mensaje || null,
      },
      categories: categories.map(c => c.name),
      products: products.map(p => {
        const multi = PRODUCT_PRICES[p.name]
        const finalPrice = multi ? (multi[activeCurrency] ?? p.price) : p.price
        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: finalPrice,
          stock: p.stock,
          sku: p.sku || '',
          imageUrl: p.imageUrl || '',
          category: p.category?.name || 'Varios',
          allowBackorder: p.allowBackorder,
        }
      }),
    })
  } catch (error) {
    logError(apiLogger, error, { stage: 'public-menu-api' })
    return NextResponse.json(
      { success: false, error: 'Error al obtener la carta digital' },
      { status: 500 }
    )
  }
}
