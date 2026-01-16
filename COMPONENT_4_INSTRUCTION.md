# 📋 COMPONENTE 4: HMAC Validation + Rate Limiting

**Para**: CODEX (Backend/Services Specialist)
**Status**: 🟢 LISTO PARA IMPLEMENTACIÓN
**Fecha**: 15 de Enero de 2026
**Priority**: 🔴 CRÍTICA (Seguridad - DEBE estar antes de producción)

---

## 🎯 OBJETIVO

Implementar **seguridad del webhook de WhatsApp** mediante:

1. **HMAC Validation**: Verificar que los webhooks vienen realmente de WhatsApp
2. **Rate Limiting**: Prevenir abuso por usuario, teléfono o IP
3. **Detección de Abuso**: Alertas cuando se detecta actividad sospechosa

```
Webhook POST (sin validar)
    ↓
HMACValidator.validateSignature()  ← Rechazar si no es de WhatsApp
    ↓ (válido)
RateLimiter.checkLimit()           ← Rechazar si excede límite
    ↓ (dentro de límite)
WhatsAppService.processWebhookPayload()
    ↓
Respuesta al usuario
```

---

## 📊 ESPECIFICACIÓN TÉCNICA

### Ubicación de Archivos

```
src/services/HMACValidator.ts          (NUEVO)
src/services/RateLimiter.ts            (NUEVO)
src/middleware/webhook-auth.ts         (NUEVO)
```

### Interfaces Requeridas (ir a src/types/schemas.ts)

```typescript
// Validación HMAC
export interface HMACValidationResult {
  valid: boolean
  error?: string
  timestamp?: number
  appId?: string
}

// Rate Limiting
export interface RateLimitConfig {
  windowMs: number          // Ventana de tiempo en ms (ej: 60000 = 1 min)
  maxRequests: number       // Máximo de requests por ventana
  message?: string          // Mensaje de error personalizado
  skipSuccessfulRequests?: boolean  // Contar solo fallidas
  skipFailedRequests?: boolean      // Contar solo exitosas
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  error?: string
}

// Almacenamiento de intentos
export interface RateLimitStore {
  key: string               // user_id, phone_number, ip
  count: number
  firstRequestTime: number
  lastRequestTime: number
  isBlocked?: boolean
  blockUntil?: number
}
```

---

## 🔧 MÉTODOS REQUERIDOS

### **Clase 1: HMACValidator**

#### 1. **Método: `validateSignature()`**

```typescript
/**
 * Valida la firma HMAC del webhook de WhatsApp
 *
 * WhatsApp envía:
 * Header: X-Hub-Signature-256: sha256=<signature>
 * Body: JSON payload
 *
 * Nosotros verificamos que el HMAC es válido
 */
static validateSignature(
  payload: string,                    // Raw body como string
  signature: string,                  // Header X-Hub-Signature-256
  webhookSecret: string              // process.env.WHATSAPP_WEBHOOK_SECRET
): HMACValidationResult
```

**Lógica:**
```
1. Extraer algoritmo y hash del signature
   - signature = "sha256=abc123def456..."
   - algoritmo = "sha256"
   - hashRecibido = "abc123def456..."

2. Crear HMAC usando payload + webhookSecret
   - hashCalculado = HMAC-SHA256(payload, webhookSecret)

3. Comparar en tiempo constante (evitar timing attacks)
   - hashCalculado === hashRecibido ?
   - return {valid: true}
   - return {valid: false, error: "Signature inválida"}

4. Logging
   - Si válido: log info
   - Si inválido: log warn con IP source si está disponible
```

**Nota**: Usar `crypto.timingSafeEqual()` para comparar hashes

---

#### 2. **Método: `isConfigured()`**

```typescript
static isConfigured(): boolean
```

**Lógica:**
```
return !!process.env.WHATSAPP_WEBHOOK_SECRET
```

---

### **Clase 2: RateLimiter**

#### 1. **Constructor y Inicialización**

```typescript
export class RateLimiter {
  private store: Map<string, RateLimitStore> = new Map()

  constructor(
    private config: RateLimitConfig = {
      windowMs: 60_000,           // 1 minuto
      maxRequests: 100,           // máx 100 requests
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  ) {
    this.initializeCleanup()
  }

  private initializeCleanup(): void
    // Limpiar entradas expiradas cada 5 minutos
```

---

#### 2. **Método: `checkLimit()`**

```typescript
/**
 * Verifica si se ha excedido el límite de rate limiting
 */
checkLimit(
  key: string,              // user_id, phone_number o ip
  options?: {
    isSuccess?: boolean     // ¿Fue exitoso el request?
  }
): RateLimitResult
```

**Lógica:**
```
1. Obtener entrada del store (o crear nueva)
   store[key] = {
     count: 0,
     firstRequestTime: ahora,
     lastRequestTime: ahora
   }

2. Verificar si está bloqueado temporalmente
   if (store[key].isBlocked && Date.now() < blockUntil) {
     return {allowed: false, ...}
   }

3. Verificar si ventana expiró
   if (Date.now() - firstRequestTime > windowMs) {
     // Resetear contador
     store[key].count = 0
     store[key].firstRequestTime = Date.now()
   }

4. Incrementar contador (según skipSuccessfulRequests/skipFailedRequests)
   if (!skipSuccessfulRequests || !isSuccess) {
     count++
   }

5. Verificar si excedió límite
   if (count > maxRequests) {
     // Bloquear por 15 minutos
     store[key].isBlocked = true
     store[key].blockUntil = Date.now() + (15 * 60 * 1000)
     return {allowed: false, error: "Rate limit exceeded"}
   }

6. Return información de límite
   return {
     allowed: true,
     limit: maxRequests,
     remaining: maxRequests - count,
     resetTime: firstRequestTime + windowMs
   }
```

---

#### 3. **Método: `cleanup()`**

```typescript
private cleanup(): void
```

**Lógica:**
```
1. Iterar sobre todas las entradas del store
2. Si la entrada expiró (firstRequestTime + 2*windowMs < ahora):
   - Eliminar del store
3. Si está bloqueada pero blockUntil ya pasó:
   - Desbloquear
```

---

#### 4. **Método: `reset()`**

```typescript
reset(key: string): void
```

**Lógica:**
```
1. Eliminar entrada del store para clave
   delete store[key]
```

---

#### 5. **Método: `getStatus()`**

```typescript
getStatus(key: string): {
  count: number
  limit: number
  remaining: number
  isBlocked: boolean
  blockUntil?: number
}
```

---

### **Middleware: WebhookAuth**

```typescript
/**
 * Middleware para validar HMAC y aplicar rate limiting
 */
export async function webhookAuthMiddleware(
  request: NextRequest,
  userId?: string,
  phoneNumber?: string
): Promise<{
  valid: boolean
  error?: string
  rateLimitInfo?: RateLimitResult
}>
```

**Lógica:**
```
1. Obtener signature del header
   signature = request.headers.get('X-Hub-Signature-256')
   if (!signature) {
     log.warn("Missing signature header")
     return {valid: false, error: "Missing signature"}
   }

2. Obtener raw body como string
   body = await request.text()

3. Validar HMAC
   hmacResult = HMACValidator.validateSignature(
     body,
     signature,
     process.env.WHATSAPP_WEBHOOK_SECRET
   )
   if (!hmacResult.valid) {
     log.warn("Invalid HMAC signature")
     return {valid: false, error: "Invalid signature"}
   }

4. Aplicar rate limiting por:
   a. Por usuario (si phoneNumber disponible)
   b. Por IP (request.ip)
   c. Combinado (phone_number + user_id)

5. Return resultado
   return {
     valid: true,
     rateLimitInfo: rateLimitResult
   }
```

---

## 📝 PATRONES A SEGUIR

### **Logging**

```typescript
import { whatsappLogger, logError } from '@/lib/logger'

// HMAC Validator
whatsappLogger.info('HMAC validation passed', {
  appId: result.appId,
  timestamp: result.timestamp
})

whatsappLogger.warn('HMAC validation failed', {
  ip: request.ip,
  reason: 'Invalid signature'
})

// Rate Limiter
whatsappLogger.info('Rate limit check', {
  key: phoneNumber,
  allowed: result.allowed,
  remaining: result.remaining
})

if (!result.allowed) {
  whatsappLogger.warn('Rate limit exceeded', {
    key: phoneNumber,
    blockUntil: result.resetTime
  })
}
```

### **Uso de Crypto**

```typescript
import crypto from 'crypto'

// Crear HMAC
const hmac = crypto.createHmac('sha256', secret)
hmac.update(payload)
const hash = hmac.digest('hex')

// Comparar en tiempo constante
const isValid = crypto.timingSafeEqual(
  Buffer.from(hash),
  Buffer.from(receivedHash)
)
```

### **Singleton Pattern para Rate Limiter**

```typescript
export const rateLimiter = new RateLimiter({
  windowMs: 60_000,      // 1 minuto
  maxRequests: 100,      // Por usuario
})
```

---

## 🧪 MÉTODOS QUE NECESITAN UNIT TESTS

**Mínimo 80% de cobertura**

```
HMACValidator:
✓ validateSignature() - firma válida
✓ validateSignature() - firma inválida
✓ validateSignature() - signature malformada
✓ validateSignature() - payload vacío
✓ isConfigured() - secreto configurado
✓ isConfigured() - secreto no configurado

RateLimiter:
✓ checkLimit() - primer request
✓ checkLimit() - dentro del límite
✓ checkLimit() - excede límite
✓ checkLimit() - bloqueo temporal
✓ checkLimit() - ventana expirada
✓ reset() - limpiar entrada
✓ cleanup() - remover entradas expiradas
✓ getStatus() - obtener estado

Middleware:
✓ webhookAuthMiddleware() - válido
✓ webhookAuthMiddleware() - HMAC inválido
✓ webhookAuthMiddleware() - rate limit excedido
```

---

## 📂 ARCHIVOS QUE NECESITARÁN CAMBIOS

### Cambios Necesarios:

**1. `src/lib/logger.ts`** (si no existe)
```typescript
// Verificar que exista whatsappLogger
export const whatsappLogger = createLogger('whatsapp')
```

**2. `src/types/schemas.ts`**
```typescript
// Agregar 4 interfaces
export interface HMACValidationResult { ... }
export interface RateLimitConfig { ... }
export interface RateLimitResult { ... }
export interface RateLimitStore { ... }
```

**3. Archivos nuevos**
```
src/services/HMACValidator.ts
src/services/RateLimiter.ts
src/middleware/webhook-auth.ts
src/services/__tests__/HMACValidator.test.ts
src/services/__tests__/RateLimiter.test.ts
```

---

## ✅ CHECKLIST DE ACEPTACIÓN

Antes de marcar como "Done", CODEX debe verificar:

**HMACValidator:**
- [ ] Archivo `src/services/HMACValidator.ts` creado
- [ ] Método `validateSignature()` implementado
- [ ] Usa `crypto.timingSafeEqual()` para comparar
- [ ] Logging correcto
- [ ] Maneja errores

**RateLimiter:**
- [ ] Archivo `src/services/RateLimiter.ts` creado
- [ ] Singleton export: `export const rateLimiter = new RateLimiter()`
- [ ] Método `checkLimit()` implementado
- [ ] Método `cleanup()` con interval de 5 minutos
- [ ] Método `reset()` implementado
- [ ] Método `getStatus()` implementado
- [ ] Bloqueo temporal después de exceder límite

**Middleware:**
- [ ] Archivo `src/middleware/webhook-auth.ts` creado
- [ ] Función `webhookAuthMiddleware()` implementada
- [ ] Valida HMAC
- [ ] Aplica rate limiting
- [ ] Logging correcto

**Testing:**
- [ ] Unit tests para HMACValidator (6+ casos)
- [ ] Unit tests para RateLimiter (9+ casos)
- [ ] Unit tests para middleware (3+ casos)
- [ ] Cobertura mínima 80%
- [ ] `npm run test` → PASS

**Build & Lint:**
- [ ] Build: `npm run build` → ✅ SUCCESS
- [ ] Lint: No nuevos errores
- [ ] TypeScript strict mode cumplido
- [ ] Jsdoc comments en métodos públicos

---

## 🔗 DEPENDENCIAS

**Módulos existentes:**
```typescript
import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { whatsappLogger, logError } from '@/lib/logger'
```

**Que CODEX debe definir:**
```typescript
import { HMACValidationResult, RateLimitConfig, RateLimitResult, RateLimitStore } from '@/types/schemas'
```

---

## 📊 FLUJO VISUAL

```
Webhook POST (con header X-Hub-Signature-256)
    ↓
webhookAuthMiddleware()
    ├─ Extraer signature
    ├─ HMACValidator.validateSignature()
    │  ├─ Crear HMAC con payload
    │  ├─ Comparar con timingSafeEqual
    │  └─ Si inválido → REJECT 401
    ├─ Si válido, obtener phoneNumber de payload
    ├─ rateLimiter.checkLimit(phoneNumber)
    │  ├─ Verificar si bloqueado
    │  ├─ Verificar ventana de tiempo
    │  ├─ Incrementar contador
    │  └─ Si excede → REJECT 429
    └─ Si todo OK → middleware.next()
        ↓
    WhatsAppService.processWebhookPayload()
        ↓
    Respuesta al usuario
```

---

## 💡 CONSIDERACIONES DE SEGURIDAD

**HMAC:**
- ✅ Usar `crypto.timingSafeEqual()` - previene timing attacks
- ✅ Comparar en tiempo constante
- ✅ No usar `===` para comparar hashes

**Rate Limiting:**
- ✅ Bloqueo temporal de 15 minutos después de exceder
- ✅ Limpiar automáticamente entradas expiradas
- ✅ Logging de intentos rechazados
- ✅ Contador por usuario (no solo IP)

**Respuestas HTTP:**
- ✅ 401 Unauthorized - HMAC inválido
- ✅ 429 Too Many Requests - Rate limit excedido
- ✅ 200 OK - Válido

---

## 📧 REPORTE ESPERADO

Cuando termines, reporta así:

```markdown
# REPORTE COMPONENT 4 - CODEX

## Status: ✅ COMPLETADO

### Implementación

#### HMACValidator
- Archivo: src/services/HMACValidator.ts (XX líneas)
- Métodos: 2 (validateSignature, isConfigured)
- Logging: ✅ Winston

#### RateLimiter
- Archivo: src/services/RateLimiter.ts (XX líneas)
- Métodos: 5 (checkLimit, cleanup, reset, getStatus, constructor)
- Auto-cleanup: ✅ Cada 5 minutos
- Bloqueo temporal: ✅ 15 minutos

#### Middleware
- Archivo: src/middleware/webhook-auth.ts (XX líneas)
- Valida HMAC: ✅
- Aplica rate limiting: ✅

### Archivos Modificados/Creados
- ✅ src/services/HMACValidator.ts (NUEVO)
- ✅ src/services/RateLimiter.ts (NUEVO)
- ✅ src/middleware/webhook-auth.ts (NUEVO)
- ✅ src/types/schemas.ts (agregadas 4 interfaces)
- ✅ src/services/__tests__/HMACValidator.test.ts (NUEVO)
- ✅ src/services/__tests__/RateLimiter.test.ts (NUEVO)

### Testing
- Unit tests: ✅ XX casos
- Coverage: XX%
- npm run build: ✅ SUCCESS
- npm run test: ✅ PASS
- npm run lint: ✅ No new errors

### Observaciones
[Cualquier nota sobre decisiones técnicas o desafíos]

### Tiempo gastado
X horas Y minutos
```

---

## 🚀 PRÓXIMOS PASOS (Para CLAUDE)

Una vez aprobado Component 4:
1. CODEX: Component 5 - Refactorizar webhook route
2. Integrar HMACValidator + RateLimiter en webhook
3. GEMINI: E2E tests con validación HMAC
4. Component 6: Final integration

---

**¿LISTO PARA EMPEZAR?**

Confirma que:
- [ ] Entiendes cómo funciona HMAC validation
- [ ] Entiendes cómo funciona rate limiting
- [ ] Tienes claros los métodos a implementar
- [ ] Sabes qué tests escribir
- [ ] ¿Preguntas? Pregunta ahora

**¡Adelante CODEX! 🔐🚀**
