# 🚀 GUÍA RÁPIDA - ACTIVAR PITHY CHATBOT

**Duración**: 5 minutos
**Dificultad**: Muy fácil
**Prerrequisitos**: Node.js, Ollama, Cloudflared (ya instalados)

---

## ✅ PASO 1: Verificar que todo está listo (1 minuto)

```bash
cd E:\prueba

# Verificar Node.js
node --version
# Debe mostrar: v22.14.0

# Verificar npm
npm --version
# Debe mostrar: 11.1.0

# Verificar base de datos
ls -lh prisma/dev.db
# Debe mostrar: 1.6M
```

Si todo muestra versiones y archivos, continúa.

---

## 🔴 PASO 2: Iniciar los 3 servidores (4 minutos)

### Opción A: Terminal (3 ventanas separadas)

**TERMINAL 1: Next.js Server**
```bash
cd E:\prueba
npm run start -p 7847
# Debe mostrar: ready - started server on 0.0.0.0:7847
```

**TERMINAL 2: Ollama (IA Local)**
```bash
ollama serve
# Debe mostrar: listening on ...
```

**TERMINAL 3: Cloudflare Tunnel (Acceso público)**
```bash
cloudflared tunnel run 870732ff-8a9c-42f9-8e69-1e72fa28555f
# Debe mostrar: started ingress service ...
```

### Opción B: PM2 (Automático - RECOMENDADO)

```bash
cd E:\prueba

# Instalar PM2
npm install -g pm2

# Iniciar con PM2
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs en vivo
pm2 logs

# Detener
pm2 stop all

# Reiniciar
pm2 restart all
```

---

## ✅ PASO 3: Verificar que está funcionando (5-30 segundos)

### Verificación 1: ¿Responde el servidor local?

```bash
# En una nueva terminal
curl http://localhost:7847/api/health

# Resultado esperado:
# {"status":"ok"}
```

### Verificación 2: ¿Funciona la página web?

**Abre en navegador:**
```
https://chatbot.zgamersa.com/
```

Debes ver:
- ✅ Página cargando (no error 502)
- ✅ Interfaz del chatbot
- ✅ Input para escribir mensajes

### Verificación 3: ¿Funciona el admin?

**Abre en navegador:**
```
https://chatbot.zgamersa.com/admin
```

Debes ver:
- ✅ Login page O dashboard si ya estás autenticado
- ✅ Inbox de conversaciones
- ✅ Analytics

---

## 📱 PASO 4: Probar WhatsApp (30 segundos)

Una vez todo está verde:

1. **Envía un mensaje por WhatsApp** a tu número de chatbot
   ```
   "Hola, ¿cómo estás?"
   ```

2. **El bot debe responder en 2-5 segundos**
   ```
   "¡Hola! Estoy bien. ¿En qué puedo ayudarte?"
   ```

Si funciona: **¡ÉXITO! El chatbot está activo.**

Si no funciona: Ver troubleshooting abajo.

---

## 🆘 TROUBLESHOOTING

### Problema: Error 502 en https://chatbot.zgamersa.com/

**Causa**: Cloudflare Tunnel no está activo

```bash
# Solución:
# Terminal 3 debe estar ejecutando:
cloudflared tunnel run 870732ff-8a9c-42f9-8e69-1e72fa28555f

# Si ya está ejecutando, reinicia:
# Ctrl+C para detener
# Luego ejecuta de nuevo
```

### Problema: Página no carga (timeout)

**Causa**: Next.js server no está activo

```bash
# Solución:
# Terminal 1 debe mostrar:
# ready - started server on 0.0.0.0:7847

# Si no está activo:
npm run start -p 7847
```

### Problema: Bot no responde

**Causa 1**: Ollama no está activo
```bash
# Solución: Inicia Terminal 2
ollama serve
```

**Causa 2**: PERPLEXITY_API_KEY no configurada
```bash
# Solución: El sistema usa fallback automático
# Debería funcionar de todas formas con Claude API
# Si no, configura en .env.local:
# PERPLEXITY_API_KEY=tu_clave
```

**Causa 3**: WhatsApp webhook token no coincide
```bash
# Verificar en .env.local:
WHATSAPP_WEBHOOK_TOKEN=mi_token_secreto_123

# Debe coincidir con configuración en WhatsApp Business Manager
```

---

## 🛑 PASO 5: Detener los servidores (cuando termines)

### Opción A: Terminal (si usaste terminal manual)
```bash
# En cada terminal:
Ctrl+C
```

### Opción B: PM2 (si usaste PM2)
```bash
pm2 stop all
pm2 delete all
```

---

## 📋 CHECKLIST DE ACTIVACIÓN

Marca cada paso conforme lo completes:

- [ ] **Paso 1**: Node.js y npm verificados
- [ ] **Paso 2a**: Terminal 1 - Next.js iniciado (puerto 7847 escuchando)
- [ ] **Paso 2b**: Terminal 2 - Ollama iniciado
- [ ] **Paso 2c**: Terminal 3 - Cloudflare Tunnel iniciado
- [ ] **Paso 3.1**: curl http://localhost:7847/api/health → {"status":"ok"}
- [ ] **Paso 3.2**: https://chatbot.zgamersa.com/ → Página carga sin error 502
- [ ] **Paso 3.3**: https://chatbot.zgamersa.com/admin → Admin panel accesible
- [ ] **Paso 4**: Envío mensaje por WhatsApp → Bot responde

Si todos los checks están ✅: **¡SISTEMA ACTIVO Y FUNCIONAL!**

---

## 📊 ESTADO DESPUÉS DE ACTIVACIÓN

Cuando todo esté funcionando, verás:

| Componente | Puerto | Estado | Acceso |
|-----------|--------|--------|--------|
| Next.js Server | 7847 | ✅ ESCUCHANDO | http://localhost:7847 |
| Ollama | 11434 | ✅ ESCUCHANDO | http://localhost:11434 |
| Cloudflare Tunnel | N/A | ✅ ACTIVO | https://chatbot.zgamersa.com |
| Webhook WhatsApp | N/A | ✅ RECIBIENDO | Mensajes de usuarios |
| Admin Dashboard | N/A | ✅ OPERATIVO | /admin |

---

## 💡 TIPS IMPORTANTES

1. **Los servidores deben estar corriendo simultáneamente**
   - Terminal 1, 2 y 3 abiertas al mismo tiempo
   - O PM2 gestionándolas automáticamente

2. **Primera vez tarda más**
   - La primera solicitud a IA puede tardar 3-5 segundos
   - Las siguientes son más rápidas (1-2 segundos)

3. **Logs disponibles en Terminal 1**
   - Verás todos los mensajes recibidos
   - Errores aparecen en rojo
   - Útil para debugging

4. **WhatsApp requiere configuración en Business Manager**
   - El webhook URL: https://chatbot.zgamersa.com/api/whatsapp/webhook
   - Token: el valor en WHATSAPP_WEBHOOK_TOKEN
   - Debe estar verificado en WhatsApp

---

## ✅ ¡LISTO!

Una vez completes los 5 pasos, **el chatbot estará 100% funcional**.

**Tiempo total**: 5 minutos
**Facilidad**: Muy fácil
**Riesgo**: Ninguno (solo servidores, sin cambios de código)

---

**Guía creada por**: CLAUDE (Architect)
**Versión**: 1.0
**Fecha**: 15 de Enero de 2026
**Estado**: ✅ VERIFICADA Y LISTA
