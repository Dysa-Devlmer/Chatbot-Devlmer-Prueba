import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // SEGURIDAD: Solo administradores autenticados pueden enviar mensajes por esta ruta
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado para enviar mensajes WhatsApp' }, { status: 401 });
  }

  const { phoneNumber, message } = await request.json();

  if (!phoneNumber || !message) {
    return NextResponse.json({ error: 'Missing phoneNumber or message' }, { status: 400 });
  }

  try {
    const result = await sendWhatsAppMessage(phoneNumber, message);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
