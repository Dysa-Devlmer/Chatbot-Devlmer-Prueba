import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// DELETE /api/admin/tenants/[id] - Elimina y desaprovisiona limpiamente una empresa que ya no opera
export async function DELETE(
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
        error: 'Acceso denegado: solo el Administrador Maestro (Superadmin) puede dar de baja empresas.' 
      }, { status: 403 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Empresa no encontrada.' },
        { status: 404 }
      );
    }

    // Protección de seguridad: Nunca permitir borrar el tenant demo maestro 'churus'
    if (tenant.slug === 'churus') {
      return NextResponse.json(
        { error: 'Seguridad: No está permitido eliminar la empresa demo maestra del sistema.' },
        { status: 400 }
      );
    }

    // 1. Eliminar registro DNS en Cloudflare si existe token
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    if (cfZoneId && cfToken) {
      try {
        // Buscar el record ID del subdominio
        const searchRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records?name=${tenant.slug}.zgamersa.com`,
          {
            headers: {
              'Authorization': `Bearer ${cfToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const records = searchData.result || [];
          for (const rec of records) {
            await fetch(
              `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${rec.id}`,
              {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${cfToken}` },
              }
            );
            console.log(`🗑️ Registro DNS Cloudflare eliminado para ${tenant.slug}`);
          }
        }
      } catch (cfErr) {
        console.warn('⚠️ Error limpiando DNS Cloudflare:', cfErr);
      }
    }

    // 2. Detener proceso PM2 y limpiar Nginx en el VPS si estamos en producción
    if (process.env.NODE_ENV === 'production') {
      const pm2Name = `tenant-${tenant.slug}`;
      const nginxFile = `/etc/nginx/sites-available/${tenant.domain}`;
      const nginxEnabled = `/etc/nginx/sites-enabled/${tenant.domain}`;

      const cleanupCmd = `
        pm2 delete "${pm2Name}" 2>/dev/null || true
        pm2 save 2>/dev/null || true
        rm -f "${nginxEnabled}" "${nginxFile}"
        nginx -t && systemctl reload nginx 2>/dev/null || true
      `;

      exec(cleanupCmd, (err, stdout, stderr) => {
        if (err) console.warn(`Error en desaprovisionamiento de ${pm2Name}:`, stderr);
        else console.log(`✅ Desaprovisionamiento de servidor completado para ${pm2Name}`);
      });
    }

    // 3. Archivar o eliminar base de datos aislada
    try {
      const dbPath = path.join(process.cwd(), 'prisma', 'tenants', `${tenant.slug}.db`);
      if (fs.existsSync(dbPath)) {
        // Renombrar a .db.archived para respaldo de seguridad sin ocupar espacio activo
        const archivePath = path.join(process.cwd(), 'prisma', 'tenants', `${tenant.slug}.db.archived_${Date.now()}`);
        fs.renameSync(dbPath, archivePath);
      }
    } catch (fsErr) {
      console.warn('⚠️ No se pudo archivar el archivo .db:', fsErr);
    }

    // 4. Eliminar registro del tenant en la base de datos central
    await prisma.tenant.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `La empresa "${tenant.name}" (${tenant.domain}) fue dada de baja y desaprovisionada exitosamente.`,
    });
  } catch (error: any) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al eliminar la empresa' },
      { status: 500 }
    );
  }
}
