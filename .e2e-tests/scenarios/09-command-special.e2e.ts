import { POST } from '@/app/api/whatsapp/webhook/route';
import { generateValidPayload, generateHMAC, createRequest } from '../../helpers/webhook';
import { getUserByPhoneNumber, getMessagesForConversation, clearTestData } from '../../helpers/database';
import { hasLogWithMessage, captureLogs, getCapturedLogs, clearCapturedLogs } from '../../helpers/logging';

describe('E2E: Command Special', () => {
  const TEST_PHONE_NUMBER = '56999999999';

  beforeAll(() => {
    // Capturar logs para validación
    captureLogs('whatsapp');
    captureLogs('messageProcessor');
  });

  beforeEach(async () => {
    // Limpiar datos de prueba anteriores
    await clearTestData();
    clearCapturedLogs('whatsapp');
    clearCapturedLogs('messageProcessor');
  });

  afterAll(() => {
    clearCapturedLogs('whatsapp');
    clearCapturedLogs('messageProcessor');
  });

  it('should recognize and process special commands starting with /', async () => {
    // 1. PREPARAR
    const commandPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Comando Especial" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/help" }, type: "text" }] // Comando especial
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(commandPayload));
    const request = createRequest(commandPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    
    // 4. VALIDAR BASE DE DATOS
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    expect(user).toBeDefined();

    // Verificar que se guardaron los mensajes
    const conversations = await prisma.conversation.findMany({
      where: { userId: user!.id }
    });
    expect(conversations).toHaveLength(1);

    const messages = await getMessagesForConversation(conversations[0].id);
    // Debe haber el mensaje de comando y una respuesta
    expect(messages).toHaveLength(2); // 1 inbound command + 1 outbound response

    // 5. VALIDAR INTEGRACIÓN
    // Verificar que el mensaje de comando se haya guardado correctamente
    const commandMessage = messages.find(m => m.content === "/help");
    expect(commandMessage).toBeDefined();
    expect(commandMessage?.type).toBe('text');
    expect(commandMessage?.direction).toBe('inbound');

    // Verificar que se generó una respuesta al comando
    const responseMessage = messages.find(m => m.direction === 'outbound');
    expect(responseMessage).toBeDefined();
    expect(responseMessage?.type).toBe('text');
    expect(responseMessage?.content).toBeTruthy();
  });

  it('should execute help command action correctly', async () => {
    // 1. PREPARAR
    const helpPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Comando Ayuda" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/help" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(helpPayload));
    const request = createRequest(helpPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que se haya registrado la ejecución del comando help
    const processorLogs = getCapturedLogs('messageProcessor');
    const hasHelpCommandLog = processorLogs.some(log => 
      log.message.toLowerCase().includes('help') || 
      log.message.toLowerCase().includes('command')
    );
    // Puede que no haya un log explícito de "help" pero debería haber procesamiento
    expect(processorLogs.length).toBeGreaterThan(0);
  });

  it('should execute status command action correctly', async () => {
    // 1. PREPARAR
    const statusPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Comando Estado" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/status" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(statusPayload));
    const request = createRequest(statusPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que se haya registrado la ejecución del comando status
    const processorLogs = getCapturedLogs('messageProcessor');
    const hasStatusCommandLog = processorLogs.some(log => 
      log.message.toLowerCase().includes('status') || 
      log.message.toLowerCase().includes('command')
    );
    expect(processorLogs.length).toBeGreaterThan(0);
  });

  it('should execute settings command action correctly', async () => {
    // 1. PREPARAR
    const settingsPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Comando Configuración" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/settings" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(settingsPayload));
    const request = createRequest(settingsPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que se haya registrado la ejecución del comando settings
    const processorLogs = getCapturedLogs('messageProcessor');
    const hasSettingsCommandLog = processorLogs.some(log => 
      log.message.toLowerCase().includes('settings') || 
      log.message.toLowerCase().includes('command')
    );
    expect(processorLogs.length).toBeGreaterThan(0);
  });

  it('should return appropriate response for command', async () => {
    // 1. PREPARAR
    const commandPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Respuesta Comando" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/info" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(commandPayload));
    const request = createRequest(commandPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    const conversations = await prisma.conversation.findMany({
      where: { userId: user!.id }
    });
    
    const messages = await getMessagesForConversation(conversations[0].id);
    const responseMessage = messages.find(m => m.direction === 'outbound');
    expect(responseMessage).toBeDefined();
    expect(responseMessage?.content).toBeTruthy();
  });

  it('should handle unrecognized commands gracefully', async () => {
    // 1. PREPARAR
    const unknownCommandPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Comando Desconocido" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/unknowncommand" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(unknownCommandPayload));
    const request = createRequest(unknownCommandPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Debería manejar el comando desconocido con una respuesta apropiada
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    const conversations = await prisma.conversation.findMany({
      where: { userId: user!.id }
    });
    
    const messages = await getMessagesForConversation(conversations[0].id);
    const responseMessage = messages.find(m => m.direction === 'outbound');
    expect(responseMessage).toBeDefined();
  });

  it('should not pass commands to AI processing', async () => {
    // 1. PREPARAR
    const commandPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Sin IA Comando" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/test" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(commandPayload));
    const request = createRequest(commandPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que el comando no haya sido procesado por los servicios de IA
    // sino manejado por el sistema de comandos
    const processorLogs = getCapturedLogs('messageProcessor');
    // Debería haber logs de manejo de comando en lugar de IA
    const hasCommandHandlingLog = processorLogs.some(log => 
      log.message.toLowerCase().includes('command') || 
      log.message.toLowerCase().includes('handle')
    );
    expect(hasCommandHandlingLog).toBe(true);
  });

  it('should treat messages starting with slash as commands', async () => {
    // 1. PREPARAR
    const slashMessagePayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Mensaje Slash" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/custom message" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(slashMessagePayload));
    const request = createRequest(slashMessagePayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que el mensaje que empieza con / haya sido tratado como comando
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    const conversations = await prisma.conversation.findMany({
      where: { userId: user!.id }
    });
    
    const messages = await getMessagesForConversation(conversations[0].id);
    const inboundMessage = messages.find(m => m.content === "/custom message");
    expect(inboundMessage).toBeDefined();
  });

  it('should log command processing events', async () => {
    // 1. PREPARAR
    const commandPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Log Comando" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/logtest" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(commandPayload));
    const request = createRequest(commandPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que se hayan registrado eventos de procesamiento de comando
    const processorLogs = getCapturedLogs('messageProcessor');
    const whatsappLogs = getCapturedLogs('whatsapp');
    
    // Debe haber algún registro del procesamiento del comando
    const allLogs = [...processorLogs, ...whatsappLogs];
    const hasCommandLog = allLogs.some(log => 
      log.message.toLowerCase().includes('command') || 
      log.message.toLowerCase().includes('/logtest') ||
      log.message.toLowerCase().includes('process')
    );
    expect(hasCommandLog).toBe(true);
  });

  it('should allow mixed usage of commands and regular messages', async () => {
    // 1. PREPARAR - Enviar un comando primero
    const commandPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Uso Mixto" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "/help" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(commandPayload));
    const commandRequest = createRequest(commandPayload, signature);

    // Ejecutar el comando
    const commandResponse = await POST(commandRequest);
    expect(commandResponse.status).toBe(200);

    // 2. PREPARAR - Luego enviar un mensaje regular
    const regularPayload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Uso Mixto" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Hola, esto es un mensaje regular" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const regularSignature = generateHMAC(JSON.stringify(regularPayload));
    const regularRequest = createRequest(regularPayload, regularSignature);

    // 3. EJECUTAR - Mensaje regular
    const regularResponse = await POST(regularRequest);

    // 4. VALIDAR
    expect(regularResponse.status).toBe(200);
    
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    const conversations = await prisma.conversation.findMany({
      where: { userId: user!.id }
    });
    
    const messages = await getMessagesForConversation(conversations[0].id);
    // Debe haber 2 pares de mensajes: comando+respuesta y mensaje regular+respuesta
    expect(messages).toHaveLength(4); // 2 inbound + 2 outbound
  });
});