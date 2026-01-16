/**
 * Schemas de Validación con Zod
 *
 * Schemas para validar:
 * - Webhooks de WhatsApp
 * - Requests de API
 * - Configuraciones
 * - Datos de usuario
 */

import { z } from 'zod'

/**
 * Schema para número de teléfono de WhatsApp
 */
export const phoneNumberSchema = z
  .string()
  .regex(/^\d{10,15}$/, 'Invalid phone number format')
  .describe('Phone number in international format without +')

/**
 * Schema para webhook de WhatsApp - Verificación
 */
export const whatsappVerifySchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.challenge': z.string(),
  'hub.verify_token': z.string(),
})

/**
 * Schema para mensaje de WhatsApp entrante
 */
export const whatsappMessageSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.literal('whatsapp'),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            contacts: z
              .array(
                z.object({
                  profile: z.object({
                    name: z.string(),
                  }),
                  wa_id: phoneNumberSchema,
                })
              )
              .optional(),
            messages: z
              .array(
                z.object({
                  from: phoneNumberSchema,
                  id: z.string(),
                  timestamp: z.string(),
                  type: z.enum([
                    'text',
                    'image',
                    'video',
                    'audio',
                    'document',
                    'location',
                    'contacts',
                    'sticker',
                    'button',
                    'interactive',
                  ]),
                  text: z
                    .object({
                      body: z.string(),
                    })
                    .optional(),
                  image: z
                    .object({
                      caption: z.string().optional(),
                      mime_type: z.string(),
                      sha256: z.string(),
                      id: z.string(),
                    })
                    .optional(),
                  audio: z
                    .object({
                      mime_type: z.string(),
                      sha256: z.string(),
                      id: z.string(),
                      voice: z.boolean().optional(),
                    })
                    .optional(),
                  document: z
                    .object({
                      caption: z.string().optional(),
                      filename: z.string().optional(),
                      mime_type: z.string(),
                      sha256: z.string(),
                      id: z.string(),
                    })
                    .optional(),
                  location: z
                    .object({
                      latitude: z.number(),
                      longitude: z.number(),
                      name: z.string().optional(),
                      address: z.string().optional(),
                    })
                    .optional(),
                  button: z
                    .object({
                      text: z.string(),
                      payload: z.string(),
                    })
                    .optional(),
                  interactive: z
                    .object({
                      type: z.enum(['button_reply', 'list_reply']),
                      button_reply: z
                        .object({
                          id: z.string(),
                          title: z.string(),
                        })
                        .optional(),
                      list_reply: z
                        .object({
                          id: z.string(),
                          title: z.string(),
                          description: z.string().optional(),
                        })
                        .optional(),
                    })
                    .optional(),
                })
              )
              .optional(),
            statuses: z
              .array(
                z.object({
                  id: z.string(),
                  status: z.enum(['sent', 'delivered', 'read', 'failed']),
                  timestamp: z.string(),
                  recipient_id: phoneNumberSchema,
                  errors: z
                    .array(
                      z.object({
                        code: z.number(),
                        title: z.string(),
                        message: z.string().optional(),
                      })
                    )
                    .optional(),
                })
              )
              .optional(),
          }),
          field: z.literal('messages'),
        })
      ),
    })
  ),
})

/**
 * Schema para login de administrador
 */
export const adminLoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
})

/**
 * Schema para crear/actualizar tag
 */
export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  icon: z.string().max(10).optional(),
  description: z.string().max(200).optional(),
  category: z.enum(['general', 'priority', 'status', 'custom']).optional(),
})

/**
 * Schema para enviar mensaje de WhatsApp
 */
export const sendMessageSchema = z.object({
  to: phoneNumberSchema,
  type: z.enum(['text', 'image', 'audio', 'document', 'template']),
  text: z
    .object({
      body: z.string().min(1).max(4096),
    })
    .optional(),
  image: z
    .object({
      link: z.string().url(),
      caption: z.string().max(1024).optional(),
    })
    .optional(),
  audio: z
    .object({
      link: z.string().url(),
    })
    .optional(),
  document: z
    .object({
      link: z.string().url(),
      filename: z.string().optional(),
      caption: z.string().max(1024).optional(),
    })
    .optional(),
})

/**
 * Schema para configuración de IA
 */
export const aiConfigSchema = z.object({
  provider: z.enum(['ollama', 'openai', 'anthropic']),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional(),
  systemPrompt: z.string().max(5000).optional(),
})

/**
 * Schema para feedback de aprendizaje
 */
export const learningFeedbackSchema = z.object({
  learningId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  feedbackType: z.enum(['thumbs_up', 'thumbs_down', 'star_rating', 'flag', 'comment']),
  rating: z.number().min(1).max(5).optional(),
  userComment: z.string().max(500).optional(),
  userPhone: phoneNumberSchema.optional(),
})

/**
 * Schema para programar mensaje
 */
export const scheduleMessageSchema = z.object({
  to: phoneNumberSchema.or(z.array(phoneNumberSchema)),
  message: z.string().min(1).max(4096),
  scheduledFor: z.string().datetime(),
  repeat: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
})

/**
 * Schema para búsqueda de conversaciones
 */
export const searchConversationsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['active', 'closed', 'escalated']).optional(),
  botMode: z.enum(['auto', 'manual', 'hybrid']).optional(),
  isUnread: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
})

/**
 * Type exports (inferidos de schemas)
 */
export type PhoneNumber = z.infer<typeof phoneNumberSchema>
export type WhatsAppVerify = z.infer<typeof whatsappVerifySchema>
export type WhatsAppMessage = z.infer<typeof whatsappMessageSchema>
export type AdminLogin = z.infer<typeof adminLoginSchema>
export type Tag = z.infer<typeof tagSchema>
export type SendMessage = z.infer<typeof sendMessageSchema>
export type AIConfig = z.infer<typeof aiConfigSchema>
export type LearningFeedback = z.infer<typeof learningFeedbackSchema>
export type ScheduleMessage = z.infer<typeof scheduleMessageSchema>
export type SearchConversations = z.infer<typeof searchConversationsSchema>

export interface ConversationContext {
  userId: string
  conversationId: string
  recentMessages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  userProfile?: {
    name?: string
    language?: string
    preferences?: Record<string, unknown>
  }
}

export interface AIResponse {
  response: string
  intent?: string
  entities?: Record<string, unknown>
  sources?: string[]
}

export interface ProcessMessageInput {
  messageContent: string
  messageType: 'text' | 'audio' | 'image' | 'document' | 'video'
  mediaUrl?: string
  mediaPath?: string
  mediaMimeType?: string
  userId: string
  conversationId: string
  phoneNumber: string
  whatsappId: string
}

export interface ProcessMessageResult {
  success: boolean
  response: string
  audioPath?: string
  audioSent?: boolean
  intent?: string
  entities?: Record<string, unknown>
  error?: string
  details?: {
    transcriptionText?: string
    procesingTime?: number
    aiProvider?: 'perplexity' | 'claude' | 'fallback'
  }
}

export interface ProcessingOptions {
  includeAudio?: boolean
  maxTextLength?: number
  timeout?: number
  fallbackToText?: boolean
}

export interface WhatsAppMessagePayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: 'text' | 'audio' | 'image' | 'video' | 'document' | 'location'
          text?: { body: string }
          audio?: { id: string; mime_type: string; sha256: string }
          image?: { id: string; mime_type: string; sha256: string; caption?: string }
          video?: { id: string; mime_type: string; sha256: string; caption?: string }
          document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string }
          location?: { latitude: number; longitude: number; name?: string; address?: string }
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

export interface WhatsAppProcessResult {
  success: boolean
  message?: string
  type?: string
  error?: string
  details?: {
    userId?: string
    conversationId?: string
    webhookLogId?: string
    processingTime?: number
  }
}

export interface WhatsAppResponseConfig {
  includeAudio?: boolean
  maxTextLength?: number
  respectHours?: boolean
  forceManualMode?: boolean
}

export interface HMACValidationResult {
  valid: boolean
  error?: string
  timestamp?: number
  appId?: string
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  error?: string
}

export interface RateLimitStore {
  key: string
  count: number
  firstRequestTime: number
  lastRequestTime: number
  isBlocked?: boolean
  blockUntil?: number
}
