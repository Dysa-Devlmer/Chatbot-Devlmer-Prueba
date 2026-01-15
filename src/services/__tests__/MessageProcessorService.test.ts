import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { MessageProcessorService } from '../MessageProcessorService'
import { perplexityService } from '../PerplexityService'
import { AIService } from '../../lib/ai'
import { ConversationService } from '../../lib/conversation'

const baseInput = {
  messageContent: 'Hola',
  messageType: 'text' as const,
  userId: 'user-1',
  conversationId: 'conv-1',
  phoneNumber: '+56912345678',
  whatsappId: 'wa-1',
}

const originals = {
  generateResponse: perplexityService.generateResponse,
  transcribeAudio: AIService.transcribeAudio,
  textToSpeech: AIService.textToSpeech,
  getConversationHistory: ConversationService.getConversationHistory,
  checkWhisperStatus: AIService.checkWhisperStatus,
  checkTTSStatus: AIService.checkTTSStatus,
  isConfigured: perplexityService.isConfigured,
}

let service: MessageProcessorService
let mockWhatsapp = {
  downloadWhatsAppMedia: async (_mediaId: string) => ({
    filePath: 'audio.ogg',
    mimeType: 'audio/ogg',
    cleanup: () => {},
  }),
  sendWhatsAppAudio: async (_phone: string, _path: string) => ({
    success: true,
  }),
}

const resetMocks = () => {
  perplexityService.generateResponse = originals.generateResponse
  AIService.transcribeAudio = originals.transcribeAudio
  AIService.textToSpeech = originals.textToSpeech
  ConversationService.getConversationHistory = originals.getConversationHistory
  AIService.checkWhisperStatus = originals.checkWhisperStatus
  AIService.checkTTSStatus = originals.checkTTSStatus
  perplexityService.isConfigured = originals.isConfigured
}

const getValidator = () =>
  service as unknown as {
    validateInput: (input: typeof baseInput) => { valid: boolean; error?: string }
  }

beforeEach(() => {
  resetMocks()
  mockWhatsapp = {
    downloadWhatsAppMedia: async (_mediaId: string) => ({
      filePath: 'audio.ogg',
      mimeType: 'audio/ogg',
      cleanup: () => {},
    }),
    sendWhatsAppAudio: async (_phone: string, _path: string) => ({
      success: true,
    }),
  }
  service = new MessageProcessorService(mockWhatsapp)
})

afterEach(() => {
  resetMocks()
})

test('processMessage handles text message successfully', async () => {
  perplexityService.generateResponse = async () => ({
    response: 'Respuesta',
    intent: 'saludo',
    entities: { foo: 'bar' },
  })
  ConversationService.getConversationHistory = async () => []

  const result = await service.processMessage(baseInput)

  assert.equal(result.success, true)
  assert.equal(result.response, 'Respuesta')
  assert.equal(result.intent, 'saludo')
})

test('processMessage handles audio with transcription and audio response', async () => {
  const audioInput = {
    ...baseInput,
    messageType: 'audio' as const,
    mediaUrl: 'media-123',
    mediaMimeType: 'audio/ogg',
  }

  AIService.transcribeAudio = async () => ({
    success: true,
    text: 'Texto transcrito',
  })
  ConversationService.getConversationHistory = async () => []
  perplexityService.generateResponse = async () => ({
    response: 'Respuesta audio',
  })
  AIService.textToSpeech = async () => ({
    success: true,
    audioPath: 'audio.mp3',
    cleanup: () => {},
  })

  const result = await service.processMessage(audioInput)

  assert.equal(result.success, true)
  assert.equal(result.audioPath, 'audio.mp3')
  assert.equal(result.audioSent, true)
})

test('processMessage marks audioSent false when send fails', async () => {
  const audioInput = {
    ...baseInput,
    messageType: 'audio' as const,
    mediaUrl: 'media-123',
    mediaMimeType: 'audio/ogg',
  }

  AIService.transcribeAudio = async () => ({
    success: true,
    text: 'Texto transcrito',
  })
  ConversationService.getConversationHistory = async () => []
  perplexityService.generateResponse = async () => ({
    response: 'Respuesta audio',
  })
  AIService.textToSpeech = async () => ({
    success: true,
    audioPath: 'audio.mp3',
    cleanup: () => {},
  })
  mockWhatsapp.sendWhatsAppAudio = async () => ({
    success: false,
    error: 'send fail',
  })

  service = new MessageProcessorService(mockWhatsapp)

  const result = await service.processMessage(audioInput)

  assert.equal(result.success, true)
  assert.equal(result.audioSent, false)
})

test('processMessage handles local mediaPath transcription', async () => {
  const audioInput = {
    ...baseInput,
    messageType: 'audio' as const,
    mediaPath: 'local.ogg',
  }

  AIService.transcribeAudio = async () => ({
    success: true,
    text: 'Texto transcrito',
  })
  ConversationService.getConversationHistory = async () => []
  perplexityService.generateResponse = async () => ({
    response: 'Respuesta audio',
  })

  const result = await service.processMessage(audioInput, {
    includeAudio: false,
  })

  assert.equal(result.success, true)
  assert.equal(result.response, 'Respuesta audio')
})

test('processMessage returns error when transcription fails', async () => {
  const audioInput = {
    ...baseInput,
    messageType: 'audio' as const,
    mediaUrl: 'media-123',
    mediaMimeType: 'audio/ogg',
  }

  AIService.transcribeAudio = async () => ({
    success: false,
    text: '',
    error: 'fail',
  })

  const result = await service.processMessage(audioInput)

  assert.equal(result.success, false)
  assert.equal(result.error, 'fail')
})

test('processMessage returns error when mediaUrl is missing', async () => {
  const audioInput = {
    ...baseInput,
    messageType: 'audio' as const,
    mediaUrl: undefined,
  }

  const result = await service.processMessage(audioInput)

  assert.equal(result.success, false)
  assert.equal(result.error, 'mediaUrl o mediaPath requerido para audio')
})

test('processMessage handles AI timeout', async () => {
  perplexityService.generateResponse = async () => new Promise(() => {})
  ConversationService.getConversationHistory = async () => []

  const result = await service.processMessage(baseInput, {
    timeout: 10,
  })

  assert.equal(result.success, false)
  assert.equal(result.error, 'Tiempo de espera agotado al procesar con IA')
})

test('processMessage falls back to text when TTS fails', async () => {
  const audioInput = {
    ...baseInput,
    messageType: 'audio' as const,
    mediaUrl: 'media-123',
    mediaMimeType: 'audio/ogg',
  }

  AIService.transcribeAudio = async () => ({
    success: true,
    text: 'Texto transcrito',
  })
  ConversationService.getConversationHistory = async () => []
  perplexityService.generateResponse = async () => ({
    response: 'Respuesta audio',
  })
  AIService.textToSpeech = async () => ({
    success: false,
    audioPath: '',
    error: 'tts fail',
    cleanup: () => {},
  })

  const result = await service.processMessage(audioInput, {
    includeAudio: true,
    fallbackToText: true,
  })

  assert.equal(result.success, true)
  assert.equal(result.audioSent, false)
})

test('processMessage fails when TTS fails and fallback disabled', async () => {
  const audioInput = {
    ...baseInput,
    messageType: 'audio' as const,
    mediaUrl: 'media-123',
    mediaMimeType: 'audio/ogg',
  }

  AIService.transcribeAudio = async () => ({
    success: true,
    text: 'Texto transcrito',
  })
  ConversationService.getConversationHistory = async () => []
  perplexityService.generateResponse = async () => ({
    response: 'Respuesta audio',
  })
  AIService.textToSpeech = async () => ({
    success: false,
    audioPath: '',
    error: 'tts fail',
    cleanup: () => {},
  })

  const result = await service.processMessage(audioInput, {
    includeAudio: true,
    fallbackToText: false,
  })

  assert.equal(result.success, false)
  assert.equal(result.error, 'tts fail')
})

test('validateInput rejects invalid phone number', () => {
  const invalid = { ...baseInput, phoneNumber: '123' }

  const result = getValidator().validateInput(invalid)

  assert.equal(result.valid, false)
})

test('validateInput rejects invalid message type', () => {
  const invalid = { ...baseInput, messageType: 'invalid' as 'text' }

  const result = getValidator().validateInput(invalid)

  assert.equal(result.valid, false)
})

test('validateInput rejects missing whatsappId', () => {
  const invalid = { ...baseInput, whatsappId: '' }

  const result = getValidator().validateInput(invalid)

  assert.equal(result.valid, false)
})

test('processMessage returns fallback on AI error', async () => {
  perplexityService.generateResponse = async () => {
    throw new Error('ai fail')
  }
  ConversationService.getConversationHistory = async () => []

  const result = await service.processMessage(baseInput)

  assert.equal(result.success, false)
  assert.equal(result.response, 'Lo siento, tuve un problema procesando tu mensaje.')
})
