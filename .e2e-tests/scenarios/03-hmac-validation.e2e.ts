import { POST } from '@/app/api/whatsapp/webhook/route';
import { generateValidPayload, createInvalidHMACRequest } from '../../helpers/webhook';
import { getUserByPhoneNumber, getMessagesForConversation, clearTestData } from '../../helpers/database';
import { hasLogWithMessage, captureLogs, getCapturedLogs, clearCapturedLogs } from '../../helpers/logging';

describe('E2E: HMAC Validation', () => {
  const TEST_PHONE_NUMBER = '56911111111';

  beforeAll(() => {
    // Capturar logs para validación
    captureLogs('whatsapp');
  });

  beforeEach(async () => {
    // Limpiar datos de prueba anteriores
    await clearTestData();
    clearCapturedLogs('whatsapp');
  });

  afterAll(() => {
    clearCapturedLogs('whatsapp');
  });

  it('should reject request with invalid HMAC signature', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario HMAC Inválido" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    // Crear solicitud con HMAC inválido
    const request = createInvalidHMACRequest(payload);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR RESPUESTA HTTP
    expect(response.status).toBe(401); // Unauthorized
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain('signature'); // Debe mencionar firma inválida

    // 4. VALIDAR BASE DE DATOS
    // No debería haber creado usuario ni mensajes
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    expect(user).toBeNull();

    // 5. VALIDAR LOGGING
    const logs = getCapturedLogs('whatsapp');
    
    // Verificar que se registró el intento de acceso no autorizado
    const hasSecurityLog = logs.some(log => 
      log.message.includes('Unauthorized') || 
      log.message.includes('Invalid signature') ||
      log.message.includes('HMAC') ||
      log.level === 'warn' || log.level === 'error'
    );
    expect(hasSecurityLog).toBe(true);

    // 6. VALIDAR SEGURIDAD
    // Asegurarse de que no se procesó ningún mensaje
    const allUsers = await prisma.whatsAppUser.findMany({
      where: {
        phoneNumber: { contains: TEST_PHONE_NUMBER }
      }
    });
    expect(allUsers).toHaveLength(0);
  });

  it('should accept request with valid HMAC signature', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario HMAC Válido" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    // Importar función para generar HMAC válido
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET || 'test-secret');
    hmac.update(JSON.stringify(payload));
    const validSignature = `sha256=${hmac.digest('hex')}`;

    const url = new URL('http://localhost:7847/api/whatsapp/webhook');
    const request = new NextRequest(url, {
      method: 'POST',
      headers: {
        'X-Hub-Signature-256': validSignature,
        'Content-Type': 'application/json',
        'User-Agent': 'E2E-Test-Client'
      },
      body: JSON.stringify(payload)
    });

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR RESPUESTA HTTP
    expect(response.status).toBe(200); // OK
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);

    // 4. VALIDAR BASE DE DATOS
    // Debería haber creado usuario y mensajes
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    expect(user).toBeDefined();
    expect(user?.name).toBe('Usuario HMAC Válido');
  });

  it('should reject request with malformed HMAC header', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario HMAC Malformado" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    // Crear solicitud con header HMAC malformado
    const url = new URL('http://localhost:7847/api/whatsapp/webhook');
    const request = new NextRequest(url, {
      method: 'POST',
      headers: {
        'X-Hub-Signature-256': 'invalid_format_no_prefix',
        'Content-Type': 'application/json',
        'User-Agent': 'E2E-Test-Client'
      },
      body: JSON.stringify(payload)
    });

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR RESPUESTA HTTP
    expect(response.status).toBe(401); // Unauthorized
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain('signature');
  });

  it('should reject request with HMAC header missing prefix', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario HMAC Sin Prefijo" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    // Crear solicitud con HMAC sin prefijo 'sha256='
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET || 'test-secret');
    hmac.update(JSON.stringify(payload));
    const hashOnly = hmac.digest('hex'); // Sin el prefijo 'sha256='

    const url = new URL('http://localhost:7847/api/whatsapp/webhook');
    const request = new NextRequest(url, {
      method: 'POST',
      headers: {
        'X-Hub-Signature-256': hashOnly, // Sin 'sha256='
        'Content-Type': 'application/json',
        'User-Agent': 'E2E-Test-Client'
      },
      body: JSON.stringify(payload)
    });

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR RESPUESTA HTTP
    expect(response.status).toBe(401); // Unauthorized
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain('signature');
  });

  it('should reject request with HMAC header with wrong algorithm', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario HMAC Algoritmo Erróneo" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    // Crear solicitud con HMAC usando algoritmo incorrecto
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha1', process.env.WHATSAPP_WEBHOOK_SECRET || 'test-secret'); // sha1 en lugar de sha256
    hmac.update(JSON.stringify(payload));
    const sha1Signature = `sha1=${hmac.digest('hex')}`;

    const url = new URL('http://localhost:7847/api/whatsapp/webhook');
    const request = new NextRequest(url, {
      method: 'POST',
      headers: {
        'X-Hub-Signature-256': sha1Signature, // Aunque el header diga 256, usamos sha1
        'Content-Type': 'application/json',
        'User-Agent': 'E2E-Test-Client'
      },
      body: JSON.stringify(payload)
    });

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR RESPUESTA HTTP
    expect(response.status).toBe(401); // Unauthorized
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain('signature');
  });

  it('should log security attempts for invalid HMAC', async () => {
    // 1. PREPARAR
    const payload = generateValidPayload({
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Log Seguridad" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    });

    // Crear solicitud con HMAC inválido
    const request = createInvalidHMACRequest(payload);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBe(401);
    
    // 4. VALIDAR LOGGING DE SEGURIDAD
    const logs = getCapturedLogs('whatsapp');
    
    // Verificar que se registró un intento de seguridad
    const hasSecurityAttemptLog = logs.some(log => 
      log.level === 'warn' || 
      log.level === 'error' ||
      log.message.toLowerCase().includes('security') ||
      log.message.toLowerCase().includes('attempt') ||
      log.message.toLowerCase().includes('unauthorized') ||
      log.message.toLowerCase().includes('invalid')
    );
    expect(hasSecurityAttemptLog).toBe(true);
  });
});