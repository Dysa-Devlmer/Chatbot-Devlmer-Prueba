import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/tenants/[id]/plan - Actualiza el plan de servicio (Básico <-> Pro) de una empresa
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
                         (session.user as any)?.role === 'Administrador' ||
                         session.user?.email === 'admin@zgamersa.com' || 
                         (session.user as any)?.name === 'Admin Devlmer';
    if (!isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Acceso denegado: solo el Administrador Maestro (Superadmin) puede modificar el plan de las empresas.' 
      }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { plan } = body;

    // Validación estricta de planes permitidos (Whitelisting de seguridad)
    const validPlans = ['basic', 'pro'];
    if (!plan || !validPlans.includes(plan.toLowerCase())) {
      return NextResponse.json(
        { error: 'Plan inválido. Los planes autorizados son "basic" (Básico) o "pro" (Pro con Voz IA).' },
        { status: 400 }
      );
    }

    const normalizedPlan = plan.toLowerCase();

    // Verificar existencia de la empresa
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Empresa arrendataria no encontrada.' },
        { status: 404 }
      );
    }

    // Precios oficiales del modelo SaaS
    const monthlyPrice = normalizedPlan === 'pro' ? 99.0 : 49.0;

    // Actualizar registro en la base de datos central
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        plan: normalizedPlan,
        monthlyPrice,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: updated,
      message: `El plan de "${tenant.name}" fue actualizado a ${normalizedPlan.toUpperCase()} ($${monthlyPrice} USD/mes) exitosamente.`,
    });
  } catch (error: any) {
    console.error('Error updating tenant plan:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al cambiar el plan de la empresa' },
      { status: 500 }
    );
  }
}
