# 📋 E2E TESTING - PHASE 2 STEP 2 VALIDATION

**Para**: GEMINI (QA/Testing Specialist)
**Status**: 🟢 LISTO PARA EJECUCIÓN
**Fecha**: 15 de Enero de 2026
**Priority**: 🔴 CRÍTICA (Validación antes de producción)

---

## 🎯 OBJETIVO

**Validar que Phase 2 Step 2 funciona correctamente en un flujo End-to-End completo.**

Este es el **cierre de validación** antes del despliegue a producción.

```
Estado actual:
├─ Component 1: PerplexityService ✅ (implementado)
├─ Component 2: MessageProcessorService ✅ (implementado)
├─ Component 3A: WhatsAppService ✅ (implementado)
├─ Component 3B: Dashboard UI ✅ (implementado)
├─ Component 4: HMAC + Rate Limiting ✅ (implementado)
├─ Component 5: Webhook Refactoring ✅ (implementado)
├─ Component 6: Final Integration ✅ (committed)
└─ Código compilando, tests unitarios pasando

E2E Testing (Componente 7):
├─ Escenarios de flujo completo
├─ Validación de seguridad
├─ Pruebas de límites
├─ Manejo de errores
├─ Integración de todos los componentes
└─ Reporte de validación
```

---

## 📊 ESPECIFICACIÓN TÉCNICA

### Qué Hace E2E Testing

**Valida que todo funciona junto**, no solo piezas individuales:

```
1. Escenarios de Flujo Completo (30 min)
   ├─ Webhook POST válido → Procesa → Responde
   ├─ Mensaje texto → IA → Respuesta texto
   ├─ Mensaje audio → Transcribe → IA → TTS → Respuesta audio
   ├─ Comando especial → Ejecuta → Responde
   └─ Sesión timeout → Crea conversación nueva

2. Validación de Seguridad (20 min)
   ├─ HMAC inválido → Rechaza con 401
   ├─ Rate limit excedido → Rechaza con 429
   ├─ Payload malformado → Rechaza con 400
   ├─ Missing signature → Rechaza con 401
   └─ Bloqueo temporal funciona

3. Pruebas de Límites (15 min)
   ├─ Mensaje muy largo (>2000 chars)
   ├─ Audio muy largo (>5 min)
   ├─ Payload vacío
   ├─ Campos faltantes
   └─ Valores nulos

4. Manejo de Errores (15 min)
   ├─ PerplexityService falla → Fallback a Claude
   ├─ Claude falla → Respuesta genérica
   ├─ Transcripción falla → Respuesta texto
   ├─ TTS falla → Respuesta texto
   ├─ Database error → Error 500 controlado
   └─ Timeout IA → Respuesta predeterminada

5. Integración Completa (15 min)
   ├─ Todos los servicios juntos
   ├─ Logging correcto en todos
   ├─ Métricas se registran
   ├─ Dashboard actualiza
   └─ Base de datos persiste

6. Generación de Reporte (5 min)
   └─ Documento formal de validación
```

---

## 📂 ESTRUCTURA DE TESTS

### Ubicación de Archivo

```
e2e/
├─ fixtures/
│  ├─ valid-webhook-payload.json
│  ├─ invalid-hmac-payload.json
│  ├─ audio-message-payload.json
│  └─ rate-limit-payloads.json
├─ scenarios/
│  ├─ 01-valid-text-flow.e2e.ts
│  ├─ 02-audio-flow.e2e.ts
│  ├─ 03-hmac-validation.e2e.ts
│  ├─ 04-rate-limiting.e2e.ts
│  ├─ 05-error-handling.e2e.ts
│  └─ 06-complete-integration.e2e.ts
└─ README.md
```

---

## 🧪 ESCENARIOS DE TEST

### **ESCENARIO 1: Flujo Válido de Texto (10 min)**

**Qué sucede:**
```
1. Usuario envía mensaje de texto por WhatsApp
2. WhatsApp envía webhook POST con:
   - HMAC válido (X-Hub-Signature-256)
   - Payload correcto
   - Mensaje de texto
3. Sistema recibe y procesa:
   ├─ webhookAuthMiddleware valida HMAC ✅
   ├─ rateLimiter.checkLimit() pasa ✅
   ├─ WhatsAppService.processWebhookPayload() ✅
   ├─ MessageProcessorService.processMessage() ✅
   ├─ PerplexityService.processMessage() ✅
   ├─ Respuesta guardada en DB ✅
   └─ Respuesta enviada a WhatsApp ✅
4. Sistema retorna 200 OK ✅
```

**Validaciones:**
```
✓ Status code = 200
✓ Response.success = true
✓ Response.type = 'text'
✓ Response.message = (respuesta no vacía)
✓ Response.details.processingTime > 0
✓ Mensaje guardado en base de datos
✓ whatsappLogger registra el evento
✓ Respuesta enviada a WhatsApp
```

**Payload:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "34XXXXXXXXX",
          "id": "wamid.XXXXX",
          "timestamp": "1705330000",
          "type": "text",
          "text": { "body": "¿Cuál es el clima hoy?" }
        }],
        "contacts": [{
          "profile": { "name": "Juan" }
        }]
      }
    }]
  }]
}
```

---

### **ESCENARIO 2: Flujo de Audio (12 min)**

**Qué sucede:**
```
1. Usuario envía mensaje de audio por WhatsApp
2. Sistema:
   ├─ Valida HMAC ✅
   ├─ Valida rate limit ✅
   ├─ Descarga audio de servidor WhatsApp ✅
   ├─ Transcribe con Whisper ✅
   ├─ Procesa con PerplexityService ✅
   ├─ Genera TTS con respuesta ✅
   ├─ Envía audio a WhatsApp ✅
   └─ Guarda en DB ✅
3. Sistema retorna 200 OK ✅
```

**Validaciones:**
```
✓ Status code = 200
✓ Transcripción correcta
✓ Respuesta IA relevante
✓ Archivo TTS generado
✓ TTS enviado a WhatsApp
✓ Mensaje guardado como audio
✓ Metadata contiene intent y entities
```

---

### **ESCENARIO 3: HMAC Inválido (8 min)**

**Qué sucede:**
```
1. Atacante envía webhook con HMAC inválido
2. Sistema:
   ├─ webhookAuthMiddleware detecta inválido
   └─ Rechaza inmediatamente
3. Sistema retorna 401 Unauthorized ✅
4. No procesa nada más ✅
5. Log de seguridad registra intento ✅
```

**Validaciones:**
```
✓ Status code = 401
✓ Response.success = false
✓ Response.error = "Invalid signature"
✓ whatsappLogger registra intento
✓ No se crea usuario
✓ No se crea conversación
✓ No se guarda mensaje
✓ No se llama a IA
```

---

### **ESCENARIO 4: Rate Limit Excedido (10 min)**

**Qué sucede:**
```
1. Usuario (o atacante) envía 101 requests en 1 minuto
2. Sistema:
   ├─ Primeros 100: ✅ Procesa
   ├─ Request 101:
   │  ├─ HMAC válido ✅
   │  ├─ Rate limiter rechaza ✅
   │  └─ Retorna 429 ✅
   └─ Usuario bloqueado 15 minutos

3. Usuario intenta enviar en minuto 2:
   └─ Aún está bloqueado ✅
4. Usuario intenta en minuto 16:
   └─ Bloqueo expirado ✅
```

**Validaciones:**
```
✓ Primeros 100 requests: status 200
✓ Request 101: status 429
✓ Response.error contiene info de reset
✓ Usuario bloqueado por 15 minutos
✓ Bloqueo se resetea automáticamente
✓ whatsappLogger registra límite excedido
✓ Cleanup automático funciona
```

---

### **ESCENARIO 5: Manejo de Errores - IA Falla (10 min)**

**Qué sucede:**
```
1. PerplexityService falla (timeout, error API, etc.)
2. Sistema:
   ├─ MessageProcessorService detecta error
   ├─ Intenta fallback a Claude ✅
   │  ├─ Si Claude ok: retorna respuesta Claude ✅
   │  └─ Si Claude también falla:
   │     └─ Retorna respuesta genérica ✅
   ├─ Guarda en DB con flag de error ✅
   ├─ Envía respuesta (fallback o genérica) ✅
   └─ Log registra cadena de fallbacks ✅

3. Sistema retorna 200 OK ✅
```

**Validaciones:**
```
✓ Status code = 200 (no 500)
✓ Response.success = true (se manejó error)
✓ Respuesta enviada al usuario
✓ Log indica cadena de fallback usada
✓ Metadata contiene "fallbackUsed": true
✓ Base de datos registra error
```

---

### **ESCENARIO 6: Integración Completa - Sesión Timeout (8 min)**

**Qué sucede:**
```
1. Usuario tiene conversación abierta
2. Inactividad por >24 horas
3. Usuario envía nuevo mensaje
4. Sistema:
   ├─ Detecta timeout ✅
   ├─ Cierra conversación anterior ✅
   ├─ Crea conversación nueva ✅
   ├─ Procesa en conversación nueva ✅
   ├─ Envía respuesta ✅
   └─ Log registra reset de sesión ✅

5. Sistema retorna 200 OK ✅
```

**Validaciones:**
```
✓ Conversación anterior cerrada
✓ Conversación nueva creada
✓ Historial no incluye mensajes antiguos
✓ Timestamp de última actividad actualizado
✓ whatsappLogger registra timeout
```

---

### **ESCENARIO 7: Payload Malformado (6 min)**

**Qué sucede:**
```
1. Attacker envía payload incorrecto:
   - Missing "object"
   - Missing "entry"
   - Missing "messages"
   - Mensaje incompleto (sin "from")
   - Tipo no soportado

2. Sistema:
   ├─ WhatsAppService.validateWebhookPayload() rechaza ✅
   ├─ Retorna error específico ✅
   └─ No procesa nada ✅

3. Sistema retorna 400 Bad Request ✅
```

**Validaciones:**
```
✓ Status code = 400
✓ Response.success = false
✓ Response.error específico (no genérico)
✓ Logging adecuado
✓ Sin crash del servidor
```

---

### **ESCENARIO 8: Dashboard Actualización (7 min)**

**Qué sucede:**
```
1. Dashboard abierto en navegador
2. Usuario envía mensaje por WhatsApp
3. Sistema procesa:
   ├─ API /api/admin/ai-status actualiza
   └─ Frontend se actualiza (auto-refresh)

4. Dashboard muestra:
   ├─ Online/Offline ✅
   ├─ Último procesamiento ✅
   ├─ Tiempo promedio ✅
   ├─ Proveedor actual ✅
   └─ Configuración activa ✅
```

**Validaciones:**
```
✓ Dashboard actualiza dentro de 30 segundos
✓ Status correcto (online si todo ok)
✓ Último procesamiento muestra fecha/hora correcta
✓ Tiempo de respuesta dentro de rango
✓ Configuración refleja lo guardado
```

---

### **ESCENARIO 9: Comando Especial (6 min)**

**Qué sucede:**
```
1. Usuario envía comando (comienza con /)
2. Sistema:
   ├─ Detecta comando ✅
   ├─ Llama AIService.handleCommand() ✅
   ├─ Ejecuta acción especial ✅
   ├─ Retorna respuesta de comando ✅
   └─ Guarda como respuesta outbound ✅

3. Sistema retorna 200 OK ✅
```

**Validaciones:**
```
✓ Comando reconocido
✓ Acción ejecutada correctamente
✓ Respuesta enviada
✓ Tipo = "text" (no pasa por IA)
✓ Log indica comando procesado
```

---

### **ESCENARIO 10: Modo Manual (6 min)**

**Qué sucede:**
```
1. Conversación está en modo manual
2. Usuario envía mensaje
3. Sistema:
   ├─ Detecta modo manual ✅
   ├─ Guarda mensaje como inbound ✅
   ├─ NO llama a IA ✅
   ├─ Retorna resultado sin procesar ✅
   └─ Solo registra, no responde ✅

4. Sistema retorna 200 OK ✅
```

**Validaciones:**
```
✓ Status code = 200
✓ Response.type = "manual_mode"
✓ No se llama a IA
✓ Mensaje guardado como inbound
✓ No se envía respuesta automática
✓ Log indica modo manual
```

---

## 📝 PATRONES A SEGUIR

### **Estructura de Test E2E**

```typescript
describe('E2E: Webhook Flow', () => {
  describe('Valid Text Message', () => {
    it('should process text message end-to-end', async () => {
      // 1. Preparar
      const payload = getValidPayload()
      const signature = generateHMAC(payload)

      // 2. Ejecutar
      const response = await POST(createRequest(payload, signature))

      // 3. Validar respuesta
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      // 4. Validar base de datos
      const messages = await getMessagesFromDB()
      expect(messages).toHaveLength(2) // inbound + outbound

      // 5. Validar logging
      const logs = whatsappLogger.getLogs()
      expect(logs).toContainEqual(expect.objectContaining({
        level: 'info',
        message: expect.stringContaining('Webhook processed')
      }))

      // 6. Validar integración
      expect(messageWasSentToWhatsApp).toBe(true)
    })
  })
})
```

### **Fixtures y Mocks**

```typescript
// fixtures/valid-webhook-payload.json
{
  "object": "whatsapp_business_account",
  "entry": [{ /* ... */ }]
}

// mocks/whatsapp-client.ts
jest.mock('@/lib/whatsapp', () => ({
  sendWhatsAppMessage: jest.fn().mockResolvedValue({ success: true }),
  downloadWhatsAppMedia: jest.fn().mockResolvedValue(Buffer.from('...')),
  sendWhatsAppAudio: jest.fn().mockResolvedValue({ success: true })
}))

// mocks/ai-service.ts
jest.mock('@/services/PerplexityService', () => ({
  processMessage: jest.fn().mockResolvedValue({
    success: true,
    response: 'Respuesta de prueba',
    sources: []
  })
}))
```

### **Helpers**

```typescript
// helpers/webhook.ts
export function generateValidPayload(overrides = {}) {
  return deepMerge(VALID_PAYLOAD_TEMPLATE, overrides)
}

export function generateHMAC(payload: string): string {
  const hmac = crypto.createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET!)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
}

export function createRequest(payload: any, signature: string): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/whatsapp/webhook'), {
    method: 'POST',
    headers: {
      'X-Hub-Signature-256': signature,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

// helpers/database.ts
export async function getMessagesForConversation(conversationId: string) {
  return await ConversationService.getConversationHistory(conversationId)
}

export async function clearTestData() {
  // Limpiar usuarios/conversaciones de prueba
}

// helpers/logging.ts
export function getRecentLogs(level?: string) {
  return whatsappLogger.getLogs().filter(log => !level || log.level === level)
}
```

---

## ✅ CHECKLIST DE ACEPTACIÓN

Antes de marcar como "Done", GEMINI debe verificar:

**Escenarios Completados:**
- [ ] Escenario 1: Flujo válido de texto ✅
- [ ] Escenario 2: Flujo de audio ✅
- [ ] Escenario 3: HMAC inválido ✅
- [ ] Escenario 4: Rate limit excedido ✅
- [ ] Escenario 5: Manejo de errores (IA falla) ✅
- [ ] Escenario 6: Sesión timeout ✅
- [ ] Escenario 7: Payload malformado ✅
- [ ] Escenario 8: Dashboard actualización ✅
- [ ] Escenario 9: Comando especial ✅
- [ ] Escenario 10: Modo manual ✅

**Cobertura de Tests:**
- [ ] Cobertura >= 85% en servicios críticos
- [ ] Todos los casos de error cubiertos
- [ ] Todos los caminos felices cubiertos
- [ ] Edge cases identificados y testeados

**Integración:**
- [ ] Todos los componentes trabajando juntos
- [ ] Logging funciona correctamente
- [ ] Base de datos persiste datos
- [ ] WhatsApp API (mocked) recibe llamadas
- [ ] Perplexity Service (mocked) se llama correctamente

**Validación:**
- [ ] Todos los tests pasan
- [ ] Tiempo de respuesta < 5 segundos (99% de casos)
- [ ] Sin errores no controlados (500)
- [ ] Respuestas HTTP correctas (200, 401, 429, 400)
- [ ] Logging detallado de cada paso

**Documentación:**
- [ ] README.md en carpeta e2e/
- [ ] Documentación de fixtures
- [ ] Documentación de helpers
- [ ] Pasos para ejecutar tests

---

## 🚀 CÓMO EJECUTAR LOS TESTS

```bash
# Opción 1: Todos los E2E tests
npm run test:e2e

# Opción 2: E2E test específico
npm run test:e2e -- --testPathPattern="valid-text-flow"

# Opción 3: Watch mode
npm run test:e2e -- --watch

# Opción 4: Con cobertura
npm run test:e2e -- --coverage

# Verificar integración con build
npm run build
npm run test
npm run test:e2e
```

---

## 📧 REPORTE ESPERADO

Cuando termines, reporta así:

```markdown
# REPORTE E2E TESTING - GEMINI

## Status: ✅ COMPLETADO

### Escenarios Ejecutados

- ✅ Escenario 1: Flujo de texto (10 tests)
- ✅ Escenario 2: Flujo de audio (8 tests)
- ✅ Escenario 3: HMAC inválido (6 tests)
- ✅ Escenario 4: Rate limiting (12 tests)
- ✅ Escenario 5: Manejo de errores (10 tests)
- ✅ Escenario 6: Sesión timeout (7 tests)
- ✅ Escenario 7: Payload malformado (6 tests)
- ✅ Escenario 8: Dashboard (5 tests)
- ✅ Escenario 9: Comandos (4 tests)
- ✅ Escenario 10: Modo manual (4 tests)

**Total: 72 tests E2E**

### Resultados

- npm run test:e2e: ✅ ALL PASS
- Cobertura: XX%
- Tiempo promedio de respuesta: XXXms
- Errores críticos encontrados: 0
- Warnings encontrados: X (detalles en sección observaciones)

### Integración Validada

- ✅ PerplexityService (mocked)
- ✅ MessageProcessorService
- ✅ WhatsAppService
- ✅ HMACValidator
- ✅ RateLimiter
- ✅ Webhook Auth Middleware
- ✅ Database persistence
- ✅ Logging (whatsappLogger, messageProcessorLogger)
- ✅ Dashboard endpoints

### Seguridad Validada

- ✅ HMAC validation works (reject invalid)
- ✅ Rate limiting works (block after 100)
- ✅ Timing-safe comparison (no timing attacks)
- ✅ No sensitive data in error responses
- ✅ Proper HTTP status codes (401, 429, 400, 500)

### Performance

- Text message processing: XXXms (avg)
- Audio transcription: XXXms (avg, mocked)
- AI response generation: XXXms (avg, mocked)
- TTS generation: XXXms (avg, mocked)
- Total webhook processing: XXXms (p99)

### Observaciones

[Cualquier nota sobre issues encontrados, workarounds, o decisiones]

### Archivos Creados/Modificados

- e2e/fixtures/valid-webhook-payload.json (NUEVO)
- e2e/fixtures/invalid-hmac-payload.json (NUEVO)
- e2e/fixtures/audio-message-payload.json (NUEVO)
- e2e/scenarios/01-valid-text-flow.e2e.ts (NUEVO)
- e2e/scenarios/02-audio-flow.e2e.ts (NUEVO)
- e2e/scenarios/03-hmac-validation.e2e.ts (NUEVO)
- e2e/scenarios/04-rate-limiting.e2e.ts (NUEVO)
- e2e/scenarios/05-error-handling.e2e.ts (NUEVO)
- e2e/scenarios/06-complete-integration.e2e.ts (NUEVO)
- e2e/helpers/webhook.ts (NUEVO)
- e2e/helpers/database.ts (NUEVO)
- e2e/helpers/logging.ts (NUEVO)
- e2e/README.md (NUEVO)
- package.json (MODIFICADO - agregado script test:e2e)

### Timeline

- Configuración: X min
- Escenario 1-2: X min
- Escenario 3-5: X min
- Escenario 6-10: X min
- Debugging y fixes: X min
- Documentación: X min

**Total: X horas Y minutos**

### Conclusión

Phase 2 Step 2 está **100% validado y listo para producción**.

Todos los componentes trabajan juntos correctamente, la seguridad está implementada, y el manejo de errores es robusto.

**Recomendación: PROCEDER CON DEPLOYMENT A STAGING**
```

---

## 🎯 PRÓXIMOS PASOS (Para CLAUDE)

Una vez aprobado E2E Testing:

1. ✅ CLAUDE: Revisar reporte de E2E tests
2. ✅ CLAUDE: Crear PR formal a main branch
3. ✅ Merge a main y tag de versión
4. ✅ Despliegue a staging
5. ✅ Smoke tests en staging
6. ✅ Despliegue a producción

---

## 📊 MÉTRICAS A RECOLECTAR

```typescript
// Recolectar durante ejecución
metrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  coverage: {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0
  },
  performance: {
    minResponseTime: Infinity,
    maxResponseTime: 0,
    avgResponseTime: 0,
    p50ResponseTime: 0,
    p99ResponseTime: 0
  },
  security: {
    hmacValidationTests: 0,
    rateLimitTests: 0,
    timingSafeTests: 0,
    allPassed: true
  }
}
```

---

**¿GEMINI, LISTO PARA COMENZAR E2E TESTING?**

Confirma que:
- [ ] Entiendes los 10 escenarios
- [ ] Tienes claro el formato de reporte
- [ ] Sabes qué tools usar (jest, mocks, fixtures)
- [ ] Entiendes la integración de componentes
- [ ] ¿Preguntas? Pregunta ahora

**¡Adelante GEMINI! 🧪🚀 Este es el último paso antes de producción!**
