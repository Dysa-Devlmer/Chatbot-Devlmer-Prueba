# 📋 COMPONENTE 5: Refactorizar Webhook Route

**Para**: CODEX (Backend/Services Specialist)
**Status**: 🟢 LISTO PARA IMPLEMENTACIÓN
**Fecha**: 15 de Enero de 2026
**Priority**: ALTA (Integración de todos los componentes)

---

## 🎯 OBJETIVO

Refactorizar el webhook route (`app/api/whatsapp/webhook/route.ts`) para **usar todos los servicios implementados**:

```
ANTES (Actual):
├─ GET: Verificación simple
└─ POST: Lógica inline compleja (500+ líneas)
   ├─ Sin validación HMAC ❌
   ├─ Sin rate limiting ❌
   ├─ Lógica duplicada
   └─ Difícil de testear

DESPUÉS (Component 5):
├─ GET: Verificación simple
└─ POST: Orquestación limpia (50-70 líneas)
   ├─ webhookAuthMiddleware (HMAC + Rate Limit) ✅
   ├─ WhatsAppService.processWebhookPayload() ✅
   ├─ Respuestas estandarizadas
   └─ Fácil de testear y mantener
```

**Flujo:**
```
POST /api/whatsapp/webhook
  ↓
webhookAuthMiddleware()  ← Valida HMAC + Rate Limit
  ├─ 401 si HMAC inválido
  ├─ 429 si rate limit excedido
  └─ OK si todo válido
  ↓
whatsAppService.processWebhookPayload()  ← Procesa mensaje
  ├─ Obtiene usuario
  ├─ Obtiene conversación
  ├─ Verifica horarios
  ├─ messageProcessorService.processMessage()
  └─ Guarda y responde
  ↓
return 200 OK
```

---

## 📊 ESPECIFICACIÓN TÉCNICA

### Archivo a Refactorizar

```
app/api/whatsapp/webhook/route.ts
```

### Estructura Final

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { webhookAuthMiddleware, getHttpStatus } from '@/middleware/webhook-auth'
import { whatsAppService } from '@/services/WhatsAppService'
import { whatsappLogger } from '@/lib/logger'

// GET - Verificación de webhook (sin cambios)
export async function GET(request: NextRequest) {
  // ... código existente ...
}

// POST - Procesamiento de mensajes (COMPLETAMENTE REFACTORIZADO)
export async function POST(request: NextRequest) {
  try {
    // 1. Validar HMAC + Rate Limiting
    const authResult = await webhookAuthMiddleware(request)

    if (!authResult.valid) {
      const status = getHttpStatus(authResult)
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status }
      )
    }

    // 2. Obtener body
    const body = await request.json()

    // 3. Procesar con WhatsAppService
    const result = await whatsAppService.processWebhookPayload(body)

    // 4. Retornar resultado
    return NextResponse.json({
      success: result.success,
      type: result.type,
      message: result.message,
      details: result.details,
    })
  } catch (error) {
    whatsappLogger.error('Webhook POST error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🔧 CAMBIOS DETALLADOS

### Lo Que DEBE ELIMINAR

**Eliminar estas funciones/lógica que ahora están en servicios:**

```typescript
❌ ConversationService.logWebhookEvent()    → Ya existe
❌ Verificación de horarios (inline)        → HorariosService existe
❌ Validación de modo manual (inline)       → WhatsAppService.handleManualMode()
❌ Transcripción de audio (inline)          → MessageProcessorService
❌ Procesamiento con IA (inline)            → MessageProcessorService + PerplexityService
❌ Generación de audio TTS (inline)         → MessageProcessorService
❌ saveMessage (inline)                     → ConversationService
❌ Manejo de comandos (inline)              → AIService.handleCommand()
```

### Lo Que DEBE MANTENER

```typescript
✅ GET para verificación de webhook
✅ Logging con whatsappLogger
✅ Error handling básico
✅ Respuestas estandarizadas (NextResponse.json)
✅ Variables de entorno (WHATSAPP_WEBHOOK_TOKEN, etc)
```

### Lo Que DEBE AGREGAR

```typescript
✅ Import de webhookAuthMiddleware
✅ Import de whatsAppService
✅ Llamada a webhookAuthMiddleware en POST
✅ Validación de resultado de auth
✅ Llamada a whatsAppService.processWebhookPayload()
✅ Manejo de errores con getHttpStatus()
```

---

## 📝 PATRONES A SEGUIR

### **Estructura POST refactorizado**

```typescript
export async function POST(request: NextRequest) {
  try {
    // Paso 1: Validación
    const authResult = await webhookAuthMiddleware(request)
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: getHttpStatus(authResult) }
      )
    }

    // Paso 2: Parseo
    const body = await request.json()

    // Paso 3: Procesamiento
    const result = await whatsAppService.processWebhookPayload(body)

    // Paso 4: Respuesta
    return NextResponse.json({
      success: result.success,
      type: result.type,
      message: result.message,
      details: result.details,
    })
  } catch (error) {
    logError(...)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### **Logging**

```typescript
import { whatsappLogger, logError } from '@/lib/logger'

whatsappLogger.info('Webhook processed', {
  type: result.type,
  success: result.success,
  processingTime: result.details?.processingTime
})

if (error) {
  logError(whatsappLogger, error, {
    stage: 'webhook-post'
  })
}
```

---

## ✅ CHECKLIST DE ACEPTACIÓN

Antes de marcar como "Done", CODEX debe verificar:

**Estructura:**
- [ ] Archivo `app/api/whatsapp/webhook/route.ts` refactorizado
- [ ] GET mantiene funcionalidad original
- [ ] POST reducido a ~50-70 líneas
- [ ] Imports correctos de todos los servicios
- [ ] Exports: `export async function GET/POST`

**Funcionalidad:**
- [ ] webhookAuthMiddleware llamado en POST
- [ ] Validación de HMAC ✅
- [ ] Rate limiting aplicado ✅
- [ ] WhatsAppService.processWebhookPayload() llamado
- [ ] Resultado procesado correctamente
- [ ] Respuesta HTTP correcta (200, 401, 429, 500)

**Código:**
- [ ] Sin lógica inline duplicada
- [ ] Logging con whatsappLogger
- [ ] Error handling robusto
- [ ] TypeScript strict mode
- [ ] Jsdoc comments (si aplica)

**Testing:**
- [ ] `npm run build` → ✅ SUCCESS
- [ ] `npm run test` → ✅ PASS (todos los tests anteriores)
- [ ] No hay nuevos lint errors
- [ ] Funciona con WhatsAppService

**Integración:**
- [ ] Usa webhookAuthMiddleware de Component 4
- [ ] Usa whatsAppService de Component 3A
- [ ] Usa messageProcessorService (Chain)
- [ ] Usa perplexityService (Chain)
- [ ] Todo integrado correctamente

---

## 🚀 CONSIDERACIONES

### Performance

```typescript
// ✅ BIEN - Usa middleware reutilizable
const authResult = await webhookAuthMiddleware(request)

// ❌ MAL - Duplicar validación
const hmacResult = HMACValidator.validateSignature(...)
const rateLimitResult = rateLimiter.checkLimit(...)
```

### Error Handling

```typescript
// ✅ BIEN - Respuestas HTTP correctas
if (!authResult.valid) {
  return NextResponse.json(
    { success: false, error: authResult.error },
    { status: getHttpStatus(authResult) }  // 401, 429, etc
  )
}

// ❌ MAL - Todos 500
return NextResponse.json({ error: ... }, { status: 500 })
```

### Logging

```typescript
// ✅ BIEN - Contexto claro
whatsappLogger.info('Webhook processed', {
  type: result.type,
  processingTime: result.details?.processingTime,
  userId: result.details?.userId
})

// ❌ MAL - Sin contexto
console.log('Done')
```

---

## 📧 REPORTE ESPERADO

Cuando termines, reporta así:

```markdown
# REPORTE COMPONENT 5 - CODEX

## Status: ✅ COMPLETADO

### Refactorización

- Archivo: app/api/whatsapp/webhook/route.ts (refactorizado)
- Líneas antes: 500+ (lógica inline)
- Líneas después: XX (solo orquestación)
- Métodos eliminados: XX (ahora en servicios)
- Métodos agregados: 0 (solo imports)

### Integración

- ✅ webhookAuthMiddleware (Component 4)
- ✅ WhatsAppService (Component 3A)
- ✅ MessageProcessorService (Component 2)
- ✅ PerplexityService (Component 1)
- ✅ HorariosService, AIService, ConversationService (existentes)

### Testing

- npm run build: ✅ SUCCESS
- npm run test: ✅ PASS (todos los tests previos)
- No hay nuevos errors
- HTTP responses correctas (200, 401, 429, 500)

### Observaciones

[Cualquier nota sobre decisiones o desafíos]

### Tiempo

X horas Y minutos
```

---

## 🎯 DIFERENCIA ANTES/DESPUÉS

**ANTES:**
```typescript
export async function POST(request: NextRequest) {
  let webhookLogId: string | undefined

  try {
    const body = await request.json()

    // Registrar evento
    const webhookLog = await ConversationService.logWebhookEvent(...)
    webhookLogId = webhookLog.id

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry?.[0]?.changes?.[0]?.value
      const message = entries?.messages?.[0]

      if (message) {
        const phoneNumber = message.from
        const messageType = message.type
        const whatsappId = message.id

        // Obtener o crear usuario
        const user = await ConversationService.getOrCreateUser(...)

        // Obtener o crear conversación
        let conversation = await ConversationService.getOrCreateConversation(...)

        // RESET DE SESIÓN...
        const lastMessage = await ConversationService.getLastMessage(...)
        if (lastMessage && lastMessage.timestamp) {
          const timeSinceLastMessage = Date.now() - new Date(lastMessage.timestamp).getTime()
          if (timeSinceLastMessage > INACTIVITY_TIMEOUT) {
            await ConversationService.closeConversation(...)
            conversation = await ConversationService.getOrCreateConversation(...)
          }
        }

        // EXTRAER CONTENIDO...
        let messageContent = ''
        let mediaUrl: string | undefined
        // ... 30 líneas más de switch/case ...

        // GUARDAR MENSAJE...
        const savedMessage = await ConversationService.saveMessage(...)

        // VERIFICAR HORARIOS...
        const estadoHorario = HorariosService.estaAbierto()
        // ... 20 líneas más ...

        // VERIFICAR MODO MANUAL...
        if (conversation.botMode === 'manual') {
          // ...
        }

        // VERIFICAR COMANDO...
        if (messageContent.startsWith('/')) {
          // ...
        }

        // PROCESAR CON IA...
        if (messageType === 'text' || messageType === 'audio') {
          let textToProcess = messageContent

          if (messageType === 'audio' && mediaUrl) {
            // TRANSCRIBIR...
            const audioData = await downloadWhatsAppMedia(mediaUrl)
            // ... transcription logic ...
          }

          // OBTENER CONTEXTO...
          const context = await AIService.getConversationContext(...)

          // PROCESAR CON IA...
          const aiResult = await AIService.processMessage(...)

          // DETERMINAR CÓMO RESPONDER...
          let audioSent = false
          if (messageType === 'audio') {
            // GENERAR TTS...
            const ttsResult = await AIService.textToSpeech(...)
            // ... TTS logic ...
          } else {
            // ENVIAR TEXTO...
            await sendWhatsAppMessage(phoneNumber, aiResult.response)
          }

          // GUARDAR MENSAJE SALIENTE...
          await ConversationService.saveMessage(...)
        }

        // ... más lógica ...
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

**DESPUÉS (Component 5):**
```typescript
export async function POST(request: NextRequest) {
  try {
    // Validar HMAC + Rate Limiting
    const authResult = await webhookAuthMiddleware(request)
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: getHttpStatus(authResult) }
      )
    }

    // Procesar webhook
    const body = await request.json()
    const result = await whatsAppService.processWebhookPayload(body)

    return NextResponse.json({
      success: result.success,
      type: result.type,
      message: result.message,
      details: result.details,
    })
  } catch (error) {
    logError(whatsappLogger, error, { stage: 'webhook-post' })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Diferencia:**
- ❌ 500+ líneas → ✅ 20 líneas
- ❌ Lógica duplicada → ✅ Servicios reutilizables
- ❌ Difícil mantener → ✅ Fácil entender
- ❌ Sin seguridad → ✅ HMAC + Rate Limit

---

## 🎯 PRÓXIMOS PASOS (Para CLAUDE)

Una vez aprobado Component 5:
1. Component 6: Final Integration + Commit
2. GEMINI: E2E tests con todo integrado
3. Push a GitHub con commit formal

---

**¿LISTO PARA EMPEZAR?**

Confirma que:
- [ ] Entiendes qué es refactorización
- [ ] Tienes claros los servicios a usar
- [ ] Sabes qué código eliminar
- [ ] Sabes qué código mantener
- [ ] Entiendes el flujo new
- [ ] ¿Preguntas? Pregunta ahora

**¡Adelante CODEX! 🚀**
