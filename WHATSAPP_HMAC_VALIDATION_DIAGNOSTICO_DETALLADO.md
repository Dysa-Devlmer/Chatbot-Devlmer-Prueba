# 🔴 DIAGNÓSTICO DETALLADO: HMAC Validation Failure - ChatBot No Responde

**Fecha**: 16 de Enero de 2026 - 04:00 UTC
**Status**: 🔴 BLOQUEANTE - ChatBot rechazando todos los mensajes WhatsApp
**Urgencia**: MÁXIMA - Sin esto, el sistema NO funciona

---

## 📊 ESTADO ACTUAL DEL SISTEMA

```
Sistema Operativo:
├─ Next.js Server         ✅ ONLINE (pid: 30148, uptime: 23m)
├─ Ollama AI             ✅ ONLINE (pid: 29012, uptime: 55m)
├─ Cloudflare Tunnel     ✅ ONLINE (pid: 12484, uptime: 55m)
└─ WhatsApp Webhook      🔴 RECHAZANDO (HMAC validation fails)
```

---

## 🔴 PROBLEMA IDENTIFICADO

### The Core Issue

**Problema**: WhatsApp webhook validation falla en HMAC signature check

**Síntoma**: ChatBot rechaza TODOS los mensajes con error 401 Unauthorized

**Root Cause**:
```
WHATSAPP_WEBHOOK_SECRET en .env.local = DUMMY VALUE
Ejemplo actual: "mi_app_secret_para_hmac_validation_123"

WhatsApp envía HMAC usando: Tu App Secret REAL de Meta Dashboard
Servidor valida con: Dummy value que no coincide
Resultado: Hash mismatch → 401 rejection
```

---

## 📋 EVIDENCIA DE LOS LOGS

### Evento: Usuario envía mensaje WhatsApp a las 12:50 (00:50:22 UTC)

**Timestamp**: 2026-01-16 00:50:22

**Log Sequence**:

```json
{
  "timestamp": "2026-01-16 00:50:22",
  "message": "HMAC validation failed - hash mismatch",
  "level": "warn",
  "module": "whatsapp",
  "status": 401
}

{
  "timestamp": "2026-01-16 00:50:22",
  "message": "HMAC validation failed",
  "error": "Invalid signature",
  "ip": "2a03:2880:22ff:8::",
  "level": "warn",
  "status": 401
}

{
  "timestamp": "2026-01-16 00:50:22",
  "message": "Webhook auth failed",
  "error": "Invalid signature",
  "level": "warn",
  "status": 401
}
```

**Interpretación**:
- ✅ WhatsApp SÍ está enviando mensajes (IP 2a03:2880:22ff:8:: = Meta servers)
- ✅ Servidor SÍ recibe los webhooks
- 🔴 Firma HMAC NO coincide → Mensaje rechazado
- Result: Usuario envía mensaje pero ChatBot no responde

---

## 🔐 CÓMO FUNCIONA HMAC VALIDATION

### El Flujo

```
1. Usuario envía mensaje en WhatsApp
   ↓
2. WhatsApp calcula HMAC-SHA256 usando:
   - Mensaje completo (payload)
   - Tu App Secret (privado, solo Meta + tú sabes)
   ↓
3. WhatsApp envía webhook CON firma HMAC en header:
   X-Hub-Signature-256: sha256=abc123xyz789...
   ↓
4. ChatBot recibe webhook y DEBE:
   a) Extraer payload
   b) Calcular HMAC usando TU App Secret
   c) Comparar: "¿Calculado == Recibido?"
   ↓
5. SI coinciden → ✅ Mensaje es de WhatsApp
   SI no coinciden → 🔴 Mensaje rechazado (falsificado o secret incorrecto)
```

### Fórmula Matemática

```
HMAC-SHA256(mensaje, secret) = firma_esperada

WhatsApp enviado: sha256=X
Tu servidor calcula: sha256=Y

Si X == Y → ✅ VÁLIDO
Si X ≠ Y → 🔴 INVÁLIDO
```

### Tu Situación Actual

```
WhatsApp calcula con:
  secret_real = "abcd1234efgh5678ijkl9012mnop3456" (Tu App Secret en Meta)
  HMAC = sha256=(resultado_real)

Tu servidor calcula con:
  secret_config = "mi_app_secret_para_hmac_validation_123" (Dummy)
  HMAC = sha256=(resultado_dummy)

Comparación:
  resultado_real != resultado_dummy
  → "hash mismatch" → 401 rejection
```

---

## ✅ SOLUCIÓN: 3 PASOS

### PASO 1: Obtener tu App Secret Real

**Dónde**:
1. Ve a: https://developers.facebook.com/apps/
2. Selecciona tu aplicación WhatsApp
3. Settings → Basic
4. Busca: "App Secret"
5. Copia el valor

**Qué verás**:
```
App Secret: ••••••••••••••••••••••••••••••••••••••••
(mostrado como puntos por seguridad)

Hay un ícono 👁️ para mostrar/ocultar
CLICK para ver el valor completo
```

**Ejemplo de cómo se ve**:
```
App Secret: 12345678901234567890abcdefghijkl
```

---

### PASO 2: Actualizar .env.local

**Archivo**: `E:\prueba\.env.local`

**Busca la línea** (actualmente línea 5):
```
WHATSAPP_WEBHOOK_SECRET=mi_app_secret_para_hmac_validation_123
```

**Reemplázala con**:
```
WHATSAPP_WEBHOOK_SECRET=<tu_app_secret_real_aqui>
```

**Ejemplo real**:
```
WHATSAPP_WEBHOOK_SECRET=12345678901234567890abcdefghijkl
```

⚠️ **IMPORTANTE**:
- NO incluyas comillas
- NO dejes espacios al inicio/final
- Debe ser exactamente como aparece en Meta Dashboard

---

### PASO 3: Reiniciar Servidor

```bash
# Compilar con nueva configuración
npm run build

# Reiniciar con variables de entorno actualizadas
pm2 restart pithy-chatbot --update-env

# Verificar que arrancó
pm2 status
```

---

### PASO 4: Verificar (Opcional pero RECOMENDADO)

```bash
# Ver logs en tiempo real
pm2 logs pithy-chatbot --follow

# En otra terminal, envía un mensaje WhatsApp al número
# Deberías ver en logs:

# ✅ CORRECTO:
# {"message": "HMAC validation passed", "level": "info"}
# {"message": "Message received", "level": "info"}

# 🔴 INCORRECTO:
# {"message": "HMAC validation failed - hash mismatch", "level": "warn"}
```

---

## 🎯 TIMELINE

```
Antes (00:29-00:30):
  "WHATSAPP_WEBHOOK_SECRET not configured"
  → Secret completamente ausente

Ahora (00:50:22):
  "HMAC validation failed - hash mismatch"
  → Secret existe pero es INCORRECTO

Después (cuando actualices):
  "HMAC validation passed"
  → Secret es CORRECTO, chatbot responde
```

---

## 🚀 IMPACTO DE LA SOLUCIÓN

### Antes (Ahora - Sin solución):
```
Usuario → WhatsApp → Mensaje enviado
         ↓
     ChatBot → 401 Unauthorized
     ↓
Usuario NO recibe respuesta ❌
Tiempo esperado: <10 seg
Tiempo actual: ∞ (nunca llega)
```

### Después (Con solución):
```
Usuario → WhatsApp → Mensaje enviado
         ↓
     ChatBot → HMAC validation passed ✅
     ↓
     Procesa mensaje con Ollama/Perplexity
     ↓
Usuario recibe respuesta ✅
Tiempo esperado: 5-30 segundos
```

---

## ⚠️ POSIBLES ERRORES AL ACTUALIZAR

### Error 1: "App Secret no válido"
```
Síntoma: Sigue diciendo "hash mismatch"
Causa: Copiaste el App Secret incorrecto
Solución: Verifica que es la línea "App Secret", no "Client Secret"
```

### Error 2: "Spaces o caracteres extra"
```
Síntoma: Build falla con error de variable
Causa: Dejaste espacios al inicio/final
Solución: WHATSAPP_WEBHOOK_SECRET=abc123 (sin espacios)
```

### Error 3: "Cambió pero sigue fallando"
```
Síntoma: HMAC sigue fallando con nuevo secret
Causa: Olvidaste correr "pm2 restart pithy-chatbot --update-env"
Solución: Las variables de entorno solo se cargan al iniciar
```

---

## 📝 CHECKLIST

- [ ] Accedí a https://developers.facebook.com/apps/
- [ ] Encontré mi aplicación WhatsApp
- [ ] Copié el App Secret (Settings → Basic)
- [ ] Edité `.env.local` línea 5
- [ ] Ejecuté: `npm run build`
- [ ] Ejecuté: `pm2 restart pithy-chatbot --update-env`
- [ ] Verifiqué con: `pm2 status` (estado: online)
- [ ] Envié un mensaje WhatsApp de prueba
- [ ] ✅ Recibí respuesta del ChatBot

---

## 💾 REFERENCIA TÉCNICA

### HMACValidator en el Código

**Archivo**: `src/services/HMACValidator.ts`

```typescript
static isConfigured(): boolean {
  const isConfigured = !!process.env.WHATSAPP_WEBHOOK_SECRET
  if (!isConfigured) {
    console.warn('WHATSAPP_WEBHOOK_SECRET no está configurada')
  }
  return isConfigured
}

static validate(payload: string, signature: string): boolean {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET!
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return hash === signature.replace('sha256=', '')
}
```

**Qué hace**:
1. Toma el payload (mensaje) y tu secret
2. Calcula HMAC-SHA256
3. Compara con la firma que WhatsApp envió
4. Si no coinciden → "hash mismatch"

---

## 🎯 PRÓXIMOS PASOS

### INMEDIATO (AHORA):
1. ✅ Obtén el App Secret real de Meta Dashboard
2. ✅ Actualiza `.env.local`
3. ✅ Reinicia servidor: `npm run build && pm2 restart pithy-chatbot --update-env`

### LUEGO:
1. Envía mensaje WhatsApp de prueba
2. Verifica que ChatBot responde
3. Si aún no responde, avísame con logs

### LARGO PLAZO:
1. QWEN ejecuta sus fixes (Fase 1 - 50 minutos)
2. Sistema completamente operativo

---

## 📞 SOPORTE

Si después de actualizar el secret:
- ✅ HMAC validation pasa pero ChatBot aún no responde → Otro problema
- 🔴 HMAC validation sigue fallando → Secret incorrecto, revisa en Meta Dashboard

---

**Diagnóstico realizado por**: CLAUDE
**Timestamp**: 2026-01-16 04:00:00 UTC
**Status**: Esperando que proporciones el App Secret real
**Urgencia**: 🔴 MÁXIMA - Sin esto el sistema no funciona

---

*Este documento explica EXACTAMENTE por qué el ChatBot no responde y cómo arreglarlo en 3 pasos.*
