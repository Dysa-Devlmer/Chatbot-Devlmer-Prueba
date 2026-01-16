# 🚨 URGENTE: Obtener WHATSAPP_APP_SECRET Correcto

**Problema**: HMAC validation falla porque el secret es dummy
**Timestamp**: 2026-01-16 00:50:22
**Error**: "hash mismatch" en validación HMAC

---

## 🔴 SITUACIÓN

El servidor está rechazando mensajes con error 401:
```
HMAC validation failed - hash mismatch
Invalid signature
Webhook auth failed
```

**Causa**: El `WHATSAPP_WEBHOOK_SECRET` en `.env.local` es incorrecto.

Agregué un valor dummy:
```
WHATSAPP_WEBHOOK_SECRET=mi_app_secret_para_hmac_validation_123
```

Pero **WhatsApp está usando un secret diferente**.

---

## ✅ CÓMO ARREGLARLO

### Paso 1: Obtener el Secret Real de Meta Dashboard

1. **Ve a**: https://developers.facebook.com/apps/
2. **Selecciona tu App** (la que tiene WhatsApp Business)
3. **Ve a**: Settings → Basic
4. **Busca**: "App Secret"
5. **Copia el valor** (es una cadena larga de caracteres)

**Debería verse así**:
```
App Secret: abc123xyz789def456...
```

### Paso 2: Actualizar .env.local

1. **Abre**: `.env.local`
2. **Busca la línea**:
```
WHATSAPP_WEBHOOK_SECRET=mi_app_secret_para_hmac_validation_123
```

3. **Reemplázala con**:
```
WHATSAPP_WEBHOOK_SECRET=<tu_app_secret_real_aqui>
```

Ejemplo:
```
WHATSAPP_WEBHOOK_SECRET=12345678901234567890abcdef
```

### Paso 3: Reiniciar Servidor

```bash
npm run build
pm2 restart pithy-chatbot --update-env
```

### Paso 4: Verificar

```bash
pm2 logs pithy-chatbot --follow
# Envía un mensaje WhatsApp
# Deberías ver: "HMAC validation passed"
# NO "HMAC validation failed"
```

---

## 📋 ALTERNATIVE: Si NO tienes acceso a Meta Dashboard

Si no puedes acceder al Dashboard:

1. **Busca en tu correo** - Meta envía confirmación con el App Secret
2. **Busca en documentación** - Puede estar en wikis o documentos internos
3. **Contacta a tu proveedor** - Si es una app de terceros

---

## 🎯 RESUMEN

**Lo que necesitas**:
```
App Secret de tu aplicación WhatsApp en Meta Dashboard
```

**Lo que harás**:
```
1. Copiar el App Secret
2. Pegarlo en .env.local
3. Reiniciar servidor
4. Verificar que funciona
```

**Resultado**:
```
HMAC validation = PASSED
Mensajes = LLEGAN
Chatbot = RESPONDE
```

---

**Urgencia**: ALTA (chatbot no funciona sin esto)
**Tiempo estimado**: 5-10 minutos

Avísame cuando tengas el App Secret y lo actualizo.
