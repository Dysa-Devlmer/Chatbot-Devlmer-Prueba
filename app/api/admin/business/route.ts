import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiLogger, logError } from '@/lib/logger'
import { syncCatalogPricesToCurrency } from '@/lib/currencyCatalog'

/**
 * Sincroniza los datos del negocio con el perfil oficial de WhatsApp Business (Meta Graph API)
 */
async function syncToMetaWhatsAppProfile(profileData: {
  description?: string | null;
  address?: string | null;
  email?: string | null;
  industry?: string | null;
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { synced: false, reason: 'Credentials missing' };

  try {
    const verticalMap: Record<string, string> = {
      restaurant: 'RESTAURANT',
      fast_food: 'RESTAURANT',
      food_and_beverage: 'RESTAURANT',
      technology: 'ENTERTAINMENT',
      retail: 'RETAIL',
      services: 'PROF_SERVICES',
    };

    const payload: Record<string, any> = {
      messaging_product: 'whatsapp',
      websites: ['https://chatbot.zgamersa.com/menu'],
    };

    if (profileData.description) payload.description = profileData.description.slice(0, 512);
    if (profileData.address) payload.address = profileData.address.slice(0, 256);
    if (profileData.email) payload.email = profileData.email.slice(0, 128);
    if (profileData.industry && verticalMap[profileData.industry.toLowerCase()]) {
      payload.vertical = verticalMap[profileData.industry.toLowerCase()];
    }

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/whatsapp_business_profile`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return { synced: res.ok, data };
  } catch (e) {
    return { synced: false, error: String(e) };
  }
}

/**
 * Consulta el perfil actual en vivo desde Meta WhatsApp Cloud API
 */
async function getMetaWhatsAppProfile() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return null;

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data?.[0] || null;
    }
  } catch (e) {
    // Silencioso para no romper GET
  }
  return null;
}

// GET /api/admin/business - Obtener perfil del negocio
export async function GET() {
  try {
    let [profile, metaProfile] = await Promise.all([
      prisma.businessProfile.findFirst(),
      getMetaWhatsAppProfile(),
    ])

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

    return NextResponse.json({ success: true, profile, metaProfile })
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

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
      bankDetails,
    } = body

    let finalCurrency = currency ? currency.trim().toUpperCase() : undefined;
    let finalSymbol = currencySymbol ? currencySymbol.trim() : undefined;
    if (finalCurrency) {
      if (finalCurrency === 'PEN' && (!finalSymbol || finalSymbol === '$')) finalSymbol = 'S/.';
      if ((finalCurrency === 'CLP' || finalCurrency === 'ARS' || finalCurrency === 'COP') && (!finalSymbol || finalSymbol === 'S/.')) finalSymbol = '$';
    }

    let profile = await prisma.businessProfile.findFirst()

    if (profile) {
      profile = await prisma.businessProfile.update({
        where: { id: profile.id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(industry !== undefined && { industry: industry.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(finalCurrency !== undefined && { currency: finalCurrency }),
          ...(finalSymbol !== undefined && { currencySymbol: finalSymbol }),
          ...(address !== undefined && { address: address?.trim() || null }),
          ...(phone !== undefined && { phone: phone?.trim() || null }),
          ...(email !== undefined && { email: email?.trim() || null }),
          ...(allowReservations !== undefined && { allowReservations: Boolean(allowReservations) }),
          ...(policies !== undefined && { policies: policies?.trim() || null }),
          ...(customPrompt !== undefined && { customPrompt: customPrompt?.trim() || null }),
          ...(bankDetails !== undefined && { bankDetails: typeof bankDetails === 'string' ? bankDetails : JSON.stringify(bankDetails) }),
        },
      })
    } else {
      profile = await prisma.businessProfile.create({
        data: {
          name: name || 'Mi Negocio',
          industry: industry || 'technology',
          description,
          currency: finalCurrency || 'CLP',
          currencySymbol: finalSymbol || '$',
          address,
          phone,
          email,
          allowReservations: allowReservations ?? true,
          policies,
          customPrompt,
          bankDetails: typeof bankDetails === 'string' ? bankDetails : (bankDetails ? JSON.stringify(bankDetails) : null),
        },
      })
    }

    if (currency) {
      await syncCatalogPricesToCurrency(currency)
    }

    // Sincronizar automáticamente hacia el perfil de WhatsApp Business en Meta
    const metaSync = await syncToMetaWhatsAppProfile({
      description: profile.description,
      address: profile.address,
      email: profile.email,
      industry: profile.industry,
    });

    return NextResponse.json({ success: true, profile, metaSync })
  } catch (error) {
    logError(apiLogger, error, { stage: 'update-business-profile' })
    return NextResponse.json(
      { success: false, error: 'Error al actualizar perfil del negocio' },
      { status: 500 }
    )
  }
}
