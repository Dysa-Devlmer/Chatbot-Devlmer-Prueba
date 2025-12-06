import { sendWhatsAppMessage } from '@/lib/whatsapp';
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
      const metadata = entries?.metadata;

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
        await ConversationService.saveMessage({
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

        // Procesar solo mensajes de texto con IA
        if (messageType === 'text') {
          // Obtener contexto de conversación
          const context = await AIService.getConversationContext(
            user.id,
            conversation.id,
            10
          );

          // Procesar con IA
          const aiResult = await AIService.processMessage(messageContent, context);

          console.log(`🤖 IA procesó mensaje - Intent: ${aiResult.intent}, Sentiment: ${aiResult.sentiment}`);
          console.log(`💬 Respuesta IA: ${aiResult.response}`);

          // Enviar respuesta
          await sendWhatsAppMessage(phoneNumber, aiResult.response);

          // Guardar mensaje saliente con análisis de IA
          await ConversationService.saveMessage({
            conversationId: conversation.id,
            userId: user.id,
            type: 'text',
            content: aiResult.response,
            direction: 'outbound',
            sentBy: 'bot',
            aiProcessed: true,
            aiResponse: aiResult.response,
            intent: aiResult.intent,
            entities: aiResult.entities,
          });

          // Actualizar sentiment de la conversación
          if (aiResult.sentiment) {
            await ConversationService.closeConversation(conversation.id, aiResult.sentiment);
            await ConversationService.getOrCreateConversation(user.id); // Crear nueva conversación
          }

          // Actualizar webhook log como procesado
          if (webhookLogId) {
            await ConversationService.updateWebhookLog(webhookLogId, 'processed');
          }

          return NextResponse.json({ success: true, type: 'ai_response' });
        } else {
          // Para otros tipos de mensaje, enviar confirmación
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
