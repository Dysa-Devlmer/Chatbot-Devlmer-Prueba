import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { WhatsAppService } from '../WhatsAppService'
import { messageProcessorService } from '../MessageProcessorService'
import { ConversationService } from '../../lib/conversation'
import { HorariosService } from '../../lib/horarios'
import { AIService } from '../../lib/ai'

const basePayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'entry-1',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '123',
              phone_number_id: '456',
            },
            contacts: [
              {
                profile: { name: 'Juan' },
                wa_id: '56912345678',
              },
            ],
            messages: [
              {
                from: '56912345678',
                id: 'msg-1',
                timestamp: '1700000000',
                type: 'text',
                text: { body: 'Hola' },
              },
            ],
          },
        },
      ],
    },
  ],
}

const originals = {
  processMessage: messageProcessorService.processMessage,
  isConfigured: messageProcessorService.isConfigured,
  getOrCreateUser: ConversationService.getOrCreateUser,
  getOrCreateConversation: ConversationService.getOrCreateConversation,
  getConversationHistory: ConversationService.getConversationHistory,
  getLastMessage: ConversationService.getLastMessage,
  closeConversation: ConversationService.closeConversation,
  saveMessage: ConversationService.saveMessage,
  estaAbierto: HorariosService.estaAbierto,
  handleCommand: AIService.handleCommand,
}

let whatsappClient = {
  sendWhatsAppMessage: async (_phone: string, _text: string) => ({ success: true }),
  sendWhatsAppAudio: async (_phone: string, _path: string) => ({ success: true }),
  downloadWhatsAppMedia: async (_id: string) => ({ filePath: 'audio.ogg', mimeType: 'audio/ogg', cleanup: () => {} }),
}

const resetMocks = () => {
  messageProcessorService.processMessage = originals.processMessage
  messageProcessorService.isConfigured = originals.isConfigured
  ConversationService.getOrCreateUser = originals.getOrCreateUser
  ConversationService.getOrCreateConversation = originals.getOrCreateConversation
  ConversationService.getConversationHistory = originals.getConversationHistory
  ConversationService.getLastMessage = originals.getLastMessage
  ConversationService.closeConversation = originals.closeConversation
  ConversationService.saveMessage = originals.saveMessage
  HorariosService.estaAbierto = originals.estaAbierto
  AIService.handleCommand = originals.handleCommand
}

beforeEach(() => {
  resetMocks()
  whatsappClient = {
    sendWhatsAppMessage: async (_phone: string, _text: string) => ({ success: true }),
    sendWhatsAppAudio: async (_phone: string, _path: string) => ({ success: true }),
    downloadWhatsAppMedia: async (_id: string) => ({ filePath: 'audio.ogg', mimeType: 'audio/ogg', cleanup: () => {} }),
  }
})

afterEach(() => {
  resetMocks()
})

test('processWebhookPayload handles successful flow', async () => {
  ConversationService.getOrCreateUser = async () => ({ id: 'user-1' })
  ConversationService.getOrCreateConversation = async () => ({ id: 'conv-1', userId: 'user-1', botMode: 'auto' })
  ConversationService.getLastMessage = async () => null
  ConversationService.saveMessage = async () => ({ id: 'msg-db' })
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any })
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Respuesta',
  }) as any

  const service = new WhatsAppService(messageProcessorService, whatsappClient)
  const result = await service.processWebhookPayload(basePayload)

  assert.equal(result.success, true)
  assert.equal(result.type, 'text')
})

test('processWebhookPayload handles out of hours', async () => {
  ConversationService.getOrCreateUser = async () => ({ id: 'user-1' })
  ConversationService.getOrCreateConversation = async () => ({ id: 'conv-1', userId: 'user-1', botMode: 'auto' })
  ConversationService.getLastMessage = async () => null
  ConversationService.saveMessage = async () => ({ id: 'msg-db' })
  HorariosService.estaAbierto = () => ({ abierto: false, mensaje: 'cerrado', config: {} as any })

  const service = new WhatsAppService(messageProcessorService, whatsappClient)
  const result = await service.processWebhookPayload(basePayload)

  assert.equal(result.type, 'out_of_hours')
})

test('processWebhookPayload handles manual mode', async () => {
  ConversationService.getOrCreateUser = async () => ({ id: 'user-1' })
  ConversationService.getOrCreateConversation = async () => ({ id: 'conv-1', userId: 'user-1', botMode: 'manual' })
  ConversationService.getLastMessage = async () => null
  ConversationService.saveMessage = async () => ({ id: 'msg-db' })
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any })

  const service = new WhatsAppService(messageProcessorService, whatsappClient)
  const result = await service.processWebhookPayload(basePayload)

  assert.equal(result.type, 'manual_mode')
})

test('processWebhookPayload handles command', async () => {
  const payload = {
    ...basePayload,
    entry: [
      {
        ...basePayload.entry[0],
        changes: [
          {
            ...basePayload.entry[0].changes[0],
            value: {
              ...basePayload.entry[0].changes[0].value,
              messages: [
                {
                  from: '56912345678',
                  id: 'msg-1',
                  timestamp: '1700000000',
                  type: 'text',
                  text: { body: '/help' },
                },
              ],
            },
          },
        ],
      },
    ],
  }

  ConversationService.getOrCreateUser = async () => ({ id: 'user-1' })
  ConversationService.getOrCreateConversation = async () => ({ id: 'conv-1', userId: 'user-1', botMode: 'auto' })
  ConversationService.getLastMessage = async () => null
  ConversationService.saveMessage = async () => ({ id: 'msg-db' })
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any })
  AIService.handleCommand = async () => 'Respuesta comando'

  const service = new WhatsAppService(messageProcessorService, whatsappClient)
  const result = await service.processWebhookPayload(payload as any)

  assert.equal(result.type, 'text')
  assert.equal(result.message, 'Respuesta comando')
})

test('processWebhookPayload handles session timeout', async () => {
  ConversationService.getOrCreateUser = async () => ({ id: 'user-1' })
  ConversationService.getOrCreateConversation = async () => ({ id: 'conv-1', userId: 'user-1', botMode: 'auto' })
  ConversationService.getLastMessage = async () => ({ timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() })
  ConversationService.closeConversation = async () => ({ id: 'conv-1' })
  ConversationService.getOrCreateConversation = async () => ({ id: 'conv-2', userId: 'user-1', botMode: 'auto' })
  ConversationService.saveMessage = async () => ({ id: 'msg-db' })
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any })
  messageProcessorService.processMessage = async () => ({ success: true, response: 'Respuesta' }) as any

  const service = new WhatsAppService(messageProcessorService, whatsappClient)
  const result = await service.processWebhookPayload(basePayload)

  assert.equal(result.success, true)
})

test('processWebhookPayload handles duplicate webhook', async () => {
  ConversationService.getOrCreateUser = async () => ({ id: 'user-1' })
  ConversationService.getOrCreateConversation = async () => ({ id: 'conv-1', userId: 'user-1', botMode: 'auto' })
  ConversationService.getLastMessage = async () => null
  ConversationService.saveMessage = async () => null
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any })

  const service = new WhatsAppService(messageProcessorService, whatsappClient)
  const result = await service.processWebhookPayload(basePayload)

  assert.equal(result.type, 'duplicate')
})

test('processWebhookPayload handles status update', async () => {
  const payload = {
    ...basePayload,
    entry: [
      {
        ...basePayload.entry[0],
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '123',
                phone_number_id: '456',
              },
              statuses: [
                {
                  id: 'status-1',
                  status: 'read',
                  timestamp: '1700000000',
                  recipient_id: '56912345678',
                },
              ],
            },
          },
        ],
      },
    ],
  }

  const service = new WhatsAppService(messageProcessorService, whatsappClient)
  const result = await service.processWebhookPayload(payload as any)

  assert.equal(result.type, 'status_update')
})

test('extractMessageContent handles text', () => {
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = service.extractMessageContent({ type: 'text', text: { body: 'Hola' } })
  assert.equal(result.content, 'Hola')
})

test('extractMessageContent handles audio', () => {
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = service.extractMessageContent({ type: 'audio', audio: { id: '1', mime_type: 'audio/ogg' } })
  assert.equal(result.type, 'audio')
})

test('extractMessageContent handles image caption', () => {
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = service.extractMessageContent({ type: 'image', image: { id: '1', mime_type: 'image/png', caption: 'hola' } })
  assert.equal(result.content, 'hola')
})

test('validateWebhookPayload accepts valid payload', () => {
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = service.validateWebhookPayload(basePayload)
  assert.equal(result.valid, true)
  assert.equal(result.type, 'message')
})

test('validateWebhookPayload rejects invalid payload', () => {
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = service.validateWebhookPayload({ object: '', entry: [] })
  assert.equal(result.valid, false)
})

test('checkBusinessHours handles open', () => {
  HorariosService.estaAbierto = () => ({ abierto: true, mensaje: undefined, config: {} as any })
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = service.checkBusinessHours()
  assert.equal(result.isOpen, true)
})

test('checkBusinessHours handles closed', () => {
  HorariosService.estaAbierto = () => ({ abierto: false, mensaje: 'cerrado', config: {} as any })
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = service.checkBusinessHours()
  assert.equal(result.isOpen, false)
  assert.equal(result.message, 'cerrado')
})

test('handleCommand returns handled when command exists', async () => {
  AIService.handleCommand = async () => 'respuesta'
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = await service.handleCommand('/help', 'user-1')
  assert.equal(result.handled, true)
})

test('handleCommand ignores non-command', async () => {
  const service = new WhatsAppService(messageProcessorService, whatsappClient) as any
  const result = await service.handleCommand('hola', 'user-1')
  assert.equal(result.handled, false)
})
