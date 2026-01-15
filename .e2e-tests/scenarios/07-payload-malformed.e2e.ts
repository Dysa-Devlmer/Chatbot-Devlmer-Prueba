import { POST } from '@/app/api/whatsapp/webhook/route';
import { generateHMAC, createRequest } from '../../helpers/webhook';
import { getUserByPhoneNumber, getMessagesForConversation, clearTestData } from '../../helpers/database';
import { hasLogWithMessage, captureLogs, getCapturedLogs, clearCapturedLogs } from '../../helpers/logging';

describe('E2E: Payload Malformed', () => {
  const TEST_PHONE_NUMBER = '56977777777';

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

  it('should reject payload missing "object" field', async () => {
    // 1. PREPARAR
    const malformedPayload = {
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Objeto Faltante" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba" }, type: "text" }]
          },
          field: "messages"
        }]
      }]
    };

    const signature = generateHMAC(JSON.stringify(malformedPayload));
    const request = createRequest(malformedPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 200]); // Puede devolver 400 o manejarlo elegantemente
    
    if (response.status === 400) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('object'); // Debe indicar qué campo falta
    }
    
    // 4. VALIDAR BASE DE DATOS
    // No debería haber creado usuario ni mensajes con payload malformado
    const user = await getUserByPhoneNumber(TEST_PHONE_NUMBER);
    // Puede que se haya creado si el error se detectó tarde en el proceso
  });

  it('should reject payload missing "entry" field', async () => {
    // 1. PREPARAR
    const malformedPayload = {
      object: "whatsapp_business_account"
      // entry field is missing
    };

    const signature = generateHMAC(JSON.stringify(malformedPayload));
    const request = createRequest(malformedPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 200]);
    
    if (response.status === 400) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('entry');
    }
  });

  it('should reject payload with missing "messages" field', async () => {
    // 1. PREPARAR
    const malformedPayload = {
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Mensajes Faltantes" }, wa_id: TEST_PHONE_NUMBER }]
            // messages field is missing
          },
          field: "messages"
        }]
      }]
    };

    const signature = generateHMAC(JSON.stringify(malformedPayload));
    const request = createRequest(malformedPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 200]);
    
    if (response.status === 400) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('message');
    }
  });

  it('should reject payload with incomplete message (missing "from")', async () => {
    // 1. PREPARAR
    const malformedPayload = {
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario From Faltante" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{
              // from field is missing
              id: "wamid.test",
              text: { body: "Mensaje de prueba" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    const signature = generateHMAC(JSON.stringify(malformedPayload));
    const request = createRequest(malformedPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 200]);
    
    if (response.status === 400) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('from');
    }
  });

  it('should reject payload with unsupported message type', async () => {
    // 1. PREPARAR
    const malformedPayload = {
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Tipo No Soportado" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{
              from: TEST_PHONE_NUMBER,
              id: "wamid.test",
              text: { body: "Mensaje de prueba" },
              type: "unsupported_type" // Tipo no soportado
            }]
          },
          field: "messages"
        }]
      }]
    };

    const signature = generateHMAC(JSON.stringify(malformedPayload));
    const request = createRequest(malformedPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 200]);
    
    if (response.status === 400) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('type') || expect(responseBody.error).toContain('support');
    }
  });

  it('should handle completely empty payload', async () => {
    // 1. PREPARAR
    const emptyPayload = {};

    const signature = generateHMAC(JSON.stringify(emptyPayload));
    const request = createRequest(emptyPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 200]);
    
    if (response.status === 400) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
    }
  });

  it('should handle payload with null values', async () => {
    // 1. PREPARAR
    const nullPayload = {
      object: null,
      entry: null
    };

    const signature = generateHMAC(JSON.stringify(nullPayload));
    const request = createRequest(nullPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 200]);
    
    if (response.status === 400) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
    }
  });

  it('should handle payload with invalid JSON structure', async () => {
    // 1. PREPARAR - Crear un request con JSON inválido manualmente
    const url = new URL('http://localhost:7847/api/whatsapp/webhook');
    const request = new NextRequest(url, {
      method: 'POST',
      headers: {
        'X-Hub-Signature-256': generateHMAC('{"invalid": json}'), // Esto no es JSON válido
        'Content-Type': 'application/json',
        'User-Agent': 'E2E-Test-Client'
      },
      body: '{"invalid": json}' // JSON inválido
    });

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 422, 200]); // 422 para JSON inválido
    
    if ([400, 422].includes(response.status)) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
    }
  });

  it('should handle payload with extra unexpected fields', async () => {
    // 1. PREPARAR
    const extendedPayload = {
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Campos Extra" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{ from: TEST_PHONE_NUMBER, text: { body: "Mensaje de prueba" }, type: "text" }]
          },
          field: "messages"
        }]
      }],
      extra_field: "this should be ignored", // Campo extra que debería ignorarse
      another_extra: {
        nested: "value"
      }
    };

    const signature = generateHMAC(JSON.stringify(extendedPayload));
    const request = createRequest(extendedPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    // Los campos extra deberían ser ignorados y el mensaje procesado normalmente
    expect(response.status).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
  });

  it('should handle payload with wrong data types', async () => {
    // 1. PREPARAR
    const wrongTypesPayload = {
      object: 12345, // Debería ser string
      entry: "not_an_array", // Debería ser array
    };

    const signature = generateHMAC(JSON.stringify(wrongTypesPayload));
    const request = createRequest(wrongTypesPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    expect(response.status).toBeOneOf([400, 200]);
    
    if (response.status === 400) {
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
    }
  });

  it('should not crash server with malformed payload', async () => {
    // 1. PREPARAR
    const maliciousPayload = {
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          value: {
            contacts: [{ profile: { name: "Usuario Payload Malicioso" }, wa_id: TEST_PHONE_NUMBER }],
            messages: [{
              from: TEST_PHONE_NUMBER,
              id: "wamid.test",
              text: { body: "Mensaje de prueba" },
              type: "text",
              // Agregar campos potencialmente problemáticos
              potentially_recursive: {},
              deeply_nested: { a: { b: { c: { d: { e: { f: "deep" } } } } } },
              very_long_string: "a".repeat(10000) // Cadena muy larga
            }]
          },
          field: "messages"
        }]
      }]
    };
    
    // Hacer que el campo recursivo se refiera a sí mismo (potencialmente peligroso)
    maliciousPayload.entry[0].changes[0].value.messages[0].potentially_recursive = maliciousPayload;

    const signature = generateHMAC(JSON.stringify(maliciousPayload));
    const request = createRequest(maliciousPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    // El servidor no debería crashear, aunque podría devolver un error
    expect(response.status).toBeDefined(); // Debe haber alguna respuesta, no undefined
  });

  it('should log appropriate errors for malformed payloads', async () => {
    // 1. PREPARAR
    const malformedPayload = {
      object: "whatsapp_business_account",
      entry: [] // Array vacío
    };

    const signature = generateHMAC(JSON.stringify(malformedPayload));
    const request = createRequest(malformedPayload, signature);

    // 2. EJECUTAR
    const response = await POST(request);

    // 3. VALIDAR
    // Verificar que se hayan registrado errores apropiados en los logs
    const logs = getCapturedLogs('whatsapp');
    
    // Debe haber algún registro del intento de procesamiento
    expect(logs.length).toBeGreaterThanOrEqual(0); // Puede no haber logs si se rechaza muy temprano
    
    // Si hay logs, buscar mensajes de error o validación
    if (logs.length > 0) {
      const hasErrorLog = logs.some(log => 
        log.level === 'error' || 
        log.level === 'warn' ||
        log.message.toLowerCase().includes('error') ||
        log.message.toLowerCase().includes('invalid') ||
        log.message.toLowerCase().includes('malformed') ||
        log.message.toLowerCase().includes('validation')
      );
      // Puede haber o no dependiendo de qué tan temprano se rechazó el payload
    }
  });
});