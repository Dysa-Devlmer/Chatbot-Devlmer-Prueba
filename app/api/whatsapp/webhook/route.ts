import { sendWhatsAppMessage, downloadWhatsAppMedia, sendWhatsAppAudio } from '@/lib/whatsapp';
import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/conversation';
import { AIService } from '@/lib/ai';
import { HorariosService } from '@/lib/horarios';

// Verificación del webhook (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
    return new NextResponse(challenge);
  }

  return new NextResponse('Token invalido', { status: 403 });
}

// Procesamiento de mensajes entrantes (POST)
export async function POST(request: NextRequest) {
  let webhookLogId: string | undefined;

  try {
    const body = await request.json();

    // Registrar evento de webhook
    const webhookLog = await ConversationService.logWebhookEvent(
      'message_received',
      body,
      'pending'
    );
    webhookLogId = webhookLog.id;

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry?.[0]?.changes?.[0]?.value;
      const message = entries?.messages?.[0];

      if (message) {
        const phoneNumber = message.from;
        const messageType = message.type;
        const whatsappId = message.id;

        // Obtener o crear usuario
        const user = await ConversationService.getOrCreateUser(
          phoneNumber,
          entries?.contacts?.[0]?.profile?.name
        );

        // Obtener o crear conversación
        const conversation = await ConversationService.getOrCreateConversation(user.id);

        // Extraer contenido del mensaje según el tipo
        let messageContent = '';
        let mediaUrl: string | undefined;
        let mediaMimeType: string | undefined;
        let caption: string | undefined;

        switch (messageType) {
          case 'text':
            messageContent = message.text.body;
            break;
          case 'image':
            mediaUrl = message.image.id; // ID del medio en WhatsApp
            caption = message.image.caption;
            messageContent = caption || '[Imagen]';
            mediaMimeType = message.image.mime_type;
            break;
          case 'audio':
            mediaUrl = message.audio.id;
            messageContent = '[Audio]';
            mediaMimeType = message.audio.mime_type;
            break;
          case 'document':
            mediaUrl = message.document.id;
            caption = message.document.caption;
            messageContent = message.document.filename || '[Documento]';
            mediaMimeType = message.document.mime_type;
            break;
          case 'video':
            mediaUrl = message.video.id;
            caption = message.video.caption;
            messageContent = caption || '[Video]';
            mediaMimeType = message.video.mime_type;
            break;
          case 'location':
            messageContent = `[Ubicación: ${message.location.latitude}, ${message.location.longitude}]`;
            break;
          default:
            messageContent = `[Tipo no soportado: ${messageType}]`;
        }

        console.log(`📩 Mensaje recibido de ${phoneNumber} (${user.name || 'Sin nombre'}): ${messageContent}`);

        // Guardar mensaje entrante
        const savedMessage = await ConversationService.saveMessage({
          conversationId: conversation.id,
          userId: user.id,
          type: messageType,
          content: messageContent,
          direction: 'inbound',
          sentBy: 'user',
          whatsappId,
          caption,
          mediaUrl,
          mediaMimeType,
        });

        // Si el mensaje ya existía (webhook duplicado), detener el procesamiento
        if (!savedMessage) {
          console.log(`⚠️ Webhook duplicado ignorado - mensaje ya procesado: ${whatsappId}`);

          if (webhookLogId) {
            await ConversationService.updateWebhookLog(webhookLogId, 'processed', 'Webhook duplicado - mensaje ya existe');
          }

          return NextResponse.json({ success: true, type: 'duplicate_webhook_ignored' });
        }

        // Marcar conversación como no leída para el panel admin
        await ConversationService.updateConversation(conversation.id, {
          isUnread: true,
        });

        // VERIFICAR HORARIOS DE ATENCIÓN
        const estadoHorario = HorariosService.estaAbierto();
        if (!estadoHorario.abierto && estadoHorario.mensaje) {
          // Verificar si ya enviamos el mensaje de fuera de horario recientemente
          const lastOutbound = await ConversationService.getLastOutboundMessage(conversation.id);

          // Solo enviar si:
          // 1. No hay mensaje previo, O
          // 2. El último mensaje NO es de "fuera de horario", O
          // 3. Han pasado más de 4 horas desde el último mensaje
          const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
          const isOutOfHoursMessage = lastOutbound?.content?.includes('Estamos cerrados');
          const isRecent = lastOutbound?.timestamp && new Date(lastOutbound.timestamp) > fourHoursAgo;

          if (!lastOutbound || !isOutOfHoursMessage || !isRecent) {
            console.log('⏰ Fuera de horario - Enviando mensaje automático');

            // Enviar mensaje de fuera de horario
            await sendWhatsAppMessage(phoneNumber, estadoHorario.mensaje);

            // Guardar respuesta automática
            await ConversationService.saveMessage({
              conversationId: conversation.id,
              userId: user.id,
              type: 'text',
              content: estadoHorario.mensaje,
              direction: 'outbound',
              sentBy: 'bot',
            });
          } else {
            console.log('⏰ Fuera de horario - Mensaje ya enviado, no se repite');
          }

          // Actualizar webhook log como procesado
          if (webhookLogId) {
            await ConversationService.updateWebhookLog(webhookLogId, 'processed');
          }

          return NextResponse.json({ success: true, type: 'out_of_hours' });
        }

        // Si está próximo a cerrar, enviar aviso junto con la respuesta
        if (estadoHorario.abierto && estadoHorario.mensaje) {
          console.log('⚠️ Próximo a cerrar - Se enviará aviso con la respuesta');
        }

        // VERIFICAR MODO DE CONVERSACIÓN
        if (conversation.botMode === 'manual') {
          console.log('👤 Modo manual activado - Esperando respuesta humana');

          // NO enviar respuesta automática, solo notificar al panel admin
          // (el panel ya fue notificado con isUnread: true)

          // Actualizar webhook log como procesado
          if (webhookLogId) {
            await ConversationService.updateWebhookLog(webhookLogId, 'processed');
          }

          return NextResponse.json({ success: true, type: 'manual_mode' });
        }

        // Verificar si es un comando
        if (messageContent.startsWith('/')) {
          const commandResponse = await AIService.handleCommand(messageContent, user.id);
          if (commandResponse) {
            // Enviar respuesta del comando
            await sendWhatsAppMessage(phoneNumber, commandResponse);

            // Guardar respuesta
            await ConversationService.saveMessage({
              conversationId: conversation.id,
              userId: user.id,
              type: 'text',
              content: commandResponse,
              direction: 'outbound',
              sentBy: 'bot',
            });

            // Actualizar webhook log como procesado
            if (webhookLogId) {
              await ConversationService.updateWebhookLog(webhookLogId, 'processed');
            }

            return NextResponse.json({ success: true, type: 'command' });
          }
        }

        // Procesar mensajes de texto o audio con IA
        if (messageType === 'text' || messageType === 'audio') {
          let textToProcess = messageContent;

          // Si es audio, transcribir primero con Whisper
          if (messageType === 'audio' && mediaUrl) {
            console.log(`🎤 Procesando mensaje de audio...`);

            try {
              // Descargar el audio de WhatsApp
              const audioData = await downloadWhatsAppMedia(mediaUrl);

              try {
                // Transcribir con Whisper
                const transcription = await AIService.transcribeAudio(audioData.filePath);

                if (transcription.success && transcription.text) {
                  textToProcess = transcription.text;
                  console.log(`✅ Audio transcrito: "${textToProcess.substring(0, 100)}..."`);

                  // Actualizar el mensaje guardado con la transcripción
                  await ConversationService.updateMessageContent(
                    conversation.id,
                    whatsappId,
                    `🎤 [Audio transcrito]: ${textToProcess}`
                  );
                } else {
                  console.log(`⚠️ No se pudo transcribir el audio: ${transcription.error}`);

                  // Enviar mensaje de error amigable
                  const errorMessage = `He recibido tu mensaje de voz, pero no pude transcribirlo correctamente. ¿Podrías escribirme tu consulta por texto?

🤖 Asistente automático PITHY`;

                  await sendWhatsAppMessage(phoneNumber, errorMessage);

                  await ConversationService.saveMessage({
                    conversationId: conversation.id,
                    userId: user.id,
                    type: 'text',
                    content: errorMessage,
                    direction: 'outbound',
                    sentBy: 'bot',
                  });

                  if (webhookLogId) {
                    await ConversationService.updateWebhookLog(webhookLogId, 'processed');
                  }

                  return NextResponse.json({ success: true, type: 'audio_transcription_failed' });
                }
              } finally {
                // Limpiar archivo temporal
                audioData.cleanup();
              }
            } catch (downloadError) {
              console.error('❌ Error descargando audio:', downloadError);

              const errorMessage = `He recibido tu mensaje de voz, pero tuve un problema al procesarlo. ¿Podrías intentar de nuevo o escribirme tu consulta?

🤖 Asistente automático PITHY`;

              await sendWhatsAppMessage(phoneNumber, errorMessage);

              await ConversationService.saveMessage({
                conversationId: conversation.id,
                userId: user.id,
                type: 'text',
                content: errorMessage,
                direction: 'outbound',
                sentBy: 'bot',
              });

              if (webhookLogId) {
                await ConversationService.updateWebhookLog(webhookLogId, 'processed');
              }

              return NextResponse.json({ success: true, type: 'audio_download_failed' });
            }
          }

          // Obtener contexto de conversación
          const context = await AIService.getConversationContext(
            user.id,
            conversation.id,
            10
          );

          // Procesar con IA
          const aiResult = await AIService.processMessage(textToProcess, context);

          console.log(`🤖 IA procesó mensaje - Intent: ${aiResult.intent}, Sentiment: ${aiResult.sentiment}`);
          console.log(`💬 Respuesta IA: ${aiResult.response}`);

          // Determinar cómo responder según el tipo de mensaje recibido
          let audioSent = false;

          if (messageType === 'audio') {
            // Si el usuario envió audio, responder SOLO con audio (sin texto para evitar spam)
            console.log(`🔊 Generando respuesta de audio...`);

            // Limpiar el texto para TTS (quitar emojis y firma del bot)
            const textForTTS = aiResult.response
              .replace(/🤖 Asistente automático PITHY/g, '')
              .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Quitar emojis
              .trim();

            const ttsResult = await AIService.textToSpeech(textForTTS);

            if (ttsResult.success) {
              try {
                const audioResult = await sendWhatsAppAudio(phoneNumber, ttsResult.audioPath);
                audioSent = audioResult.success;

                if (audioSent) {
                  console.log(`✅ Respuesta de audio enviada exitosamente`);
                } else {
                  console.log(`⚠️ No se pudo enviar audio, enviando texto como fallback: ${audioResult.error}`);
                  // Fallback: si falla el audio, enviar texto
                  await sendWhatsAppMessage(phoneNumber, aiResult.response);
                }
              } finally {
                // Limpiar archivo de audio temporal
                ttsResult.cleanup();
              }
            } else {
              console.log(`⚠️ No se pudo generar audio TTS, enviando texto como fallback: ${ttsResult.error}`);
              // Fallback: si falla TTS, enviar texto
              await sendWhatsAppMessage(phoneNumber, aiResult.response);
            }
          } else {
            // Si el usuario envió texto, responder con texto
            await sendWhatsAppMessage(phoneNumber, aiResult.response);
          }

          // Guardar mensaje saliente con análisis de IA
          await ConversationService.saveMessage({
            conversationId: conversation.id,
            userId: user.id,
            type: audioSent ? 'audio' : 'text',
            content: aiResult.response,
            direction: 'outbound',
            sentBy: 'bot',
            aiProcessed: true,
            aiResponse: aiResult.response,
            intent: aiResult.intent,
            entities: aiResult.entities,
          });

          // Actualizar sentiment de la conversación (sin cerrarla)
          if (aiResult.sentiment) {
            await ConversationService.updateConversation(conversation.id, {
              sentiment: aiResult.sentiment,
            });
          }

          // Actualizar webhook log como procesado
          if (webhookLogId) {
            await ConversationService.updateWebhookLog(webhookLogId, 'processed');
          }

          return NextResponse.json({
            success: true,
            type: messageType === 'audio' ? 'audio_ai_response' : 'ai_response',
            audioSent,
          });
        } else {
          // Para otros tipos de mensaje (imagen, video, documento), enviar confirmación
          const confirmationMessage = await AIService.getTemplate('media_received', user.language) ||
            `He recibido tu ${messageType}. ${caption ? `Mensaje: "${caption}"` : '¿En qué puedo ayudarte?'}`;

          await sendWhatsAppMessage(phoneNumber, confirmationMessage);

          // Guardar respuesta
          await ConversationService.saveMessage({
            conversationId: conversation.id,
            userId: user.id,
            type: 'text',
            content: confirmationMessage,
            direction: 'outbound',
            sentBy: 'bot',
          });

          // Actualizar webhook log como procesado
          if (webhookLogId) {
            await ConversationService.updateWebhookLog(webhookLogId, 'processed');
          }

          return NextResponse.json({ success: true, type: 'media_confirmation' });
        }
      }

      // Manejar actualizaciones de estado de mensajes
      const statuses = entries?.statuses;
      if (statuses && statuses.length > 0) {
        const status = statuses[0];
        console.log(`📊 Estado de mensaje actualizado: ${status.status} - ID: ${status.id}`);

        // Actualizar estado del mensaje en la base de datos
        try {
          await ConversationService.saveMessage({
            conversationId: '', // No necesitamos esto para actualización de estado
            userId: '',
            type: 'status_update',
            content: `Estado: ${status.status}`,
            direction: 'outbound',
            whatsappId: status.id,
          });
        } catch (error) {
          console.error('Error actualizando estado de mensaje:', error);
        }

        return NextResponse.json({ success: true, type: 'status_update' });
      }
    }

    // Actualizar webhook log como procesado
    if (webhookLogId) {
      await ConversationService.updateWebhookLog(webhookLogId, 'processed');
    }

    return NextResponse.json({ success: true, type: 'unknown' });
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);

    // Actualizar webhook log como fallido
    if (webhookLogId) {
      await ConversationService.updateWebhookLog(
        webhookLogId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Retornar 200 para que WhatsApp no reintente constantemente
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}
