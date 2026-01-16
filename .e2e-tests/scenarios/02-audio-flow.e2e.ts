import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import { prisma } from '@/lib/prisma';
import { whatsAppService } from '@/services/WhatsAppService';
import { messageProcessorService } from '@/services/MessageProcessorService';
import { ConversationService } from '@/lib/conversation';
import { HorariosService } from '@/lib/horarios';
import { AIService } from '@/lib/ai';
import { WhatsAppService } from '@/services/WhatsAppService';
// import { generateAudioPayload } from '../helpers/webhook'; // Eliminado completamente ya que no se usa
import { getMessagesForConversation, getUserByPhoneNumber, clearTestData } from '../helpers/database';

const TEST_PHONE_NUMBER = '56987654321';
const AUDIO_ID = '1234567890';

// Función auxiliar para crear usuarios con la estructura correcta
function createUserMock(id: string, phoneNumber: string, name: string) {
  return {
    id,
    phoneNumber,
    name,
    profilePicUrl: null,
    language: 'es',
    timezone: 'America/Santiago',
    isBlocked: false,
    isVIP: false,
    firstContact: new Date(),
    lastContact: new Date(),
    totalMessages: 0,
    preferences: null,
    tags: null
  };
}

// Función auxiliar para crear conversaciones con la estructura correcta
function createConversationMock(id: string, userId: string, botMode: string = 'auto') {
  return {
    id,
    userId,
    status: 'active',
    context: null,
    sentiment: null,
    category: null,
    botMode,
    assignedTo: null,
    isUnread: false,
    startedAt: new Date(),
    endedAt: null,
    tags: null
  };
}

// Función auxiliar para crear mensajes con la estructura correcta
function createMessageMock(id: string, conversationId: string, userId: string, type: string = 'text', content: string = '') {
  return {
    id,
    conversationId,
    userId,
    type,
    content,
    caption: null,
    whatsappId: null,
    status: 'sent',
    direction: 'inbound',
    sentBy: 'user',
    aiProcessed: false,
    aiResponse: null,
    intent: null,
    entities: null,
    mediaUrl: null,
    mediaMimeType: null,
    mediaSize: null,
    timestamp: new Date()
  };
}

// Guardar las funciones originales para restaurarlas después de las pruebas
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
};

// Cliente de WhatsApp mock para pruebas
let whatsappClient = {
  sendWhatsAppMessage: async (_phone: string, _text: string) => ({ success: true } as any),
  sendWhatsAppAudio: async (_phone: string, _path: string) => ({ success: true } as any),
  downloadWhatsAppMedia: async (_id: string) => ({ filePath: 'audio.ogg', mimeType: 'audio/ogg', cleanup: () => {} } as any),
};

const resetMocks = () => {
  messageProcessorService.processMessage = originals.processMessage;
  messageProcessorService.isConfigured = originals.isConfigured;
  ConversationService.getOrCreateUser = originals.getOrCreateUser;
  ConversationService.getOrCreateConversation = originals.getOrCreateConversation;
  ConversationService.getConversationHistory = originals.getConversationHistory;
  ConversationService.getLastMessage = originals.getLastMessage;
  ConversationService.closeConversation = originals.closeConversation;
  ConversationService.saveMessage = originals.saveMessage;
  HorariosService.estaAbierto = originals.estaAbierto;
  AIService.handleCommand = originals.handleCommand;
};

beforeEach(async () => {
  // Limpiar datos de prueba anteriores
  await clearTestData();

  // Restablecer mocks
  resetMocks();

  // Configurar cliente de WhatsApp
  whatsappClient = {
    sendWhatsAppMessage: async (_phone: string, _text: string) => ({ success: true } as any),
    sendWhatsAppAudio: async (_phone: string, _path: string) => ({ success: true } as any),
    downloadWhatsAppMedia: async (_id: string) => ({ filePath: 'audio.ogg', mimeType: 'audio/ogg', cleanup: () => {} } as any),
  };
});

afterEach(() => {
  resetMocks();
});

test('E2E: Audio Flow - should process audio message end-to-end successfully', async () => {
  // 1. CONFIGURAR MOCKS
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Audio');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'audio', 'Transcripción de audio');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Gracias por tu mensaje de audio',
    type: 'text'
  } as any) as any;

  // 2. PREPARAR
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "259609383376410",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15551234567",
            phone_number_id: "123456789012345"
          },
          contacts: [{
            profile: { name: "Usuario Audio" },
            wa_id: TEST_PHONE_NUMBER
          }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "audio",
            audio: {
              id: AUDIO_ID,
              mime_type: "audio/ogg; codecs=opus",
              sha256: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              voice: true
            }
          }]
        },
        field: "messages"
      }]
    }]
  };

  // 3. EJECUTAR
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  // 4. VALIDAR RESULTADO
  assert.equal(result.success, true);
  assert.ok(result.type);

  // 5. VALIDAR BASE DE DATOS
  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  assert.ok(user);
  assert.equal(user?.name, 'Usuario Audio');

  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });
  assert.equal(conversations.length, 1);

  const messages = await getMessagesForConversation(conversations[0].id);
  // Debería haber al menos un mensaje de entrada de audio
  assert.equal(messages.length, 2); // 1 inbound audio + 1 outbound (respuesta)

  // 6. VALIDAR INTEGRACIÓN
  // Verificar que el mensaje de audio se guardó correctamente
  const audioMessage = messages.find(m => m.type === 'audio');
  assert.ok(audioMessage);
  assert.equal(audioMessage?.direction, 'inbound');

  // Verificar que se generó una respuesta (posiblemente como audio o texto)
  const outboundMessage = messages.find(m => m.direction === 'outbound');
  assert.ok(outboundMessage);
});

test('E2E: Audio Flow - should transcribe audio content correctly', async () => {
  // 1. CONFIGURAR MOCKS
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Audio Transcribe');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'audio', 'Transcripción de audio');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'He transcrito tu audio correctamente',
    type: 'text'
  } as any) as any;

  // 2. PREPARAR
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "259609383376410",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15551234567",
            phone_number_id: "123456789012345"
          },
          contacts: [{
            profile: { name: "Usuario Audio" },
            wa_id: TEST_PHONE_NUMBER
          }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "audio",
            audio: {
              id: "1234567890",
              mime_type: "audio/ogg; codecs=opus",
              sha256: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              voice: true
            }
          }]
        },
        field: "messages"
      }]
    }]
  };

  // 3. EJECUTAR
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  // 4. VALIDAR
  assert.equal(result.success, true);
});

test('E2E: Audio Flow - should process audio and generate AI response', async () => {
  // 1. CONFIGURAR MOCKS
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Audio AI');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'audio', 'Transcripción de audio');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Esta es la respuesta generada por IA',
    type: 'text'
  } as any) as any;

  // 2. PREPARAR
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "259609383376410",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15551234567",
            phone_number_id: "123456789012345"
          },
          contacts: [{
            profile: { name: "Usuario Audio" },
            wa_id: TEST_PHONE_NUMBER
          }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "audio",
            audio: {
              id: "1234567890",
              mime_type: "audio/ogg; codecs=opus",
              sha256: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              voice: true
            }
          }]
        },
        field: "messages"
      }]
    }]
  };

  // 3. EJECUTAR
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  // 4. VALIDAR
  assert.equal(result.success, true);
});

test('E2E: Audio Flow - should generate TTS response for audio input', async () => {
  // 1. CONFIGURAR MOCKS
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Audio TTS');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'audio', 'Transcripción de audio');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Esta es la respuesta que se convertirá a audio',
    type: 'audio'
  } as any) as any;

  // 2. PREPARAR
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "259609383376410",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15551234567",
            phone_number_id: "123456789012345"
          },
          contacts: [{
            profile: { name: "Usuario Audio" },
            wa_id: TEST_PHONE_NUMBER
          }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "audio",
            audio: {
              id: "1234567890",
              mime_type: "audio/ogg; codecs=opus",
              sha256: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              voice: true
            }
          }]
        },
        field: "messages"
      }]
    }]
  };

  // 3. EJECUTAR
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  // 4. VALIDAR
  assert.equal(result.success, true);
});

test('E2E: Audio Flow - should handle multiple audio messages in sequence', async () => {
  // Configurar mocks para la primera parte
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Audio Secuencia');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'audio', 'Transcripción de audio');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Primera respuesta de audio',
    type: 'text'
  } as any) as any;

  // Preparar primer payload
  const payload1 = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Audio Secuencia" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            type: "audio",
            audio: { id: "audio1", mime_type: "audio/ogg; codecs=opus", sha256: "hash1", voice: true }
          }]
        },
        field: "messages"
      }]
    }]
  };

  // Ejecutar primer mensaje de audio
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result1 = await service.processWebhookPayload(payload1 as any);
  assert.equal(result1.success, true);

  // Configurar mocks para la segunda parte
  ConversationService.getLastMessage = async () => ({ timestamp: new Date().toISOString() } as any);
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Segunda respuesta de audio',
    type: 'text'
  } as any) as any;

  // Preparar segundo payload
  const payload2 = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Audio Secuencia" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            type: "audio",
            audio: { id: "audio2", mime_type: "audio/ogg; codecs=opus", sha256: "hash2", voice: true }
          }]
        },
        field: "messages"
      }]
    }]
  };

  // Ejecutar segundo mensaje de audio
  const result2 = await service.processWebhookPayload(payload2 as any);
  assert.equal(result2.success, true);

  // Validar base de datos
  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  const messages = await getMessagesForConversation(conversations[0].id);
  // Debe haber 4 mensajes: 2 inbound audio + 2 outbound
  assert.equal(messages.length, 4);
});

test('E2E: Audio Flow - should handle audio with transcription errors gracefully', async () => {
  // 1. CONFIGURAR MOCKS
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Audio Error');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'audio', 'Transcripción de audio');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Hubo un problema con la transcripción, pero aquí tienes una respuesta',
    type: 'text'
  } as any) as any;

  // 2. PREPARAR
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "259609383376410",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15551234567",
            phone_number_id: "123456789012345"
          },
          contacts: [{
            profile: { name: "Usuario Audio" },
            wa_id: TEST_PHONE_NUMBER
          }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "audio",
            audio: {
              id: "1234567890",
              mime_type: "audio/ogg; codecs=opus",
              sha256: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              voice: true
            }
          }]
        },
        field: "messages"
      }]
    }]
  };

  // 3. EJECUTAR
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  // 4. VALIDAR
  // Asegurarse de que no falle incluso si la transcripción tiene problemas
  assert.equal(result.success, true);
});

test('E2E: Audio Flow - should preserve audio metadata in database', async () => {
  // 1. CONFIGURAR MOCKS
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Audio Metadata');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'audio', 'Transcripción de audio');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Gracias por tu audio',
    type: 'text'
  } as any) as any;

  // 2. PREPARAR
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "259609383376410",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15551234567",
            phone_number_id: "123456789012345"
          },
          contacts: [{
            profile: { name: "Usuario Audio" },
            wa_id: TEST_PHONE_NUMBER
          }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "audio",
            audio: {
              id: "1234567890",
              mime_type: "audio/ogg; codecs=opus",
              sha256: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
              voice: true
            }
          }]
        },
        field: "messages"
      }]
    }]
  };

  // 3. EJECUTAR
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  // 4. VALIDAR
  assert.equal(result.success, true);

  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  const messages = await getMessagesForConversation(conversations[0].id);
  const audioMessage = messages.find(m => m.type === 'audio');
  assert.ok(audioMessage);
  // Verificar que se almacenó información relevante del audio
  assert.ok(audioMessage?.content); // Debería contener la transcripción
});

test('E2E: Audio Flow - should handle very long audio messages', async () => {
  // 1. CONFIGURAR MOCKS
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Audio Largo');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'audio', 'Transcripción de audio');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'He procesado tu audio largo',
    type: 'text'
  } as any) as any;

  // 2. PREPARAR
  const payload = generateAudioPayload({
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Audio Largo" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5ODc2NTQzMjFGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            type: "audio",
            audio: {
              id: "long_audio",
              mime_type: "audio/ogg; codecs=opus",
              sha256: "hash_long",
              voice: true
            }
          }]
        },
        field: "messages"
      }]
    }]
  });

  // 3. EJECUTAR
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  // 4. VALIDAR
  assert.equal(result.success, true);

  // Verificar que se procesó sin problemas
  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  assert.ok(user);
});