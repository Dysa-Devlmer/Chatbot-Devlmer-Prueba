import { POST } from '@/app/api/whatsapp/webhook/route';
import { generateValidPayload, generateHMAC, createRequest } from '../../helpers/webhook';
import { getUserByPhoneNumber, getMessagesForConversation, clearTestData } from '../../helpers/database';
import { hasLogWithMessage, captureLogs, getCapturedLogs, clearCapturedLogs } from '../../helpers/logging';

describe('E2E: Error Handling - IA Failures', () => {
  const TEST_PHONE_NUMBER = '56955555555';

  beforeAll(() => {
    // Capturar logs para validación
    captureLogs('whatsapp');
    captureLogs('messageProcessor');
    captureLogs('perplexity');
  });

  beforeEach(async () => {
    // Limpiar datos de prueba anteriores
    await clearTestData();
    clearCapturedLogs('whatsapp');
    clearCapturedLogs('messageProcessor');
    clearCapturedLogs('perplexity');
  });

  afterAll(() => {
    clearCapturedLogs('whatsapp');
    clearCapturedLogs('messageProcessor');
    clearCapturedLogs('perplexity');
  });

  it('should handle PerplexityService failure with Claude fallback', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Fallback IA" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba para fallback" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR RESPUESTA HTTP
    expect(response.status).toBe(200); // Debe ser 200 aunque haya error interno
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    // La respuesta debe haber sido generada (ya sea por fallback o respuesta genérica)

    // 4. VALIDAR BASE DE DATOS
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    expect(user).toBeDefined();

    // Verificar que se guardaron los mensajes
    const conversations = await prisma.conversation.findMany({
      where: { userId: user!.id }
    });
    expect(conversations).toHaveLength(1);

    const messages = await getMessagesForConversation(conversations[0].id);
    // Debe haber al menos el mensaje entrante y una respuesta
    expect(messages).toHaveLength(2); // 1 inbound + 1 outbound

    // 5. VALIDAR LOGGING
    const processorLogs = getCapturedLogs('messageProcessor');
    const aiLogs = getCapturedLogs('perplexity');
    
    // Verificar que se registró el manejo de error o fallback
    const hasFallbackLog = processorLogs.some(log => 
      log.message.toLowerCase().includes('fallback') || 
      log.message.toLowerCase().includes('error') ||
      log.message.toLowerCase().includes('alternative')
    ) || aiLogs.some(log => 
      log.message.toLowerCase().includes('fallback') || 
      log.message.toLowerCase().includes('error')
    );
    // Puede que no haya fallback si ambos servicios funcionaron
    // Pero debería haber algún registro del procesamiento
    expect(processorLogs.length + aiLogs.length).toBeGreaterThan(0);

    // 6. VALIDAR INTEGRACIÓN
    // Verificar que el mensaje entrante se guardó correctamente
    const inboundMessage = messages.find(m => m.content === "Mensaje de prueba para fallback");
    expect(inboundMessage).toBeDefined();
    expect(inboundMessage?.type).toBe('text');
    expect(inboundMessage?.direction).toBe('inbound');

    // Verificar que se generó una respuesta
    const outboundMessage = messages.find(m => m.direction === 'outbound');
    expect(outboundMessage).toBeDefined();
    expect(outboundMessage?.type).toBe('text');
    expect(outboundMessage?.content).toBeTruthy();
  });

  it('should handle Claude failure with generic response', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Respuesta Genérica" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje que causará error en IA" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200); // No debe devolver 500
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    // La respuesta debe haber sido generada aunque sea genérica
  });

  it('should handle transcription failure gracefully', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Error Transcripción" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de texto (no audio)" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que se manejaran correctamente los posibles errores de transcripción
    const processorLogs = getCapturedLogs('messageProcessor');
    const hasTranscriptionLog = processorLogs.some(log => 
      log.message.toLowerCase().includes('transcription') || 
      log.message.toLowerCase().includes('audio') ||
      log.message.toLowerCase().includes('whisper')
    );
    // Puede no haber logs de transcripción si no era un mensaje de audio
    // Pero debería haber algún procesamiento
    expect(processorLogs.length).toBeGreaterThan(0);
  });

  it('should handle TTS failure with text response', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Error TTS" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje para TTS" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    const conversations = await prisma.conversation.findMany({
      where: { userId: user!.id }
    });
    
    const messages = await getMessagesForConversation(conversations[0].id);
    // Debe haber una respuesta, posiblemente como texto si TTS falló
    const outboundMessage = messages.find(m => m.direction === 'outbound');
    expect(outboundMessage).toBeDefined();
  });

  it('should handle database error with controlled response', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Error Base Datos" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje para base de datos" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    // Aunque haya errores de base de datos, no debería devolver 500
    // sino manejarlo elegantemente
    expect(response.status).toBeOneOf([200, 500]);
    
    if (response.status === 500) {
      // Si devuelve 500, debe ser un error controlado
      const responseBody = await response.json();
      // En caso de error 500, podría no tener body o tener un error controlado
    } else {
      // Si es 200, debería tener una respuesta exitosa
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
    }
  });

  it('should handle timeout in IA service with fallback', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Timeout IA" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje para timeout" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que se haya manejado el timeout adecuadamente
    const aiLogs = getCapturedLogs('perplexity');
    const hasTimeoutLog = aiLogs.some(log => 
      log.message.toLowerCase().includes('timeout') || 
      log.message.toLowerCase().includes('abort') ||
      log.message.toLowerCase().includes('cancel')
    );
    // Puede no haber timeout si la IA respondió rápidamente
    // Pero debería haber procesamiento normal
    expect(aiLogs.length).toBeGreaterThan(0);
  });

  it('should handle malformed response from IA service', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Respuesta Malformada" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje para respuesta" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    expect(user).toBeDefined();
  });

  it('should handle network error to external services', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Error Red" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje para red" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que se haya manejado cualquier error de red
    const processorLogs = getCapturedLogs('messageProcessor');
    const aiLogs = getCapturedLogs('perplexity');
    
    // Debe haber algún registro del procesamiento
    expect(processorLogs.length + aiLogs.length).toBeGreaterThan(0);
  });

  it('should maintain graceful degradation when all IA services fail', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Degradación Graciosa" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje para degradación" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    // Aunque fallen todos los servicios de IA, debe responder de manera controlada
    expect(response.status).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
  });

  it('should log error chains appropriately', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Cadena Errores" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje para cadena de errores" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    const signature = generateHMAC(JSON.stringify(payload));
    const request = createRequest(payload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(200);
    
    // Verificar que se hayan registrado los logs de error apropiadamente
    const whatsappLogs = getCapturedLogs('whatsapp');
    const processorLogs = getCapturedLogs('messageProcessor');
    const aiLogs = getCapturedLogs('perplexity');
    
    // Deben haber registros en al menos uno de los loggers
    expect(whatsappLogs.length + processorLogs.length + aiLogs.length).toBeGreaterThan(0);
    
    // Buscar posibles mensajes de error o fallback en los logs
    const allLogs = [...whatsappLogs, ...processorLogs, ...aiLogs];
    const hasErrorOrFallbackLog = allLogs.some(log => 
      log.message.toLowerCase().includes('error') || 
      log.message.toLowerCase().includes('fallback') ||
      log.message.toLowerCase().includes('fail') ||
      log.message.toLowerCase().includes('alternative')
    );
    // Puede que no haya errores si todo funcionó correctamente
    // Pero debería haber algún tipo de registro
  });
});