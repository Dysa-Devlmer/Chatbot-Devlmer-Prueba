/**
 * MessageProcessorService
 *
 * Orquesta el procesamiento de mensajes entrantes desde WhatsApp.
 */
import { AIService } from '@/lib/ai'
import { ConversationService } from '@/lib/conversation'
import { downloadWhatsAppMedia, sendWhatsAppAudio } from '@/lib/whatsapp'
import { messageProcessorLogger, logError } from '@/lib/logger'
import { perplexityService } from '@/services/PerplexityService'
import {
  ConversationContext,
  ProcessMessageInput,
  ProcessMessageResult,
  ProcessingOptions,
} from '@/types/schemas'

const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_MAX_TEXT_LENGTH = 2000
const MAX_TTS_LENGTH = 300

type WhatsAppClient = {
  downloadWhatsAppMedia: typeof downloadWhatsAppMedia
  sendWhatsAppAudio: typeof sendWhatsAppAudio
}


export class MessageProcessorService {
  constructor(
    private readonly whatsappClient: WhatsAppClient = {
      downloadWhatsAppMedia,
      sendWhatsAppAudio,
    }
  ) {
    messageProcessorLogger.info('MessageProcessorService initialized')
  }

  /**
   * Procesa un mensaje y genera respuesta con IA.
   */
  async processMessage(
    input: ProcessMessageInput,
    options?: ProcessingOptions
  ): Promise<ProcessMessageResult> {
    const startedAt = Date.now()
    const validation = this.validateInput(input)

    if (!validation.valid) {
      messageProcessorLogger.warn('Invalid message input', {
        userId: input.userId,
        conversationId: input.conversationId,
        error: validation.error,
      })

      return {
        success: false,
        response: '',
        error: validation.error,
        details: { procesingTime: Date.now() - startedAt },
      }
    }

    const config: Required<ProcessingOptions> = {
      includeAudio: options?.includeAudio ?? input.messageType === 'audio',
      maxTextLength: options?.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH,
      timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS,
      fallbackToText: options?.fallbackToText ?? true,
    }

    messageProcessorLogger.info('Processing message', {
      userId: input.userId,
      conversationId: input.conversationId,
      type: input.messageType,
      includeAudio: config.includeAudio,
    })

    let messageContent = input.messageContent
    let transcriptionText: string | undefined

    if (input.messageType === 'audio') {
      if (input.mediaPath) {
        const localResult = await AIService.transcribeAudio(input.mediaPath)

        if (!localResult.success || !localResult.text) {
          messageProcessorLogger.warn('Local audio transcription failed', {
            userId: input.userId,
            conversationId: input.conversationId,
            error: localResult.error,
          })

          return {
            success: false,
            response: '',
            error: localResult.error || 'No se pudo transcribir el audio',
            details: { procesingTime: Date.now() - startedAt },
          }
        }

        transcriptionText = localResult.text
        messageContent = localResult.text
      } else {
        const mediaUrl = input.mediaUrl
        const mimeType = input.mediaMimeType || 'audio/ogg'

        if (!mediaUrl) {
          return {
            success: false,
            response: '',
            error: 'Media URL requerida para transcribir audio',
            details: { procesingTime: Date.now() - startedAt },
          }
        }

        const transcription = await this.transcribeAudio(mediaUrl, mimeType)

        if (!transcription.success || !transcription.text) {
          return {
            success: false,
            response: '',
            error: transcription.error || 'No se pudo transcribir el audio',
            details: { procesingTime: Date.now() - startedAt },
          }
        }

        transcriptionText = transcription.text
        messageContent = transcription.text
      }
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined
    let responseResult: {
      success: boolean
      response: string
      intent?: string
      entities?: Record<string, unknown>
      error?: string
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error('AI processing timeout')),
          config.timeout
        )
      })

      responseResult = (await Promise.race([
        this.generateResponse(messageContent, input.userId, input.conversationId),
        timeoutPromise,
      ])) as {
        success: boolean
        response: string
        intent?: string
        entities?: Record<string, unknown>
        error?: string
      }
    } catch (error) {
      logError(messageProcessorLogger, error, {
        stage: 'ai-processing-timeout',
        userId: input.userId,
        conversationId: input.conversationId,
      })

      return {
        success: false,
        response: '',
        error: 'Tiempo de espera agotado al procesar con IA',
        details: { procesingTime: Date.now() - startedAt },
      }
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }
    }

    if (!responseResult.success) {
      return {
        success: false,
        response: responseResult.response,
        error: responseResult.error || 'No se pudo generar respuesta',
        details: {
          transcriptionText,
          procesingTime: Date.now() - startedAt,
          aiProvider: 'fallback',
        },
      }
    }

    let responseText = responseResult.response
    if (responseText.length > config.maxTextLength) {
      responseText = responseText.slice(0, config.maxTextLength).trim()
    }

    if (config.includeAudio && input.messageType === 'audio') {
      const audioResult = await this.generateAudio(responseText)

      if (!audioResult.success || !audioResult.audioPath) {
        messageProcessorLogger.warn('TTS generation failed', {
          userId: input.userId,
          conversationId: input.conversationId,
          error: audioResult.error,
        })

        if (!config.fallbackToText) {
          return {
            success: false,
            response: responseText,
            error: audioResult.error || 'No se pudo generar audio',
            details: {
              transcriptionText,
              procesingTime: Date.now() - startedAt,
              aiProvider: 'perplexity',
            },
          }
        }

        return {
          success: true,
          response: responseText,
          audioSent: false,
          intent: responseResult.intent,
          entities: responseResult.entities,
          details: {
            transcriptionText,
            procesingTime: Date.now() - startedAt,
            aiProvider: 'perplexity',
          },
        }
      }

      const sendResult = await this.whatsappClient.sendWhatsAppAudio(input.phoneNumber, audioResult.audioPath)
      audioResult.cleanup()

      if (!sendResult.success) {
        messageProcessorLogger.warn('Audio send failed', {
          userId: input.userId,
          conversationId: input.conversationId,
          error: sendResult.error,
        })
      }

      return {
        success: true,
        response: responseText,
        audioPath: audioResult.audioPath,
        audioSent: sendResult.success,
        intent: responseResult.intent,
        entities: responseResult.entities,
        details: {
          transcriptionText,
          procesingTime: Date.now() - startedAt,
          aiProvider: 'perplexity',
        },
      }
    }

    return {
      success: true,
      response: responseText,
      intent: responseResult.intent,
      entities: responseResult.entities,
      details: {
        transcriptionText,
        procesingTime: Date.now() - startedAt,
        aiProvider: 'perplexity',
      },
    }
  }

  private async transcribeAudio(
    mediaUrl: string,
    mimeType: string
  ): Promise<{ success: boolean; text?: string; error?: string }> {
    messageProcessorLogger.info('Transcribing audio message', { mediaUrl, mimeType })

    let downloaded: { filePath: string; cleanup: () => void } | null = null

    try {
      const downloadResult = await this.whatsappClient.downloadWhatsAppMedia(mediaUrl)
      downloaded = { filePath: downloadResult.filePath, cleanup: downloadResult.cleanup }

      const transcription = await AIService.transcribeAudio(downloadResult.filePath)

      if (!transcription.success || !transcription.text) {
        return {
          success: false,
          error: transcription.error || 'Transcripcion fallida',
        }
      }

      messageProcessorLogger.debug('Transcription completed', {
        textLength: transcription.text.length,
        cached: transcription.cached,
      })

      return { success: true, text: transcription.text }
    } catch (error) {
      logError(messageProcessorLogger, error, { stage: 'audio-transcription', mediaUrl })
      return { success: false, error: 'No se pudo transcribir el audio' }
    } finally {
      if (downloaded) {
        downloaded.cleanup()
      }
    }
  }

  private async generateResponse(
    messageContent: string,
    userId: string,
    conversationId: string
  ): Promise<{
    success: boolean
    response: string
    intent?: string
    entities?: Record<string, unknown>
    error?: string
  }> {
    try {
      const context = await this.getConversationContext(userId, conversationId)
      messageProcessorLogger.info('Generating AI response', {
        userId,
        conversationId,
        contextMessages: context.recentMessages.length,
      })

      const aiResponse = await perplexityService.generateResponse(messageContent, context)

      return {
        success: true,
        response: aiResponse.response,
        intent: aiResponse.intent,
        entities: aiResponse.entities,
      }
    } catch (error) {
      logError(messageProcessorLogger, error, {
        stage: 'ai-response',
        userId,
        conversationId,
      })

      return {
        success: false,
        response: 'Lo siento, tuve un problema procesando tu mensaje.',
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  private async generateAudio(
    text: string
  ): Promise<{
    success: boolean
    audioPath?: string
    error?: string
    cleanup: () => void
  }> {
    const cleanedText = text
      .replace(/[\u2013\u2014-]\s*PITHY.*$/i, '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()

    const limitedText = cleanedText.slice(0, MAX_TTS_LENGTH)

    if (!limitedText) {
      return { success: false, error: 'Texto vacio para TTS', cleanup: () => {} }
    }

    try {
      const ttsResult = await AIService.textToSpeech(limitedText)

      if (!ttsResult.success) {
        return {
          success: false,
          error: ttsResult.error || 'Error generando audio',
          cleanup: ttsResult.cleanup,
        }
      }

      return {
        success: true,
        audioPath: ttsResult.audioPath,
        cleanup: ttsResult.cleanup,
      }
    } catch (error) {
      logError(messageProcessorLogger, error, { stage: 'tts-generation' })
      return { success: false, error: 'No se pudo generar audio', cleanup: () => {} }
    }
  }

  private async getConversationContext(
    userId: string,
    conversationId: string,
    limit: number = 10
  ): Promise<ConversationContext> {
    try {
      const history = await ConversationService.getConversationHistory(conversationId, limit)
      const sortedHistory = [...history].reverse()

      const recentMessages = sortedHistory.map((message) => ({
        role: message.direction === 'inbound' ? 'user' : 'assistant',
        content: message.content,
      }))

      const firstUser = history[0]?.user
      const userProfile = firstUser?.name ? { name: firstUser.name } : undefined

      return { userId, conversationId, recentMessages, userProfile }
    } catch (error) {
      logError(messageProcessorLogger, error, {
        stage: 'conversation-context',
        conversationId,
      })

      return { userId, conversationId, recentMessages: [] }
    }
  }

  private validateInput(input: ProcessMessageInput): { valid: boolean; error?: string } {
    if (!input.messageContent || !input.messageContent.trim()) {
      return { valid: false, error: 'messageContent es requerido' }
    }

    const allowedTypes = ['text', 'audio', 'image', 'document', 'video']
    if (!allowedTypes.includes(input.messageType)) {
      return { valid: false, error: 'messageType invalido' }
    }

    if (!input.userId) {
      return { valid: false, error: 'userId es requerido' }
    }

    if (!input.conversationId) {
      return { valid: false, error: 'conversationId es requerido' }
    }

    if (!input.whatsappId) {
      return { valid: false, error: 'whatsappId es requerido' }
    }

    const phoneDigits = input.phoneNumber.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return { valid: false, error: 'phoneNumber invalido' }
    }

    if (input.messageType === 'audio' && !input.mediaUrl && !input.mediaPath) {
      return { valid: false, error: 'mediaUrl o mediaPath requerido para audio' }
    }

    return { valid: true }
  }

  /**
   * Verifica que los servicios dependientes esten configurados.
   */
  async isConfigured(): Promise<boolean> {
    try {
      const isPerplexityReady = perplexityService.isConfigured()
      const whisperStatus = await AIService.checkWhisperStatus()
      const ttsStatus = await AIService.checkTTSStatus()

      return isPerplexityReady && whisperStatus.available && ttsStatus.available
    } catch (error) {
      logError(messageProcessorLogger, error, { stage: 'config-check' })
      return false
    }
  }
}

export const messageProcessorService = new MessageProcessorService()









