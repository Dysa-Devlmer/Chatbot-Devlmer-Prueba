import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';

// PUT /api/admin/tenants/[id]/status - Activa o suspende el servicio de una empresa arrendada
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isSuperAdmin = (session.user as any)?.role === 'superadmin' || 
                         session.user?.email === 'admin@zgamersa.com' || 
                         (session.user as any)?.name === 'Admin Devlmer';
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Acceso denegado: solo el Administrador Maestro (Superadmin) puede suspender o activar empresas.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser active o suspended.' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Empresa no encontrada.' },
        { status: 404 }
      );
    }

    // Actualizar estado en la base de datos principal
    const updated = await prisma.tenant.update({
      where: { id },
      data: { status },
    });

    // Controlar el proceso en PM2 si estamos en el servidor
    if (process.env.NODE_ENV === 'production' && tenant.slug !== 'churus') {
      const pm2Name = `tenant-${tenant.slug}`;
      const pm2Action = status === 'active' ? 'restart' : 'stop';
      exec(`pm2 ${pm2Action} ${pm2Name}`, (err, stdout, stderr) => {
        if (err) console.warn(`PM2 ${pm2Action} error para ${pm2Name}:`, stderr);
        else console.log(`PM2 ${pm2Action} exitoso para ${pm2Name}`);
      });
    }

    return NextResponse.json({
      success: true,
      tenant: updated,
      message: `La empresa ${tenant.name} ha sido marcada como ${status === 'active' ? 'ACTIVA 🟢' : 'SUSPENDIDA 🔴'}.`,
    });
  } catch (error: any) {
    console.error('Error updating tenant status:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al cambiar estado de la empresa' },
      { status: 500 }
    );
  }
}
