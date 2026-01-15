# 📋 COMPONENTE 2: MessageProcessorService

**Para**: CODEX (Backend/Services Specialist)
**Status**: 🟢 LISTO PARA IMPLEMENTACIÓN
**Fecha**: 15 de Enero de 2026
**Priority**: ALTA (Bloqueador para Component 3)

---

## 🎯 Objetivo

Implementar **MessageProcessorService** - el servicio central que procesa mensajes entrantes desde el webhook de WhatsApp, orquestando:
1. Transcripción de audio (Whisper)
2. Procesamiento con IA (PerplexityService)
3. Generación de respuesta de texto/audio

Este servicio **reemplazará la lógica inline** del webhook actual y permitirá reutilización en otros contextos.

---

## 📊 Especificación Técnica

### Ubicación del Archivo
```
src/services/MessageProcessorService.ts
```

### Clase Principal
```typescript
export class MessageProcessorService {
  // Métodos requeridos...
}

export const messageProcessorService = new MessageProcessorService()
```

### Interfaces Requeridas

```typescript
// Entrada principal
export interface ProcessMessageInput {
  messageContent: string
  messageType: 'text' | 'audio' | 'image' | 'document' | 'video'
  mediaUrl?: string
  mediaPath?: string
  mediaMimeType?: string
  userId: string
  conversationId: string
  phoneNumber: string
  whatsappId: string
}

// Resultado del procesamiento
export interface ProcessMessageResult {
  success: boolean
  response: string
  audioPath?: string
  audioSent?: boolean
  intent?: string
  entities?: Record<string, unknown>
  error?: string
  details?: {
    transcriptionText?: string
    processingTime?: number
    aiProvider?: 'perplexity' | 'claude' | 'fallback'
  }
}

// Opciones de procesamiento
export interface ProcessingOptions {
  includeAudio?: boolean
  maxTextLength?: number
  timeout?: number
  fallbackToText?: boolean
}
```

---

## 🔧 Métodos Requeridos

### 1. **Método Principal: `processMessage()`**

```typescript
async processMessage(
  input: ProcessMessageInput,
  options?: ProcessingOptions
): Promise<ProcessMessageResult>
```

**Lógica (HIGH LEVEL):**
```
1. Validar entrada
2. Si messageType === 'audio':
   a. Transcribir audio con Whisper
   b. Actualizar messageContent con transcripción
   c. Si transcripción falla → return early con error
3. Obtener contexto de conversación (últimos 10 mensajes)
4. Procesar con PerplexityService
5. Si includeAudio && tipo original fue 'audio':
   a. Generar TTS
   b. Enviar audio
   c. Return with audioPath
6. Else:
   a. Return solo texto
7. Logging en cada paso con messageProcessorLogger
```

**Responsabilidades:**
- ✅ Orquestar el flujo completo
- ✅ Manejar errores en cada etapa
- ✅ Logging detallado
- ✅ Timeouts
- ✅ Fallbacks (si TTS falla, enviar texto)

---

### 2. **Método Privado: `transcribeAudio()`**

```typescript
private async transcribeAudio(
  mediaUrl: string,
  mimeType: string
): Promise<{
  success: boolean
  text?: string
  error?: string
}>
```

**Lógica:**
```
1. Descargar archivo de WhatsApp
2. Convertir a formato compatible con Whisper
3. Llamar a AIService.transcribeAudio()
4. Si falla → log error y return {success: false}
5. Limpiar archivos temporales
6. Return transcripción
```

**Consideraciones:**
- ✅ Usar `downloadWhatsAppMedia()` de `/lib/whatsapp`
- ✅ Manejar limpieza de archivos temporales
- ✅ Timeout para descargas (30s)
- ✅ Logging con messageProcessorLogger

---

### 3. **Método Privado: `generateResponse()`**

```typescript
private async generateResponse(
  messageContent: string,
  userId: string,
  conversationId: string
): Promise<{
  success: boolean
  response: string
  intent?: string
  entities?: Record<string, unknown>
  error?: string
}>
```

**Lógica:**
```
1. Obtener contexto de conversación (últimos 10 msgs)
2. Usar PerplexityService.generateResponse()
3. Extraer intent/entities de la respuesta
4. Si falla → usar fallback genérico
5. Return respuesta procesada
```

**Consideraciones:**
- ✅ Usar PerplexityService singleton
- ✅ Logging de cada paso
- ✅ Fallback respuesta si PerplexityService falla
- ✅ Extraer intent/entities si disponible

---

### 4. **Método Privado: `generateAudio()`**

```typescript
private async generateAudio(
  text: string
): Promise<{
  success: boolean
  audioPath?: string
  error?: string
  cleanup: () => void
}>
```

**Lógica:**
```
1. Limpiar texto (quitar emojis, firma del bot)
2. Truncar a 300 caracteres máximo
3. Llamar a AIService.textToSpeech()
4. Si falla → return {success: false}
5. Return ruta del archivo de audio
```

**Consideraciones:**
- ✅ Usar `AIService.textToSpeech()` existente
- ✅ Limpiar emojis y firma del bot
- ✅ Respetar límites de TTS
- ✅ Retornar función cleanup para temp files

---

### 5. **Método Privado: `getConversationContext()`**

```typescript
private async getConversationContext(
  userId: string,
  conversationId: string,
  limit: number = 10
): Promise<ConversationContext>
```

**Lógica:**
```
1. Obtener usuario desde BD
2. Obtener últimos N mensajes de la conversación
3. Construir ConversationContext
4. Return contexto
```

**Consideraciones:**
- ✅ Usar ConversationService existente
- ✅ Incluir nombre de usuario si disponible
- ✅ Incluir idioma si está en preferencias
- ✅ Limitar a últimos 10 mensajes para contexto

---

### 6. **Método Privado: `validateInput()`**

```typescript
private validateInput(input: ProcessMessageInput): {
  valid: boolean
  error?: string
}
```

**Validaciones:**
```
✓ messageContent no vacío
✓ messageType válido
✓ userId válido
✓ conversationId válido
✓ phoneNumber válido (10-15 dígitos)
✓ Si audio: mediaUrl o mediaPath proporcionado
```

---

### 7. **Método Público: `isConfigured()`**

```typescript
async isConfigured(): boolean
```

**Retorna:**
```
true si todos los servicios necesarios están configurados:
- PerplexityService.isConfigured()
- AIService.transcribeAudio() disponible
- AIService.textToSpeech() disponible
```

---

## 📝 Patrones a Seguir

### **Logging**

```typescript
import { messageProcessorLogger, logError } from '@/lib/logger'

// En messageProcessorLogger agregar a src/lib/logger.ts:
export const messageProcessorLogger = createLogger('message-processor')

// Uso:
messageProcessorLogger.info('Processing audio message', {
  userId,
  conversationId,
  mediaUrl
})

messageProcessorLogger.debug('Transcription result', {
  success: true,
  textLength: text.length
})

if (error) {
  logError(messageProcessorLogger, error, {
    stage: 'audio-transcription',
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
  logError(messageProcessorLogger, error, { context: 'relevant data' })
  return {
    success: false,
    error: 'User-friendly error message'
  }
}
```

### **Singleton Pattern**

```typescript
export class MessageProcessorService {
  constructor() {
    messageProcessorLogger.info('MessageProcessorService initialized')
  }
}

export const messageProcessorService = new MessageProcessorService()
```

### **TypeScript Strict Mode**

```typescript
// ✅ BIEN:
private phoneNumber: string
private timeout: number = 30000
private results: Map<string, ProcessMessageResult> = new Map()

// ❌ MAL:
private phoneNumber: any
private timeout
private results
```

---

## 🧪 Métodos que Necesitan Unit Tests

**Mínimo 80% de cobertura**

```
✓ processMessage() - caso exitoso
✓ processMessage() - audio con transcripción exitosa
✓ processMessage() - audio con transcripción fallida
✓ processMessage() - timeout en Perplexity
✓ processMessage() - fallback a texto cuando TTS falla
✓ transcribeAudio() - transcripción exitosa
✓ transcribeAudio() - error en descarga
✓ generateResponse() - respuesta exitosa
✓ generateResponse() - error en Perplexity
✓ generateAudio() - audio exitoso
✓ generateAudio() - error en TTS
✓ validateInput() - validación correcta
✓ validateInput() - entrada inválida
```

---

## 📂 Archivos que Necesitarán Cambios

### Cambios Necesarios en Otros Archivos:

**1. `src/lib/logger.ts`**
```typescript
// Agregar nueva línea:
export const messageProcessorLogger = createLogger('message-processor')
```

**2. `src/types/schemas.ts`**
```typescript
// Copiar las nuevas interfaces (ProcessMessageInput, ProcessMessageResult, ProcessingOptions)
// al final del archivo después de AIResponse
```

---

## ✅ Checklist de Aceptación

Antes de marcar como "Done", CODEX debe verificar:

- [ ] Archivo `src/services/MessageProcessorService.ts` creado (máx 400 líneas)
- [ ] Clase `MessageProcessorService` con singleton export
- [ ] 7 métodos implementados (1 público, 6 privados)
- [ ] Todas las interfaces definidas en tipos
- [ ] `messageProcessorLogger` añadido a `src/lib/logger.ts`
- [ ] Winston logging en cada método
- [ ] Error handling robusto con logError()
- [ ] TypeScript strict mode cumplido
- [ ] Jsdoc comments en métodos públicos
- [ ] Unit tests escritos (mínimo 80% cobertura)
- [ ] Build: `npm run build` → ✅ SUCCESS
- [ ] No hay nuevos lint errors en el archivo

---

## 🔗 Dependencias Existentes

**Servicios que DEBE usar:**

```typescript
import { PerplexityService, perplexityService } from '@/services/PerplexityService'
import { AIService } from '@/lib/ai'
import { ConversationService } from '@/lib/conversation'
import { sendWhatsAppMessage, downloadWhatsAppMedia, sendWhatsAppAudio } from '@/lib/whatsapp'
import { messageProcessorLogger, logError } from '@/lib/logger'
import { ProcessMessageInput, ProcessMessageResult, ProcessingOptions, ConversationContext } from '@/types/schemas'
```

**No crear duplicados - usar servicios existentes**

---

## 📊 Flujo Visual del Servicio

```
┌─ Webhook (POST /api/whatsapp/webhook)
│
├─ processMessage(input)
│  │
│  ├─ validateInput()
│  │
│  ├─ Si audio:
│  │  ├─ transcribeAudio()
│  │  │  ├─ downloadWhatsAppMedia()
│  │  │  ├─ AIService.transcribeAudio()
│  │  │  └─ Cleanup temp files
│  │  └─ updateMessageContent()
│  │
│  ├─ getConversationContext()
│  │
│  ├─ generateResponse()
│  │  ├─ PerplexityService.generateResponse()
│  │  └─ Extract intent/entities
│  │
│  ├─ Si messageType original === 'audio':
│  │  ├─ generateAudio()
│  │  │  ├─ AIService.textToSpeech()
│  │  │  └─ Cleanup temp files
│  │  └─ Return audioPath
│  │
│  └─ Return ProcessMessageResult
│
└─ Webhook envía respuesta al usuario
```

---

## 🎁 Bonus Points

Si terminas rápido, considera:

1. **Caché de transcripciones**: Evitar retranscribir audios duplicados
2. **Metrics**: Rastrear tiempo promedio de procesamiento
3. **Circuit breaker**: Si PerplexityService falla N veces, usar fallback automático
4. **Batching**: Procesamiento paralelo de múltiples mensajes

---

## 📧 Reporte Esperado

Cuando termines, reporta formato TEAM.md:

```
# REPORTE COMPONENT 2 - CODEX

## Status: ✅ COMPLETADO

### Implementación
- Archivo: src/services/MessageProcessorService.ts (XXX líneas)
- Métodos: 7 (1 público, 6 privados)
- Logging: ✅ Implementado en todos
- Error handling: ✅ Robusto con fallbacks

### Testing
- Unit tests: ✅ XX/XX métodos
- Coverage: XX%
- npm run build: ✅ SUCCESS
- npm run lint: ✅ No new errors

### Observaciones
[Cualquier nota sobre decisiones o desafíos encontrados]

### Tiempo estimado gastado
[X horas Y minutos]
```

---

## 🚀 Próximos Pasos (Para CLAUDE)

Una vez aprobado Component 2:
1. QWEN: Actualizar UI si es necesario
2. GEMINI: Integration tests con webhook
3. CODEX: Component 3 (WhatsAppService)

---

**¿LISTO PARA EMPEZAR?**

Confirma que:
- [ ] Entiendes el flujo completo
- [ ] Tienes claro cuáles métodos implementar
- [ ] Sabes qué tests escribir
- [ ] Tienes preguntas? Pregunta ahora

Adelante! 🚀
