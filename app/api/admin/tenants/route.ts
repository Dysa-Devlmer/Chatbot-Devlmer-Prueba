import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// GET /api/admin/tenants - Lista todas las empresas SaaS y métricas de negocio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isSuperAdmin = (session.user as any)?.role === 'superadmin' || 
                         (session.user as any)?.role === 'Administrador' ||
                         session.user?.email === 'admin@zgamersa.com' || 
                         (session.user as any)?.name === 'Admin Devlmer';
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Acceso denegado: solo el Administrador Maestro (Superadmin) puede ver las empresas.' }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const proTenants = tenants.filter(t => t.plan === 'pro' && t.status === 'active').length;
    const totalMRR = tenants
      .filter(t => t.status === 'active')
      .reduce((acc, t) => acc + (t.monthlyPrice || 0), 0);

    return NextResponse.json({
      success: true,
      tenants,
      stats: {
        totalTenants,
        activeTenants,
        proTenants,
        totalMRR,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al obtener lista de empresas' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tenants - Registra y aprovisiona una nueva empresa SaaS con sincronización en Meta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isSuperAdmin = (session.user as any)?.role === 'superadmin' || 
                         (session.user as any)?.role === 'Administrador' ||
                         session.user?.email === 'admin@zgamersa.com' || 
                         (session.user as any)?.name === 'Admin Devlmer';
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Acceso denegado: solo el Administrador Maestro (Superadmin) puede registrar nuevas empresas.' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      slug: rawSlug, 
      plan = 'basic', 
      currencySymbol = 'S/.', 
      currency = 'PEN', 
      whatsappNumber, 
      phoneNumberId, 
      template = 'fast_food' 
    } = body;

    if (!name || !rawSlug) {
      return NextResponse.json(
        { error: 'El nombre comercial y el subdominio son obligatorios.' },
        { status: 400 }
      );
    }

    // Normalizar slug (solo minúsculas y guiones)
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Verificar si ya existe el slug
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `El subdominio '${slug}' ya está en uso. Por favor elija otro.` },
        { status: 400 }
      );
    }

    // Calcular el siguiente puerto libre disponible (empezando en 7848)
    const allTenants = await prisma.tenant.findMany({ select: { port: true } });
    const usedPorts = allTenants.map(t => t.port);
    let nextPort = 7848;
    while (usedPorts.includes(nextPort)) {
      nextPort++;
    }

    const domain = `${slug}.zgamersa.com`;
    const monthlyPrice = plan === 'pro' ? 99.0 : 49.0;

    // Sincronización Automática con Meta Graph API (si se proporcionó Phone Number ID)
    let metaSynced = false;
    const metaToken = process.env.WHATSAPP_TOKEN;

    if (phoneNumberId && metaToken) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/whatsapp_business_profile`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            about: `${name} | Atención digital y delivery oficial.`,
            websites: [`https://${domain}/menu`],
            vertical: 'RESTAURANT',
          }),
        });

        if (metaRes.ok) {
          metaSynced = true;
          console.log(`✅ Perfil sincronizado automáticamente en Meta para ${name} (Phone ID: ${phoneNumberId})`);
        } else {
          const metaErr = await metaRes.json();
          console.warn('⚠️ Meta Profile Sync no completado:', metaErr);
        }
      } catch (mErr) {
        console.warn('⚠️ Error conectando con Meta Graph API:', mErr);
      }
    }

    // Crear registro maestro en la base de datos central
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name,
        plan,
        status: 'active',
        currencySymbol,
        currency,
        port: nextPort,
        domain,
        whatsappNumber: whatsappNumber || null,
        phoneNumberId: phoneNumberId || null,
        wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '779998311756531',
        metaSynced,
        monthlyPrice,
        adminInitialPassword: 'pithy2024',
        adminEmail: `admin@${domain}`,
      },
    });

    // Ejecutar script de aprovisionamiento en Linux VPS si estamos en producción
    if (process.env.NODE_ENV === 'production') {
      try {
        const scriptPath = path.join(process.cwd(), 'scripts', 'provision-new-tenant.sh');
        const cmd = `bash "${scriptPath}" "${slug}" "${nextPort}" "${name}" "${template}" "${currencySymbol}" > /tmp/provision_${slug}.log 2>&1 &`;
        exec(cmd);
        console.log(`🚀 Proceso de aprovisionamiento en background iniciado: ${cmd}`);
      } catch (execErr) {
        console.error('Error disparando script de aprovisionamiento:', execErr);
      }
    }

    return NextResponse.json({
      success: true,
      tenant,
      credentials: {
        loginUrl: `https://${domain}/admin`,
        menuUrl: `https://${domain}/menu`,
        username: 'admin',
        password: 'pithy2024',
      },
      message: `¡Empresa '${name}' creada exitosamente! Aprovisionada en https://${domain}`,
    });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al registrar la nueva empresa' },
      { status: 500 }
    );
  }
}
