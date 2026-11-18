import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';

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

  // Validar token antes de usar
  if (!token) {
    throw new Error('WHATSAPP_TOKEN no configurada en variables de entorno');
  }

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

  // Validar variables de entorno
  if (!token) {
    throw new Error('WHATSAPP_TOKEN no configurada en variables de entorno');
  }
  if (!phoneNumberId) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID no configurada en variables de entorno');
  }

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

  // Validar variables de entorno
  if (!token) {
    return {
      success: false,
      error: 'WHATSAPP_TOKEN no configurada en variables de entorno',
    };
  }
  if (!phoneNumberId) {
    return {
      success: false,
      error: 'WHATSAPP_PHONE_NUMBER_ID no configurada en variables de entorno',
    };
  }

  let convertedFilePath: string | null = null;

  try {
    console.log(`🔊 Enviando audio a WhatsApp: ${audioFilePath}`);

    // Paso 0: Convertir MP3 a OGG/OPUS para notas de voz
    const oggFilePath = await convertToOggOpus(audioFilePath);
    convertedFilePath = oggFilePath;

    console.log(`🔄 Audio convertido a OGG/OPUS: ${oggFilePath}`);

    // Paso 1: Subir el archivo de audio a WhatsApp
    const uploadUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/media`;

    // Leer el archivo OGG
    const audioBuffer = fs.readFileSync(oggFilePath);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg; codecs=opus' });

    // Crear FormData para subir
    const formData = new FormData();
    formData.append('file', audioBlob, path.basename(oggFilePath));
    formData.append('type', 'audio/ogg; codecs=opus');
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
  } finally {
    // Limpiar archivo temporal convertido
    if (convertedFilePath && fs.existsSync(convertedFilePath)) {
      try {
        fs.unlinkSync(convertedFilePath);
        console.log(`🗑️ Archivo OGG temporal eliminado: ${convertedFilePath}`);
      } catch (e) {
        console.error('Error eliminando archivo OGG temporal:', e);
      }
    }
  }
}

/**
 * Convierte un archivo de audio MP3 a OGG/OPUS para notas de voz de WhatsApp
 * @param inputPath - Ruta al archivo de audio original (MP3)
 * @returns Ruta al archivo OGG/OPUS convertido
 */
function convertToOggOpus(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `voice_note_${Date.now()}.ogg`);

    // Comando ffmpeg para convertir a OGG/OPUS optimizado para voz
    // - codec:a libopus: Usa el codec Opus
    // - b:a 24k: Bitrate bajo optimizado para voz (WhatsApp usa ~16-24kbps)
    // - vbr on: Variable bitrate para mejor calidad
    // - compression_level 10: Máxima compresión
    // - frame_duration 60: Frames de 60ms (mejor para voz)
    // - application voip: Optimizado para voz
    const command = `ffmpeg -i "${inputPath}" -c:a libopus -b:a 24k -vbr on -compression_level 10 -frame_duration 60 -application voip -y "${outputPath}"`;

    console.log(`🔄 Convirtiendo a OGG/OPUS para nota de voz...`);

    exec(command, { timeout: 30000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Error convirtiendo audio: ${error.message}`));
        return;
      }

      if (!fs.existsSync(outputPath)) {
        reject(new Error('ffmpeg no generó el archivo OGG'));
        return;
      }

      const fileSize = fs.statSync(outputPath).size;
      console.log(`✅ Audio convertido a OGG/OPUS (${fileSize} bytes)`);

      resolve(outputPath);
    });
  });
}

/**
 * Interfaz para filas de lista interactiva
 */
export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

/**
 * Interfaz para secciones de lista interactiva
 */
export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

/**
 * Envía un mensaje interactivo de tipo Lista (menú desplegable estilo Movistar)
 */
export async function sendWhatsAppList(
  phoneNumber: string,
  bodyText: string,
  buttonText: string,
  sections: WhatsAppListSection[],
  title?: string,
  footerText?: string
) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Variables de entorno de WhatsApp no configuradas');
  }

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
      type: 'interactive',
      interactive: {
        type: 'list',
        header: title ? { type: 'text', text: title } : undefined,
        body: { text: bodyText },
        footer: footerText ? { text: footerText } : undefined,
        action: {
          button: buttonText.slice(0, 20), // Máximo 20 caracteres exigido por Meta
          sections: sections.map(s => ({
            title: s.title.slice(0, 24),
            rows: s.rows.slice(0, 10).map(r => ({
              id: r.id.slice(0, 200),
              title: r.title.slice(0, 24),
              description: r.description ? r.description.slice(0, 72) : undefined
            }))
          }))
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error enviando lista interactiva:', errorText);
    throw new Error(`WhatsApp API error: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Envía un mensaje con botones de respuesta rápida (hasta 3 botones)
 */
export async function sendWhatsAppButtons(
  phoneNumber: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  footerText?: string
) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Variables de entorno de WhatsApp no configuradas');
  }

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
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        footer: footerText ? { text: footerText } : undefined,
        action: {
          buttons: buttons.slice(0, 3).map(b => ({
            type: 'reply',
            reply: {
              id: b.id.slice(0, 256),
              title: b.title.slice(0, 20)
            }
          }))
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error enviando botones interactivos:', errorText);
    throw new Error(`WhatsApp API error: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Envía una imagen con texto/pie opcional a WhatsApp
 */
export async function sendWhatsAppImage(
  phoneNumber: string,
  imageUrl: string,
  caption?: string
) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Variables de entorno de WhatsApp no configuradas');
  }

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
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error enviando imagen de WhatsApp:', errorText);
    throw new Error(`WhatsApp API error: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}
