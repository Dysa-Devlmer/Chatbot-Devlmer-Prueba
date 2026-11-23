/**
 * WhatsAppCallingService
 *
 * Administra el ciclo de vida de llamadas VoIP entrantes a través de Meta WhatsApp Calling API:
 * - Detección y validación de eventos de llamada en el webhook ('calls').
 * - Verificación automática de horario de atención comercial.
 * - Despacho de audio a VoiceAgentService (Gemini Live Voice Pipeline).
 * - Envío automático de mensaje interactivo de contingencia si llaman fuera de horario o línea ocupada.
 * - Registro y telemetría de llamadas.
 */

import { whatsappLogger, logError } from '@/lib/logger';
import { voiceAgentService, VoiceCallContext } from './VoiceAgentService';
import { HorariosService } from '@/lib/horarios';
import { prisma } from '@/lib/prisma';

export interface WhatsAppCallEvent {
  id: string; // Call ID único otorgado por Meta
  from: string; // Número de teléfono del cliente
  timestamp: string;
  event: 'ringing' | 'connect' | 'terminate' | 'offer' | 'missed' | 'rejected';
  direction: 'inbound' | 'outbound';
  session?: {
    sdp?: string;
    protocol?: 'webrtc' | 'sip';
  };
}

export interface WhatsAppCallingWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        calls?: WhatsAppCallEvent[];
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppCallingService {
  // Almacén en memoria de llamadas activas
  private activeCalls = new Map<string, VoiceCallContext>();

  /**
   * Determina si el payload del webhook corresponde a un evento de llamada telefónica
   */
  isCallEvent(payload: any): boolean {
    if (!payload?.entry?.[0]?.changes?.[0]) return false;
    const change = payload.entry[0].changes[0];
    return change.field === 'calls' || (Boolean(change.value?.calls) && Array.isArray(change.value.calls));
  }

  /**
   * Procesa el evento de llamada recibido desde Meta
   */
  async handleIncomingCallWebhook(payload: WhatsAppCallingWebhookPayload): Promise<{
    handled: boolean;
    callId?: string;
    action?: string;
    message?: string;
  }> {
    try {
      const change = payload.entry[0].changes[0].value;
      const call = change.calls?.[0];
      const phoneNumberId = change.metadata.phone_number_id;

      if (!call) {
        return { handled: false, message: 'No call event in payload' };
      }

      whatsappLogger.info('WhatsApp Calling Event recibido', {
        callId: call.id,
        event: call.event,
        from: call.from,
        phoneId: phoneNumberId,
      });

      switch (call.event) {
        case 'ringing':
        case 'offer':
          return await this.onCallInitiated(call, phoneNumberId);

        case 'connect':
          return await this.onCallConnected(call);

        case 'terminate':
        case 'missed':
        case 'rejected':
          return await this.onCallEnded(call, phoneNumberId);

        default:
          return { handled: true, callId: call.id, action: 'ignored' };
      }
    } catch (error) {
      logError(whatsappLogger, error, { context: 'handleIncomingCallWebhook' });
      return { handled: false, message: 'Error processing call webhook' };
    }
  }

  /**
   * Maneja el inicio de una llamada entrante (ringing / offer)
   */
  private async onCallInitiated(
    call: WhatsAppCallEvent,
    phoneNumberId: string
  ): Promise<{ handled: boolean; callId: string; action: string }> {
    const businessOpen = HorariosService.estaAbierto().abierto;

    // 1. Si el local está cerrado, rechazar amablemente y mandar mensaje de texto con la carta digital
    if (!businessOpen) {
      whatsappLogger.info('Llamada rechazada: Local cerrado. Enviando auto-respuesta de WhatsApp', {
        caller: call.from,
      });

      await this.rejectCall(phoneNumberId, call.id, 'BUSINESS_CLOSED');
      await this.sendClosedNoticeToChat(phoneNumberId, call.from);

      return {
        handled: true,
        callId: call.id,
        action: 'rejected_closed_notice_sent',
      };
    }

    // 2. Si está abierto, inicializar el contexto del Agente de Voz
    const business = await prisma.businessProfile.findFirst();
    const context: VoiceCallContext = {
      callId: call.id,
      callerPhone: call.from,
      businessName: business?.name || "Churu's Comida Rápida",
      conversationHistory: [],
      currentDraftOrder: { items: [] },
    };

    this.activeCalls.set(call.id, context);

    // 3. Responder a Meta para aceptar y negociar la sesión
    await this.acceptCall(phoneNumberId, call.id, call.session);

    return {
      handled: true,
      callId: call.id,
      action: 'call_accepted_voice_agent_ready',
    };
  }

  /**
   * Maneja cuando la llamada ya se conectó por VoIP
   */
  private async onCallConnected(call: WhatsAppCallEvent) {
    const context = this.activeCalls.get(call.id);
    if (context) {
      // Saludo inicial de la IA
      const greeting = `¡Hola! Bienvenido a ${context.businessName}. Soy tu asistente virtual. ¿Qué te gustaría ordenar hoy?`;
      context.conversationHistory.push({ role: 'assistant', text: greeting });
      whatsappLogger.info('Llamada conectada activamente', { callId: call.id, greeting });
    }
    return { handled: true, callId: call.id, action: 'call_connected' };
  }

  /**
   * Maneja la finalización de la llamada
   */
  private async onCallEnded(call: WhatsAppCallEvent, phoneNumberId: string) {
    const context = this.activeCalls.get(call.id);
    this.activeCalls.delete(call.id);

    whatsappLogger.info('Llamada finalizada', {
      callId: call.id,
      caller: call.from,
      event: call.event,
    });

    return { handled: true, callId: call.id, action: 'call_cleaned_up' };
  }

  /**
   * Notifica a Meta la aceptación de la llamada VoIP
   */
  async acceptCall(phoneNumberId: string, callId: string, session?: WhatsAppCallEvent['session']): Promise<boolean> {
    try {
      const token = process.env.WHATSAPP_TOKEN;
      if (!token) return false;

      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/calls`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          call_id: callId,
          action: 'accept',
          session: session || { protocol: 'webrtc' },
        }),
      });

      return response.ok;
    } catch (e) {
      logError(whatsappLogger, e, { context: 'acceptCall', callId });
      return false;
    }
  }

  /**
   * Rechaza una llamada entrante ante Meta
   */
  async rejectCall(phoneNumberId: string, callId: string, reason: string = 'BUSY'): Promise<boolean> {
    try {
      const token = process.env.WHATSAPP_TOKEN;
      if (!token) return false;

      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/calls`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          call_id: callId,
          action: 'reject',
          reason,
        }),
      });

      return response.ok;
    } catch (e) {
      logError(whatsappLogger, e, { context: 'rejectCall', callId });
      return false;
    }
  }

  /**
   * Envía un mensaje con la carta digital si llamaron con el local cerrado
   */
  async sendClosedNoticeToChat(phoneNumberId: string, callerPhone: string): Promise<void> {
    try {
      const token = process.env.WHATSAPP_TOKEN;
      if (!token) return;

      const business = await prisma.businessProfile.findFirst();
      const bName = business?.name || "Nuestro Negocio";
      const status = HorariosService.estaAbierto();
      const horarioMsg = status.horarioHoy ? `🕒 *Horario de atención hoy:* ${status.horarioHoy}\n\n` : '';

      const text = `👋 *¡Hola! Notamos tu llamada a ${bName}.* 📞✨\n\n` +
        `En este momento nuestra cocina y atención están fuera de horario comercial.\n` +
        horarioMsg +
        `📲 Puedes explorar nuestra carta digital y dejar tu pedido agendado aquí:\n` +
        `👉 *https://chatbot.zgamersa.com/menu*`;

      await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: callerPhone.replace(/\D/g, ''),
          type: 'text',
          text: { body: text },
        }),
      });
    } catch (e) {
      logError(whatsappLogger, e, { context: 'sendClosedNoticeToChat', callerPhone });
    }
  }
}

export const whatsAppCallingService = new WhatsAppCallingService();
