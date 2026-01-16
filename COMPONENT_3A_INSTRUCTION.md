# 📋 COMPONENTE 3A: WhatsAppService

**Para**: CODEX (Backend/Services Specialist)
**Status**: 🟢 LISTO PARA IMPLEMENTACIÓN
**Fecha**: 15 de Enero de 2026
**Priority**: ALTA (Orquestador central de WhatsApp)

---

## 🎯 OBJETIVO

Implementar **WhatsAppService** - el servicio orquestador central que coordina todo el procesamiento de mensajes de WhatsApp:

```
Webhook POST
    ↓
WhatsAppService.processIncomingMessage()
    ├─ Validar webhook
    ├─ Verificar horarios
    ├─ Obtener/crear usuario
    ├─ Obtener/crear conversación
    ├─ MessageProcessorService.processMessage()
    ├─ Guardar en BD
    └─ Responder a usuario
```

Este servicio **encapsula toda la lógica de orquestación** y permitirá que el webhook route sea **limpio y simple**.

---

## 📊 ESPECIFICACIÓN TÉCNICA

### Ubicación del Archivo
```
src/services/WhatsAppService.ts
```

### Clase Principal
```typescript
export class WhatsAppService {
  // Métodos requeridos...
}

export const whatsAppService = new WhatsAppService()
```

### Interfaces Requeridas (ir a src/types/schemas.ts)

```typescript
// Entrada al servicio
export interface WhatsAppMessagePayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: 'text' | 'audio' | 'image' | 'video' | 'document' | 'location'
          text?: { body: string }
          audio?: { id: string; mime_type: string; sha256: string }
          image?: { id: string; mime_type: string; sha256: string; caption?: string }
          video?: { id: string; mime_type: string; sha256: string; caption?: string }
          document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string }
          location?: { latitude: number; longitude: number; name?: string; address?: string }
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

// Resultado del procesamiento
export interface WhatsAppProcessResult {
  success: boolean
  message?: string
  type?: string  // 'text' | 'audio' | 'error' | 'out_of_hours' | 'manual_mode' | 'duplicate' | 'status_update'
  error?: string
  details?: {
    userId?: string
    conversationId?: string
    webhookLogId?: string
    processingTime?: number
  }
}

// Configuración de respuesta
export interface WhatsAppResponseConfig {
  includeAudio?: boolean
  maxTextLength?: number
  respectHours?: boolean  // Si false, ignora horarios
  forceManualMode?: boolean
}
```

---

## 🔧 MÉTODOS REQUERIDOS

### 1. **Método Principal: `processWebhookPayload()`**

```typescript
async processWebhookPayload(
  payload: WhatsAppMessagePayload,
  config?: WhatsAppResponseConfig
): Promise<WhatsAppProcessResult>
```

**Lógica (HIGH LEVEL):**
```
1. Validar estructura del payload
2. Extraer datos del mensaje (from, type, content, etc)
3. Verificar si es mensaje o status update
4. Si es status update:
   a. Actualizar estado en BD
   b. Return early
5. Si es mensaje:
   a. Obtener/crear usuario
   b. Obtener/crear conversación
   c. Verificar horarios (si respectHours=true)
   d. Si fuera de horario → enviar msg automático
   e. Verificar modo manual
   f. Verificar si es comando (/)
   g. MessageProcessorService.processMessage()
   h. Guardar respuesta en BD
   i. Enviar respuesta al usuario
6. Return resultado con metadata
```

**Responsabilidades:**
- ✅ Orquestar flujo completo
- ✅ Manejar errores en cada etapa
- ✅ Logging detallado con whatsappLogger
- ✅ Validación de webhook
- ✅ Verificación de horarios
- ✅ Manejo de modo manual
- ✅ Procesamiento de comandos

---

### 2. **Método Privado: `validateWebhookPayload()`**

```typescript
private validateWebhookPayload(payload: WhatsAppMessagePayload): {
  valid: boolean
  error?: string
  type?: 'message' | 'status' | 'invalid'
}
```

**Validaciones:**
```
✓ Estructura básica válida
✓ Contiene entry y changes
✓ Tiene messages O statuses
✓ Mensaje tiene from, id, timestamp
✓ Tipo de mensaje es soportado
```

---

### 3. **Método Privado: `getOrCreateUser()`**

```typescript
private async getOrCreateUser(
  phoneNumber: string,
  name?: string
): Promise<{
  success: boolean
  user?: any  // Usuario de BD
  error?: string
}>
```

**Lógica:**
```
1. Buscar usuario por phoneNumber
2. Si existe → return
3. Si no existe:
   a. Crear nuevo usuario
   b. Usar name si está disponible
   c. Guardar en BD
4. Return usuario
```

---

### 4. **Método Privado: `getOrCreateConversation()`**

```typescript
private async getOrCreateConversation(
  userId: string
): Promise<{
  success: boolean
  conversation?: any
  error?: string
}>
```

**Lógica:**
```
1. Buscar conversación activa para usuario
2. Si existe → return
3. Si no existe:
   a. Crear nueva conversación
   b. Marcar como activa
   c. Guardar en BD
4. Return conversación
```

---

### 5. **Método Privado: `handleSessionTimeout()`**

```typescript
private async handleSessionTimeout(
  conversation: any
): Promise<{
  needsReset: boolean
  newConversation?: any
}>
```

**Lógica:**
```
1. Obtener último mensaje de conversación
2. Calcular tiempo desde entonces
3. Si > 24 horas:
   a. Cerrar conversación anterior
   b. Crear nueva conversación
   c. Return {needsReset: true, newConversation}
4. Else:
   a. Return {needsReset: false}
```

---

### 6. **Método Privado: `extractMessageContent()`**

```typescript
private extractMessageContent(message: any): {
  content: string
  type: string
  mediaUrl?: string
  mediaMimeType?: string
  caption?: string
}
```

**Lógica:**
```
1. Switch por message.type:
   - 'text' → content = message.text.body
   - 'audio' → content = '[Audio]', mediaUrl = message.audio.id
   - 'image' → content = caption o '[Imagen]', mediaUrl = message.image.id
   - 'document' → content = filename o '[Documento]', mediaUrl = message.document.id
   - 'location' → content = '[Ubicación: lat, lon]'
   - default → content = '[Tipo no soportado]'
2. Return con metadatos
```

---

### 7. **Método Privado: `checkBusinessHours()`**

```typescript
private checkBusinessHours(): {
  isOpen: boolean
  message?: string  // Mensaje automático si está cerrado
}
```

**Lógica:**
```
1. Usar HorariosService.estaAbierto()
2. Si está cerrado:
   a. Return {isOpen: false, message: mensajeAutomático}
3. Si está cerca de cerrar:
   a. Return {isOpen: true, message: avisoDeUrgencia}
4. Else:
   a. Return {isOpen: true}
```

---

### 8. **Método Privado: `handleCommand()`**

```typescript
private async handleCommand(
  command: string,
  userId: string
): Promise<{
  handled: boolean
  response?: string
}>
```

**Lógica:**
```
1. Si messageContent.startsWith('/'):
   a. Usar AIService.handleCommand()
   b. Return respuesta
2. Else:
   a. Return {handled: false}
```

---

### 9. **Método Privado: `saveMessage()`**

```typescript
private async saveMessage(
  conversationId: string,
  userId: string,
  type: string,
  content: string,
  direction: 'inbound' | 'outbound',
  metadata?: Record<string, any>
): Promise<{
  success: boolean
  messageId?: string
  error?: string
}>
```

**Lógica:**
```
1. Construir objeto de mensaje
2. Guardar en BD via ConversationService
3. Return resultado
```

---

### 10. **Método Privado: `sendResponse()`**

```typescript
private async sendResponse(
  phoneNumber: string,
  response: {
    text: string
    audioPath?: string
  }
): Promise<{
  success: boolean
  error?: string
}>
```

**Lógica:**
```
1. Si response.audioPath:
   a. sendWhatsAppAudio(phoneNumber, audioPath)
2. Else:
   a. sendWhatsAppMessage(phoneNumber, text)
3. Return resultado
```

---

### 11. **Método Público: `isConfigured()`**

```typescript
async isConfigured(): Promise<boolean>
```

**Retorna:**
```
true si todos los servicios necesarios están configurados:
- MessageProcessorService.isConfigured()
- WhatsApp API keys válidas
- BD accesible
```

---

## 📝 PATRONES A SEGUIR

### **Logging**

```typescript
import { whatsappLogger, logError } from '@/lib/logger'

// En logger.ts agregar:
export const whatsappLogger = createLogger('whatsapp')

// Uso:
whatsappLogger.info('Processing webhook message', {
  phoneNumber,
  messageType,
  conversationId
})

whatsappLogger.debug('Session timeout detected', {
  hoursInactive: Math.round(timeSinceLastMessage / 3600000)
})

if (error) {
  logError(whatsappLogger, error, {
    stage: 'message-processing',
    userId,
    conversationId
  })
}
```

### **Error Handling**

```typescript
try {
  const result = await someOperation()
} catch (error) {
  logError(whatsappLogger, error, { context: 'relevant data' })
  return {
    success: false,
    error: 'User-friendly error message'
  }
}
```

### **Singleton Pattern**

```typescript
export class WhatsAppService {
  constructor() {
    whatsappLogger.info('WhatsAppService initialized')
  }
}

export const whatsAppService = new WhatsAppService()
```

---

## 🧪 MÉTODOS QUE NECESITAN UNIT TESTS

**Mínimo 80% de cobertura**

```
✓ processWebhookPayload() - flujo completo exitoso
✓ processWebhookPayload() - con horarios cerrados
✓ processWebhookPayload() - modo manual
✓ processWebhookPayload() - comando (/)
✓ processWebhookPayload() - sesión expirada
✓ processWebhookPayload() - webhook duplicado
✓ processWebhookPayload() - status update
✓ extractMessageContent() - texto
✓ extractMessageContent() - audio
✓ extractMessageContent() - imagen con caption
✓ validateWebhookPayload() - payload válido
✓ validateWebhookPayload() - payload inválido
✓ checkBusinessHours() - abierto
✓ checkBusinessHours() - cerrado
✓ handleCommand() - comando válido
✓ handleCommand() - no es comando
```

---

## 📂 ARCHIVOS QUE NECESITARÁN CAMBIOS

### Cambios Necesarios:

**1. `src/lib/logger.ts`**
```typescript
// Agregar nueva línea:
export const whatsappLogger = createLogger('whatsapp')
```

**2. `src/types/schemas.ts`**
```typescript
// Agregar las 3 nuevas interfaces
export interface WhatsAppMessagePayload { ... }
export interface WhatsAppProcessResult { ... }
export interface WhatsAppResponseConfig { ... }
```

---

## ✅ CHECKLIST DE ACEPTACIÓN

Antes de marcar como "Done", CODEX debe verificar:

- [ ] Archivo `src/services/WhatsAppService.ts` creado (máx 500 líneas)
- [ ] Clase `WhatsAppService` con singleton export
- [ ] 11 métodos implementados (2 públicos, 9 privados)
- [ ] Todas las interfaces en `src/types/schemas.ts`
- [ ] `whatsappLogger` agregado a `src/lib/logger.ts`
- [ ] Winston logging en cada método
- [ ] Error handling robusto
- [ ] TypeScript strict mode cumplido
- [ ] Jsdoc comments en métodos públicos
- [ ] Unit tests escritos (mínimo 80% cobertura)
- [ ] Build: `npm run build` → ✅ SUCCESS
- [ ] Tests: `npm run test` → ✅ PASS
- [ ] No hay nuevos lint errors

---

## 🔗 DEPENDENCIAS EXISTENTES

**Servicios que DEBE usar:**

```typescript
import { messageProcessorService } from '@/services/MessageProcessorService'
import { AIService } from '@/lib/ai'
import { ConversationService } from '@/lib/conversation'
import { HorariosService } from '@/lib/horarios'
import { sendWhatsAppMessage, sendWhatsAppAudio, downloadWhatsAppMedia } from '@/lib/whatsapp'
import { whatsappLogger, logError } from '@/lib/logger'
import { WhatsAppMessagePayload, WhatsAppProcessResult, WhatsAppResponseConfig } from '@/types/schemas'
```

---

## 📊 FLUJO VISUAL

```
Webhook POST (payload)
  ↓
validateWebhookPayload()
  ├─ message or status?
  ├─ valid structure?
  ↓
Si status update:
  ├─ Update BD
  └─ Return early
  ↓
Si mensaje:
  ├─ extractMessageContent()
  ├─ getOrCreateUser()
  ├─ getOrCreateConversation()
  ├─ handleSessionTimeout()
  ├─ checkBusinessHours()
  │  ├─ Si cerrado → sendAutoResponse + return
  │  └─ Si abierto → continuar
  ├─ Verificar modo manual
  │  ├─ Si manual → no responder, return
  │  └─ Si auto → continuar
  ├─ handleCommand()
  │  ├─ Si comando → sendResponse + return
  │  └─ Si no → continuar
  ├─ messageProcessorService.processMessage()
  ├─ saveMessage() (respuesta)
  ├─ sendResponse()
  └─ Return resultado
```

---

## 📧 REPORTE ESPERADO

Cuando termines, reporta formato TEAM.md:

```markdown
# REPORTE COMPONENT 3A - CODEX

## Status: ✅ COMPLETADO

### Implementación
- Archivo: src/services/WhatsAppService.ts (XXX líneas)
- Métodos: 11 (2 públicos, 9 privados)
- Logging: ✅ Implementado en todos
- Error handling: ✅ Robusto

### Testing
- Unit tests: ✅ XX/XX métodos
- Coverage: XX%
- npm run build: ✅ SUCCESS
- npm run test: ✅ PASS

### Observaciones
[Cualquier nota sobre decisiones o desafíos]

### Tiempo estimado gastado
[X horas Y minutos]
```

---

## 🚀 PRÓXIMOS PASOS (Para CLAUDE)

Una vez aprobado Component 3A:
1. QWEN: Finalizar Component 3B (UI)
2. GEMINI: Integration tests con webhook
3. CODEX: Refactorizar webhook route para usar WhatsAppService

---

**¿LISTO PARA EMPEZAR?**

Confirma que:
- [ ] Entiendes el flujo completo del servicio
- [ ] Tienes claro cuáles métodos implementar
- [ ] Sabes qué tests escribir
- [ ] ¿Preguntas? Pregunta ahora

**¡Adelante CODEX! 🚀**
