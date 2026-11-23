import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiLogger, logError } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

/**
 * Consulta el perfil actual en vivo desde Meta WhatsApp Cloud API
 */
async function getMetaWhatsAppProfile(token: string, phoneId: string) {
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
    console.error('Error al obtener perfil actualizado:', e);
  }
  return null;
}

/**
 * POST /api/admin/business/profile-picture
 * Sube una nueva foto de perfil directamente a Meta WhatsApp Cloud API
 * y actualiza la imagen de la empresa.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const appId = process.env.WHATSAPP_APP_ID || '1135645411975012';

    if (!token || !phoneId) {
      return NextResponse.json(
        { success: false, error: 'Credenciales de WhatsApp Cloud API no configuradas en el servidor.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se envió ningún archivo de imagen.' },
        { status: 400 }
      );
    }

    // Validar tipo de imagen
    const mimeType = file.type;
    if (mimeType !== 'image/jpeg' && mimeType !== 'image/png' && mimeType !== 'image/jpg') {
      return NextResponse.json(
        { success: false, error: 'Formato no soportado. Debe ser imagen JPG o PNG.' },
        { status: 400 }
      );
    }

    // Validar tamaño máximo (5 MB)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo excede el tamaño máximo permitido de 5 MB.' },
        { status: 400 }
      );
    }

    // SEGURIDAD (ASVS): Validar magic bytes reales (firma de archivo) para prevenir spoofing de MIME
    const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    if (!isJpeg && !isPng) {
      return NextResponse.json(
        { success: false, error: 'Archivo rechazado. El contenido no coincide con una imagen legítima JPEG o PNG.' },
        { status: 400 }
      );
    }

    // 1. Guardar copia local en public/uploads/
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const extension = mimeType.includes('png') ? 'png' : 'jpg';
      const localFilePath = path.join(uploadsDir, `business-profile.${extension}`);
      fs.writeFileSync(localFilePath, buffer);
    } catch (saveErr) {
      console.warn('No se pudo guardar la copia local (opcional):', saveErr);
    }

    // 2. Paso 1 en Meta: Crear sesión de carga reanudable (Resumable Upload API)
    const uploadSessionUrl = `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${fileSize}&file_type=${encodeURIComponent(mimeType)}`;
    const sessionRes = await fetch(uploadSessionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData?.id) {
      console.error('Error creando sesión de upload en Meta:', sessionData);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al iniciar carga en Meta: ${sessionData?.error?.message || 'Sesión no creada'}` 
        },
        { status: 502 }
      );
    }

    const uploadSessionId = sessionData.id;

    // 3. Paso 2 en Meta: Subir el binario de la imagen
    const uploadBinaryUrl = `https://graph.facebook.com/v21.0/${uploadSessionId}`;
    const binaryRes = await fetch(uploadBinaryUrl, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${token}`,
        file_offset: '0',
        'Content-Type': mimeType,
      },
      body: buffer,
    });

    const binaryData = await binaryRes.json();
    if (!binaryRes.ok || !binaryData?.h) {
      console.error('Error subiendo binario a Meta:', binaryData);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al transferir imagen a Meta: ${binaryData?.error?.message || 'Handle no recibido'}` 
        },
        { status: 502 }
      );
    }

    const profilePictureHandle = binaryData.h;

    // 4. Paso 3 en Meta: Asignar la foto al perfil oficial de WhatsApp Business
    const updateProfileUrl = `https://graph.facebook.com/v21.0/${phoneId}/whatsapp_business_profile`;
    const updateRes = await fetch(updateProfileUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        profile_picture_handle: profilePictureHandle,
      }),
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok || !updateData?.success) {
      console.error('Error actualizando perfil en Meta:', updateData);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al vincular foto con WhatsApp Business: ${updateData?.error?.message || 'Error desconocido'}` 
        },
        { status: 502 }
      );
    }

    // 5. Consultar los datos actualizados de WhatsApp para devolver la nueva URL
    const freshProfile = await getMetaWhatsAppProfile(token, phoneId);

    return NextResponse.json({
      success: true,
      message: 'Foto de perfil de WhatsApp Business actualizada exitosamente.',
      profilePictureUrl: freshProfile?.profile_picture_url || null,
      metaProfile: freshProfile,
    });
  } catch (error) {
    logError(apiLogger, error, { stage: 'upload-business-profile-picture' });
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error inesperado al procesar la imagen.' },
      { status: 500 }
    );
  }
}
