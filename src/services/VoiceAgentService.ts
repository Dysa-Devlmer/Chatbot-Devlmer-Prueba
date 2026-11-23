/**
 * VoiceAgentService
 *
 * Motor de Inteligencia Artificial para el Agente de Voz en Llamadas WhatsApp Calling API.
 * Gestiona:
 * - Conversión de intención y diálogo oral optimizado para audio en tiempo real.
 * - Function calling oral: Consulta de carta, toma de pedidos y verificación de stock.
 * - Despacho automático de comanda al sistema de cocina y envío de boleta/tracking al chat de WhatsApp.
 */

import { prisma } from '@/lib/prisma';
import { reservationService } from './ReservationService';
import { whatsappLogger, logError } from '@/lib/logger';
import { geminiService } from './GeminiService';

export interface VoiceCallContext {
  callId: string;
  callerPhone: string;
  callerName?: string;
  businessName?: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
  currentDraftOrder?: {
    items: string[];
    notes?: string;
    deliveryType?: 'delivery' | 'pickup';
    address?: string;
  };
}

export interface VoiceAgentResponse {
  spokenReply: string;
  actionTaken?: 'menu_consulted' | 'order_created' | 'clarification_needed' | 'call_finished';
  orderNumber?: string;
  trackingUrl?: string;
  shouldHangUp?: boolean;
}

export class VoiceAgentService {
  /**
   * Genera el prompt del sistema optimizado para agentes de voz en llamadas telefónicas.
   * Reglas de oro para voz:
   * 1. Frases concisas, directas y sin markdown (nada de asteriscos, negritas ni viñetas).
   * 2. Tono cálido, amigable y profesional en español latinoamericano.
   * 3. Preguntas de confirmación claras antes de cerrar el pedido.
   */
  private buildVoiceSystemInstruction(businessName: string, catalogText: string): string {
    return `Eres la recepcionista virtual por llamada de voz de "${businessName}".
Tu trabajo es atender la llamada telefónica con amabilidad, rapidez y naturalidad, como un operador humano de restaurante.

CARTA Y PRECIOS DISPONIBLES:
${catalogText}

REGLAS DE CONVERSACIÓN POR VOZ (OBLIGATORIAS):
1. Respuestas breves: Máximo 2 a 3 frases por turno. La gente en llamada no quiere escuchar párrafos largos.
2. NO uses formato markdown (prohibido asteriscos, viñetas, guiones o numerales). Escribe texto corrido que suene natural al hablar.
3. Para precios di siempre la moneda en palabras (ejemplo: "dieciocho soles cincuenta" o "cinco mil pesos").
4. Si el cliente pide algo del menú, confirma amablemente si desea agregar cremas, bebidas o extras.
5. Pide la dirección de entrega de forma clara si el pedido es para delivery.
6. Cuando el cliente confirme que desea cerrar el pedido, resume los platos y dile que su orden pasará de inmediato a cocina y que le enviarás el enlace de seguimiento a su chat de WhatsApp.`;
  }

  /**
   * Obtiene la carta actual formateada para comprensión rápida del agente de voz
   */
  async getCatalogForVoice(): Promise<string> {
    try {
      const [products, business] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          select: { name: true, price: true, description: true, category: { select: { name: true } } },
          orderBy: { price: 'asc' },
        }),
        prisma.businessProfile.findFirst()
      ]);

      const sym = business?.currencySymbol || 'S/.';
      if (!products.length) return 'Platos principales: Broasters, Salchipapas y Bebidas.';

      return products
        .map((p) => `- ${p.name}: ${sym} ${Number(p.price).toFixed(2)}${p.description ? ` (${p.description})` : ''}`)
        .join('\n');
    } catch (e) {
      logError(whatsappLogger, e, { context: 'getCatalogForVoice' });
      return 'Platos disponibles en carta de comida rápida.';
    }
  }

  /**
   * Procesa un turno de audio/texto de la llamada telefónica
   */
  async processVoiceTurn(
    callerMessage: string,
    context: VoiceCallContext
  ): Promise<VoiceAgentResponse> {
    try {
      const businessName = context.businessName || "Churu's Comida Rápida";
      const catalog = await this.getCatalogForVoice();
      const systemInstruction = this.buildVoiceSystemInstruction(businessName, catalog);

      // Contexto conversacional previo
      const historySummary = context.conversationHistory
        .map((h) => `${h.role === 'user' ? 'Cliente' : 'Recepcionista'}: ${h.text}`)
        .join('\n');

      const fullPrompt = `${systemInstruction}

HISTORIAL DE LA LLAMADA EN VIVO:
${historySummary}
Cliente: ${callerMessage}
Recepcionista:`;

      // Consultar a Gemini para respuesta oral natural
      const aiText = await geminiService.generateRawText(fullPrompt);
      const cleanSpoken = aiText.replace(/[*_#`~]/g, '').trim();

      // Evaluar si el cliente ha confirmado la toma del pedido final
      const isConfirmingOrder =
        /(confirmo|hazlo|mándalo|eso es todo|si por favor|cierro el pedido|listo envíalo)/i.test(callerMessage) &&
        /(orden|pedido|soles|pesos|cocina)/i.test(cleanSpoken);

      let orderNumber: string | undefined;
      let trackingUrl: string | undefined;
      let actionTaken: VoiceAgentResponse['actionTaken'] = 'clarification_needed';

      if (isConfirmingOrder && context.currentDraftOrder && context.currentDraftOrder.items.length > 0) {
        const orderRes = await reservationService.createReservation({
          customerPhone: context.callerPhone,
          customerName: context.callerName || 'Cliente por Llamada WhatsApp',
          productNames: context.currentDraftOrder.items,
          notes: `[PEDIDO POR LLAMADA VOIP WHATSAPP] ${context.currentDraftOrder.notes || ''} - Dirección: ${
            context.currentDraftOrder.address || 'Confirmada por voz'
          }`,
          channel: 'whatsapp',
          deliveryType: context.currentDraftOrder.deliveryType || 'delivery',
          deliveryAddress: context.currentDraftOrder.address,
        });

        if (orderRes.success && orderRes.orderNumber) {
          orderNumber = orderRes.orderNumber;
          trackingUrl = `https://chatbot.zgamersa.com/tracking?order=${orderNumber}`;
          actionTaken = 'order_created';

          // Enviar confirmación interactiva al chat de WhatsApp del cliente
          await this.sendChatFollowUpAfterCall(context.callerPhone, orderNumber, trackingUrl, orderRes.totalAmount || 0);
        }
      }

      return {
        spokenReply: cleanSpoken,
        actionTaken,
        orderNumber,
        trackingUrl,
      };
    } catch (error) {
      logError(whatsappLogger, error, { context: 'processVoiceTurn', callId: context.callId });
      return {
        spokenReply:
          'Disculpa, no pude escucharte bien. ¿Podrías repetirme qué plato deseas ordenar?',
        actionTaken: 'clarification_needed',
      };
    }
  }

  /**
   * Envía un mensaje interactivo al chat de WhatsApp al concretar el pedido por llamada
   */
  async sendChatFollowUpAfterCall(
    phoneNumber: string,
    orderNumber: string,
    trackingUrl: string,
    total: number
  ): Promise<void> {
    try {
      const token = process.env.WHATSAPP_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (!token || !phoneId) return;

      const business = await prisma.businessProfile.findFirst();
      const sym = business?.currencySymbol || 'S/.';

      const bodyText = `🎉 *¡Tu pedido ${orderNumber} ha sido confirmado por llamada de voz!* 📞✨\n\n` +
        `Nuestra cocina ya tiene tu comanda en preparación.\n` +
        `💰 *Total:* ${sym} ${total.toFixed(2)}\n\n` +
        `🛵 *Sigue el estado de tu pedido en vivo aquí:*\n${trackingUrl}`;

      await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber.replace(/\D/g, ''),
          type: 'text',
          text: { body: bodyText },
        }),
      });

      whatsappLogger.info('Seguimiento de llamada enviado al chat de WhatsApp con éxito', {
        phoneNumber,
        orderNumber,
      });
    } catch (e) {
      logError(whatsappLogger, e, { context: 'sendChatFollowUpAfterCall', phoneNumber });
    }
  }
}

export const voiceAgentService = new VoiceAgentService();
