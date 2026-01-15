/**
 * WhatsAppService
 *
 * Orquestador central para procesamiento de webhooks de WhatsApp.
 */
import { messageProcessorService } from '@/services/MessageProcessorService'
import { AIService } from '@/lib/ai'
import { ConversationService } from '@/lib/conversation'
import { HorariosService } from '@/lib/horarios'
import {
  downloadWhatsAppMedia,
  sendWhatsAppAudio,
  sendWhatsAppMessage,
} from '@/lib/whatsapp'
import { whatsappLogger, logError } from '@/lib/logger'
import {
  WhatsAppMessagePayload,
  WhatsAppProcessResult,
  WhatsAppResponseConfig,
  ProcessMessageInput,
} from '@/types/schemas'

type MessageProcessorClient = typeof messageProcessorService

type WhatsAppClient = {
  sendWhatsAppMessage: typeof sendWhatsAppMessage
  sendWhatsAppAudio: typeof sendWhatsAppAudio
  downloadWhatsAppMedia: typeof downloadWhatsAppMedia
}

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000

export class WhatsAppService {
  constructor(
    private readonly processor: MessageProcessorClient = messageProcessorService,
    private readonly whatsappClient: WhatsAppClient = {
      sendWhatsAppMessage,
      sendWhatsAppAudio,
      downloadWhatsAppMedia,
    }
  ) {
    whatsappLogger.info('WhatsAppService initialized')
  }

  /**
   * Procesa el payload del webhook de WhatsApp.
   */
  async processWebhookPayload(
    payload: WhatsAppMessagePayload,
    config?: WhatsAppResponseConfig
  ): Promise<WhatsAppProcessResult> {
    const startedAt = Date.now()
    const validation = this.validateWebhookPayload(payload)

    if (!validation.valid) {
      return {
        success: false,
        type: 'error',
        error: validation.error || 'Payload invalido',
        details: { processingTime: Date.now() - startedAt },
      }
    }

    if (validation.type === 'status') {
      whatsappLogger.info('Status update received')
      return {
        success: true,
        type: 'status_update',
        message: 'Status update processed',
        details: { processingTime: Date.now() - startedAt },
      }
    }

    const value = payload.entry[0].changes[0].value
    const message = value.messages?.[0]

    if (!message) {
      return {
        success: false,
        type: 'error',
        error: 'Mensaje no encontrado en payload',
        details: { processingTime: Date.now() - startedAt },
      }
    }

    const contactName = value.contacts?.[0]?.profile?.name
    const phoneNumber = message.from
    const messageId = message.id

    whatsappLogger.info('Processing webhook message', {
      phoneNumber,
      messageId,
      messageType: message.type,
    })

    const userResult = await this.getOrCreateUser(phoneNumber, contactName)
    if (!userResult.success || !userResult.user) {
      return {
        success: false,
        type: 'error',
        error: userResult.error || 'No se pudo obtener usuario',
        details: { processingTime: Date.now() - startedAt },
      }
    }

    const conversationResult = await this.getOrCreateConversation(userResult.user.id)
    if (!conversationResult.success || !conversationResult.conversation) {
      return {
        success: false,
        type: 'error',
        error: conversationResult.error || 'No se pudo obtener conversacion',
        details: { userId: userResult.user.id, processingTime: Date.now() - startedAt },
      }
    }

    let conversation = conversationResult.conversation
    const sessionResult = await this.handleSessionTimeout(conversation)
    if (sessionResult.needsReset && sessionResult.newConversation) {
      conversation = sessionResult.newConversation
    }

    const extracted = this.extractMessageContent(message)

    const inboundSave = await this.saveMessage(
      conversation.id,
      userResult.user.id,
      extracted.type,
      extracted.content,
      'inbound',
      {
        whatsappId: messageId,
        caption: extracted.caption,
        mediaUrl: extracted.mediaUrl,
        mediaMimeType: extracted.mediaMimeType,
      }
    )

    if (!inboundSave.success) {
      if (inboundSave.error === 'duplicate') {
        return {
          success: true,
          type: 'duplicate',
          message: 'Duplicate webhook ignored',
          details: {
            userId: userResult.user.id,
            conversationId: conversation.id,
            processingTime: Date.now() - startedAt,
          },
        }
      }

      return {
        success: false,
        type: 'error',
        error: inboundSave.error || 'No se pudo guardar mensaje entrante',
        details: {
          userId: userResult.user.id,
          conversationId: conversation.id,
          processingTime: Date.now() - startedAt,
        },
      }
    }

    const respectHours = config?.respectHours !== false
    if (respectHours) {
      const hoursStatus = this.checkBusinessHours()
      if (!hoursStatus.isOpen && hoursStatus.message) {
        await this.sendResponse(phoneNumber, { text: hoursStatus.message })

        await this.saveMessage(
          conversation.id,
          userResult.user.id,
          'text',
          hoursStatus.message,
          'outbound',
          { aiProcessed: false }
        )

        return {
          success: true,
          type: 'out_of_hours',
          message: hoursStatus.message,
          details: {
            userId: userResult.user.id,
            conversationId: conversation.id,
            processingTime: Date.now() - startedAt,
          },
        }
      }
    }

    if (config?.forceManualMode || conversation.botMode === 'manual') {
      whatsappLogger.info('Conversation in manual mode', {
        conversationId: conversation.id,
      })

      return {
        success: true,
        type: 'manual_mode',
        message: 'Manual mode enabled',
        details: {
          userId: userResult.user.id,
          conversationId: conversation.id,
          processingTime: Date.now() - startedAt,
        },
      }
    }

    const commandResult = await this.handleCommand(extracted.content, userResult.user.id)
    if (commandResult.handled && commandResult.response) {
      await this.sendResponse(phoneNumber, { text: commandResult.response })

      await this.saveMessage(
        conversation.id,
        userResult.user.id,
        'text',
        commandResult.response,
        'outbound',
        { aiProcessed: false }
      )

      return {
        success: true,
        type: 'text',
        message: commandResult.response,
        details: {
          userId: userResult.user.id,
          conversationId: conversation.id,
          processingTime: Date.now() - startedAt,
        },
      }
    }

    const processInput: ProcessMessageInput = {
      messageContent: extracted.content,
      messageType: extracted.type as ProcessMessageInput['messageType'],
      mediaUrl: extracted.mediaUrl,
      mediaMimeType: extracted.mediaMimeType,
      userId: userResult.user.id,
      conversationId: conversation.id,
      phoneNumber,
      whatsappId: messageId,
    }

    const processResult = await this.processor.processMessage(processInput, {
      includeAudio: config?.includeAudio,
      maxTextLength: config?.maxTextLength,
    })

    if (!processResult.success) {
      return {
        success: false,
        type: 'error',
        error: processResult.error || 'No se pudo procesar el mensaje',
        details: {
          userId: userResult.user.id,
          conversationId: conversation.id,
          processingTime: Date.now() - startedAt,
        },
      }
    }

    const responseText = processResult.response
    await this.sendResponse(phoneNumber, {
      text: responseText,
      audioPath: processResult.audioPath,
    })

    await this.saveMessage(
      conversation.id,
      userResult.user.id,
      processResult.audioPath ? 'audio' : 'text',
      responseText,
      'outbound',
      {
        aiProcessed: true,
        aiResponse: responseText,
        intent: processResult.intent,
        entities: processResult.entities,
      }
    )

    return {
      success: true,
      type: processResult.audioPath ? 'audio' : 'text',
      message: responseText,
      details: {
        userId: userResult.user.id,
        conversationId: conversation.id,
        processingTime: Date.now() - startedAt,
      },
    }
  }

  private validateWebhookPayload(
    payload: WhatsAppMessagePayload
  ): { valid: boolean; error?: string; type?: 'message' | 'status' | 'invalid' } {
    if (!payload || !payload.object || !Array.isArray(payload.entry)) {
      return { valid: false, error: 'Payload sin objeto o entry', type: 'invalid' }
    }

    const entry = payload.entry[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    if (!value) {
      return { valid: false, error: 'Payload sin value', type: 'invalid' }
    }

    if (value.statuses?.length) {
      return { valid: true, type: 'status' }
    }

    if (!value.messages?.length) {
      return { valid: false, error: 'Payload sin messages', type: 'invalid' }
    }

    const message = value.messages[0]
    if (!message.from || !message.id || !message.timestamp) {
      return { valid: false, error: 'Mensaje incompleto', type: 'invalid' }
    }

    const supported = ['text', 'audio', 'image', 'video', 'document', 'location']
    if (!supported.includes(message.type)) {
      return { valid: false, error: 'Tipo de mensaje no soportado', type: 'invalid' }
    }

    return { valid: true, type: 'message' }
  }

  private async getOrCreateUser(
    phoneNumber: string,
    name?: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await ConversationService.getOrCreateUser(phoneNumber, name)
      return { success: true, user }
    } catch (error) {
      logError(whatsappLogger, error, { stage: 'get-or-create-user', phoneNumber })
      return { success: false, error: 'No se pudo obtener usuario' }
    }
  }

  private async getOrCreateConversation(
    userId: string
  ): Promise<{ success: boolean; conversation?: any; error?: string }> {
    try {
      const conversation = await ConversationService.getOrCreateConversation(userId)
      return { success: true, conversation }
    } catch (error) {
      logError(whatsappLogger, error, { stage: 'get-or-create-conversation', userId })
      return { success: false, error: 'No se pudo obtener conversacion' }
    }
  }

  private async handleSessionTimeout(
    conversation: any
  ): Promise<{ needsReset: boolean; newConversation?: any }> {
    try {
      const lastMessage = await ConversationService.getLastMessage(conversation.id)
      if (!lastMessage?.timestamp) {
        return { needsReset: false }
      }

      const lastTimestamp = new Date(lastMessage.timestamp).getTime()
      const now = Date.now()
      if (now - lastTimestamp <= SESSION_TIMEOUT_MS) {
        return { needsReset: false }
      }

      await ConversationService.closeConversation(conversation.id)
      const newConversation = await ConversationService.getOrCreateConversation(conversation.userId)

      whatsappLogger.info('Session timeout detected', {
        conversationId: conversation.id,
      })

      return { needsReset: true, newConversation }
    } catch (error) {
      logError(whatsappLogger, error, { stage: 'session-timeout', conversationId: conversation.id })
      return { needsReset: false }
    }
  }

  private extractMessageContent(message: any): {
    content: string
    type: string
    mediaUrl?: string
    mediaMimeType?: string
    caption?: string
  } {
    switch (message.type) {
      case 'text':
        return { content: message.text?.body || '', type: 'text' }
      case 'audio':
        return {
          content: '[Audio]',
          type: 'audio',
          mediaUrl: message.audio?.id,
          mediaMimeType: message.audio?.mime_type,
        }
      case 'image':
        return {
          content: message.image?.caption || '[Imagen]',
          type: 'image',
          mediaUrl: message.image?.id,
          mediaMimeType: message.image?.mime_type,
          caption: message.image?.caption,
        }
      case 'video':
        return {
          content: message.video?.caption || '[Video]',
          type: 'video',
          mediaUrl: message.video?.id,
          mediaMimeType: message.video?.mime_type,
          caption: message.video?.caption,
        }
      case 'document':
        return {
          content: message.document?.caption || message.document?.filename || '[Documento]',
          type: 'document',
          mediaUrl: message.document?.id,
          mediaMimeType: message.document?.mime_type,
          caption: message.document?.caption,
        }
      case 'location':
        return {
          content: `[Ubicacion: ${message.location?.latitude}, ${message.location?.longitude}]`,
          type: 'location',
        }
      default:
        return { content: '[Tipo no soportado]', type: 'unknown' }
    }
  }

  private checkBusinessHours(): { isOpen: boolean; message?: string } {
    const status = HorariosService.estaAbierto()
    if (!status.abierto) {
      return { isOpen: false, message: status.mensaje }
    }

    return { isOpen: true, message: status.mensaje }
  }

  private async handleCommand(
    command: string,
    userId: string
  ): Promise<{ handled: boolean; response?: string }> {
    if (!command.trim().startsWith('/')) {
      return { handled: false }
    }

    const response = await AIService.handleCommand(command, userId)
    if (!response) {
      return { handled: false }
    }

    return { handled: true, response }
  }

  private async saveMessage(
    conversationId: string,
    userId: string,
    type: string,
    content: string,
    direction: 'inbound' | 'outbound',
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message = await ConversationService.saveMessage({
        conversationId,
        userId,
        type,
        content,
        direction,
        ...metadata,
      })

      if (!message) {
        return { success: false, error: 'duplicate' }
      }

      return { success: true, messageId: message.id }
    } catch (error) {
      logError(whatsappLogger, error, {
        stage: 'save-message',
        conversationId,
        userId,
      })

      return { success: false, error: 'No se pudo guardar mensaje' }
    }
  }

  private async sendResponse(
    phoneNumber: string,
    response: { text: string; audioPath?: string }
  ): Promise<{ success: boolean; error?: string }> {
    if (response.audioPath) {
      const audioResult = await this.whatsappClient.sendWhatsAppAudio(
        phoneNumber,
        response.audioPath
      )

      return audioResult.success
        ? { success: true }
        : { success: false, error: audioResult.error }
    }

    try {
      await this.whatsappClient.sendWhatsAppMessage(phoneNumber, response.text)
      return { success: true }
    } catch (error) {
      logError(whatsappLogger, error, { stage: 'send-text', phoneNumber })
      return { success: false, error: 'No se pudo enviar mensaje' }
    }
  }

  /**
   * Verifica si el servicio esta configurado correctamente.
   */
  async isConfigured(): Promise<boolean> {
    const token = process.env.WHATSAPP_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneId) {
      return false
    }

    return this.processor.isConfigured()
  }
}

export const whatsAppService = new WhatsAppService()
