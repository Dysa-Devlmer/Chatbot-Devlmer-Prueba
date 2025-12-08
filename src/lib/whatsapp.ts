import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Descarga un archivo multimedia de WhatsApp usando el media ID
 * @param mediaId - ID del medio proporcionado por WhatsApp
 * @returns Ruta al archivo temporal descargado
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<{
  filePath: string;
  mimeType: string;
  cleanup: () => void;
}> {
  const token = process.env.WHATSAPP_TOKEN;

  try {
    // Paso 1: Obtener la URL del medio
    const mediaInfoUrl = `https://graph.facebook.com/v18.0/${mediaId}`;
    const mediaInfoResponse = await fetch(mediaInfoUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!mediaInfoResponse.ok) {
      throw new Error(`Error obteniendo info del medio: ${mediaInfoResponse.statusText}`);
    }

    const mediaInfo = await mediaInfoResponse.json();
    const mediaUrl = mediaInfo.url;
    const mimeType = mediaInfo.mime_type || 'audio/ogg';

    console.log(`📥 Descargando medio: ${mediaId} (${mimeType})`);

    // Paso 2: Descargar el archivo
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!mediaResponse.ok) {
      throw new Error(`Error descargando medio: ${mediaResponse.statusText}`);
    }

    const arrayBuffer = await mediaResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Paso 3: Guardar en archivo temporal
    const extension = mimeType.includes('ogg') ? '.ogg' :
                      mimeType.includes('mp3') ? '.mp3' :
                      mimeType.includes('mp4') ? '.mp4' :
                      mimeType.includes('wav') ? '.wav' : '.audio';

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `whatsapp_audio_${mediaId}${extension}`);

    fs.writeFileSync(tempFilePath, buffer);

    console.log(`✅ Medio descargado: ${tempFilePath} (${buffer.length} bytes)`);

    return {
      filePath: tempFilePath,
      mimeType,
      cleanup: () => {
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`🗑️ Archivo temporal eliminado: ${tempFilePath}`);
          }
        } catch (e) {
          console.error('Error eliminando archivo temporal:', e);
        }
      },
    };
  } catch (error) {
    console.error('❌ Error descargando medio de WhatsApp:', error);
    throw error;
  }
}

export async function sendWhatsAppMessage(phoneNumber: string, messageText: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber.replace(/\D/g, ''),
        type: 'text',
        text: { body: messageText }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

/**
 * Sube un archivo de audio a WhatsApp y lo envía como mensaje de voz
 * @param phoneNumber - Número de teléfono del destinatario
 * @param audioFilePath - Ruta al archivo de audio local
 * @returns Respuesta de la API de WhatsApp
 */
export async function sendWhatsAppAudio(phoneNumber: string, audioFilePath: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  try {
    console.log(`🔊 Enviando audio a WhatsApp: ${audioFilePath}`);

    // Paso 1: Subir el archivo de audio a WhatsApp
    const uploadUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/media`;

    // Leer el archivo
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    // Crear FormData para subir
    const formData = new FormData();
    formData.append('file', audioBlob, path.basename(audioFilePath));
    formData.append('type', 'audio/mpeg');
    formData.append('messaging_product', 'whatsapp');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Error subiendo audio: ${uploadResponse.statusText} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const mediaId = uploadResult.id;

    console.log(`✅ Audio subido a WhatsApp, media_id: ${mediaId}`);

    // Paso 2: Enviar mensaje con el audio
    const messageUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const messageResponse = await fetch(messageUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber.replace(/\D/g, ''),
        type: 'audio',
        audio: {
          id: mediaId,
        },
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Error enviando audio: ${messageResponse.statusText} - ${errorText}`);
    }

    const messageResult = await messageResponse.json();

    console.log(`✅ Audio enviado exitosamente a ${phoneNumber}`);

    return {
      success: true,
      messageId: messageResult.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('❌ Error enviando audio por WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido enviando audio',
    };
  }
}
