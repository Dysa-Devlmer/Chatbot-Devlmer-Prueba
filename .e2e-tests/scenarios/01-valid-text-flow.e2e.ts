import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import { prisma } from '@/lib/prisma';
import { whatsAppService } from '@/services/WhatsAppService';
import { messageProcessorService } from '@/services/MessageProcessorService';
import { ConversationService } from '@/lib/conversation';
import { HorariosService } from '@/lib/horarios';
import { AIService } from '@/lib/ai';
import { WhatsAppService } from '@/services/WhatsAppService';
import { generateValidPayload } from '../helpers/webhook';
import { getMessagesForConversation, getUserByPhoneNumber, clearTestData } from '../helpers/database';

const TEST_PHONE_NUMBER = '56912345678';
const TEST_MESSAGE = '¿Cuál es el clima hoy?';

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

test('E2E: Valid Text Flow - should process text message end-to-end successfully', async () => {
  // 1. CONFIGURAR MOCKS
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario de Prueba');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Esta es una respuesta de prueba',
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
            profile: { name: "Usuario de Prueba" },
            wa_id: TEST_PHONE_NUMBER
          }],
          messages: [{
            from: TEST_PHONE_NUMBER,
            id: "wamid.HBgNNTY5MTIzNDU2NzhGAAhEVElLRU5fQUNDRVNTX1RPS0VOAA==",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            text: { body: TEST_MESSAGE },
            type: "text"
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
  assert.equal(result.type, 'text');
  assert.ok(result.message);

  // 5. VALIDAR BASE DE DATOS
  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  assert.ok(user);
  assert.equal(user?.name, 'Usuario de Prueba');

  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });
  assert.equal(conversations.length, 1);

  const messages = await getMessagesForConversation(conversations[0].id);
  assert.equal(messages.length, 2); // 1 inbound + 1 outbound
});

test('E2E: Valid Text Flow - should handle multiple text messages in sequence', async () => {
  // Configurar mocks para la primera parte
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Secuencia');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Respuesta de prueba',
    type: 'text'
  } as any) as any;

  // Preparar primer payload
  const payload1 = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Secuencia" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Hola" }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  // Ejecutar primer mensaje
  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result1 = await service.processWebhookPayload(payload1 as any);
  assert.equal(result1.success, true);

  // Configurar mocks para la segunda parte
  ConversationService.getLastMessage = async () => ({ timestamp: new Date().toISOString() } as any);
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: '¿Cómo estás?',
    type: 'text'
  } as any) as any;

  // Preparar segundo payload
  const payload2 = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Secuencia" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: "¿Cómo estás?" }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  // Ejecutar segundo mensaje
  const result2 = await service.processWebhookPayload(payload2 as any);
  assert.equal(result2.success, true);

  // Validar base de datos
  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  const messages = await getMessagesForConversation(conversations[0].id);
  // Debe haber 4 mensajes: 2 inbound + 2 outbound
  assert.equal(messages.length, 4);
});

test('E2E: Valid Text Flow - should handle special characters in text messages', async () => {
  // Configurar mocks
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Especial');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Gracias por tu mensaje con caracteres especiales',
    type: 'text'
  } as any) as any;

  const specialMessage = "Hola! ¿Cómo estás? Me gusta el café ☕ y el código 💻";
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Especial" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: specialMessage }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  assert.equal(result.success, true);

  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  const messages = await getMessagesForConversation(conversations[0].id);
  const inboundMessage = messages.find(m => m.content === specialMessage);
  assert.ok(inboundMessage);
});

test('E2E: Valid Text Flow - should handle very long text messages', async () => {
  // Configurar mocks
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Largo');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'He recibido tu mensaje largo',
    type: 'text'
  } as any) as any;

  const longMessage = "Este es un mensaje muy largo ".repeat(100) + " para probar la capacidad del sistema para manejar entradas extensas.";
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Largo" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: longMessage }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  assert.equal(result.success, true);

  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  const messages = await getMessagesForConversation(conversations[0].id);
  const inboundMessage = messages.find(m => m.content === longMessage);
  assert.ok(inboundMessage);
});

test('E2E: Valid Text Flow - should maintain conversation context across messages', async () => {
  // Configurar mocks para primer mensaje
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Contexto');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Gracias Juan, es un placer conocerte',
    type: 'text'
  } as any) as any;

  // Primer mensaje
  const payload1 = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Contexto" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mi nombre es Juan" }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result1 = await service.processWebhookPayload(payload1 as any);
  assert.equal(result1.success, true);

  // Configurar mocks para segundo mensaje
  ConversationService.getLastMessage = async () => ({ timestamp: new Date().toISOString(), content: "Mi nombre es Juan" } as any);
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Sí, recuerdo que tu nombre es Juan',
    type: 'text'
  } as any) as any;

  // Segundo mensaje
  const payload2 = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Contexto" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: "¿Recuerdas mi nombre?" }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const result2 = await service.processWebhookPayload(payload2 as any);
  assert.equal(result2.success, true);

  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  assert.equal(conversations.length, 1);
  const messages = await getMessagesForConversation(conversations[0].id);
  assert.equal(messages.length, 4); // 2 inbound + 2 outbound
});

test('E2E: Valid Text Flow - should handle empty text messages gracefully', async () => {
  // Configurar mocks
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Vacío');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'He recibido tu mensaje',
    type: 'text'
  } as any) as any;

  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Vacío" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: "" }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  // Aunque el mensaje esté vacío, debería procesarse sin error
  assert.equal(result.success, true);
});

test('E2E: Valid Text Flow - should handle text messages with only spaces', async () => {
  // Configurar mocks
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Espacios');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'He recibido tu mensaje',
    type: 'text'
  } as any) as any;

  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Espacios" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: "   " }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  assert.equal(result.success, true);
});

test('E2E: Valid Text Flow - should process messages with special commands', async () => {
  // Configurar mocks para comando
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Comando');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  AIService.handleCommand = async () => 'Aquí tienes ayuda sobre cómo usar el bot';

  const commandMessage = "/help";
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Comando" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: commandMessage }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  assert.equal(result.success, true);

  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  const messages = await getMessagesForConversation(conversations[0].id);
  const inboundMessage = messages.find(m => m.content === commandMessage);
  assert.ok(inboundMessage);
});

test('E2E: Valid Text Flow - should handle messages with emojis and unicode characters', async () => {
  // Configurar mocks
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario Emoji');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Hola! Gracias por tu mensaje con emojis',
    type: 'text'
  } as any) as any;

  const emojiMessage = "Hola 👋 ¿Cómo estás? 😊 Me gusta el café ☕ y el té 🫖";
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario Emoji" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: emojiMessage }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  assert.equal(result.success, true);

  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  const messages = await getMessagesForConversation(conversations[0].id);
  const inboundMessage = messages.find(m => m.content === emojiMessage);
  assert.ok(inboundMessage);
});

test('E2E: Valid Text Flow - should handle messages with URLs and email addresses', async () => {
  // Configurar mocks
  ConversationService.getOrCreateUser = async () => createUserMock('user-1', TEST_PHONE_NUMBER, 'Usuario URL');
  ConversationService.getOrCreateConversation = async () => createConversationMock('conv-1', 'user-1', 'auto');
  ConversationService.getLastMessage = async () => null;
  ConversationService.saveMessage = async () => createMessageMock('msg-db', 'conv-1', 'user-1', 'text', 'Mensaje de prueba');
  HorariosService.estaAbierto = () => ({ abierto: true, config: {} as any });
  messageProcessorService.processMessage = async () => ({
    success: true,
    response: 'Gracias por compartir ese enlace',
    type: 'text'
  } as any) as any;

  const messageWithUrl = "Visita nuestro sitio web en https://example.com o contáctanos en info@example.com";
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        value: {
          contacts: [{ profile: { name: "Usuario URL" }, wa_id: TEST_PHONE_NUMBER }],
          messages: [{ from: TEST_PHONE_NUMBER, text: { body: messageWithUrl }, type: "text" }]
        },
        field: "messages"
      }]
    }]
  };

  const service = new WhatsAppService(messageProcessorService, whatsappClient);
  const result = await service.processWebhookPayload(payload as any);

  assert.equal(result.success, true);

  const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
  const conversations = await prisma.conversation.findMany({
    where: { userId: user!.id }
  });

  const messages = await getMessagesForConversation(conversations[0].id);
  const inboundMessage = messages.find(m => m.content === messageWithUrl);
  assert.ok(inboundMessage);
});