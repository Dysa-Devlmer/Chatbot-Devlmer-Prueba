# 🎛️ Panel de Administración - URLs y Características

## 🌐 URL Principal del Sistema

**Dominio completo:** `https://chatbot.zgamersa.com`

---

## 📊 Panel de Administración

### 🏠 Dashboard Principal
```
https://chatbot.zgamersa.com/admin
```

**Características:**
- 📈 Estadísticas en tiempo real
- 👥 Total de conversaciones
- 💬 Mensajes totales y del día
- 🤖 Conversaciones en modo automático vs manual
- 📊 Gráfico de mensajes por hora
- ✅ Actualización automática cada 30 segundos

**Estadísticas mostradas:**
- Total de conversaciones
- Conversaciones activas
- Total de usuarios
- Total de mensajes
- Conversaciones sin leer
- Mensajes hoy
- Modo automático (bot)
- Modo manual

---

### 📥 Bandeja de Entrada (Inbox)
```
https://chatbot.zgamersa.com/admin/inbox
```

**Características:**
- 💬 Lista de todas las conversaciones
- 🟢 Estado: Activa/Inactiva
- 🤖/👤 Modo: Automático/Manual
- 📝 Ver historial completo de mensajes
- ✏️ Responder manualmente
- 🔄 Cambiar entre modo bot/manual por conversación
- 🔍 Búsqueda y filtrado

---

### 📈 Analytics (Análisis)
```
https://chatbot.zgamersa.com/admin/analytics
```

**Características:**
- 📊 Gráficos de actividad
- 📅 Estadísticas por fecha
- 👥 Análisis de usuarios
- 💬 Patrones de conversación
- ⏱️ Tiempos de respuesta
- 📈 Tendencias y reportes

---

### 🤖 Configuración de IA
```
https://chatbot.zgamersa.com/admin/ai
```

**Características:**
- ⚙️ Configuración del modelo Ollama
- 📝 Editar prompts del sistema
- 🎚️ Ajustar parámetros de temperatura
- 🧠 Personalizar personalidad del bot
- 🔧 Configuración avanzada de IA

---

### 🏷️ Etiquetas (Tags)
```
https://chatbot.zgamersa.com/admin/tags
```

**Características:**
- 🏷️ Crear etiquetas personalizadas
- 🎨 Organizar conversaciones
- 🔍 Filtrar por categorías
- 📊 Estadísticas por etiqueta
- 🗂️ Sistema de clasificación

---

### ⏰ Mensajes Programados
```
https://chatbot.zgamersa.com/admin/scheduled
```

**Características:**
- ⏰ Programar mensajes futuros
- 🔄 Mensajes recurrentes
- 📅 Calendario de envíos
- ✅ Estado: Pendiente/Enviado/Cancelado
- 🗑️ Cancelar mensajes programados

---

## 🔌 API Endpoints

### Webhook de WhatsApp
```
https://chatbot.zgamersa.com/api/whatsapp/webhook
```
**Método:** POST
**Uso:** Recibir mensajes de WhatsApp Business
**Token:** `mi_token_secreto_123`

---

### Health Check
```
https://chatbot.zgamersa.com/api/health
```
**Método:** GET
**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T02:17:04.865Z",
  "uptime": 44.29,
  "version": "0.1.0",
  "checks": {
    "server": {"status": "ok", "responseTime": 32},
    "database": {"status": "ok", "responseTime": 11},
    "ollama": {"status": "ok", "responseTime": 21}
  }
}
```

---

### Estadísticas del Admin
```
https://chatbot.zgamersa.com/api/admin/stats
```
**Método:** GET
**Uso:** Obtener estadísticas en tiempo real

---

### Conversaciones
```
https://chatbot.zgamersa.com/api/admin/conversations
```
**Método:** GET
**Uso:** Listar todas las conversaciones

---

### Mensajes
```
https://chatbot.zgamersa.com/api/admin/messages
```
**Método:** GET/POST
**Uso:** Obtener mensajes o enviar respuestas manuales

---

## 🖥️ Acceso Local vs Remoto

### Acceso LOCAL (desarrollo):
```
http://localhost:7847/admin
```

### Acceso REMOTO (producción):
```
https://chatbot.zgamersa.com/admin
```

**Ambos acceden al mismo sistema.**

---

## 🔒 Seguridad

**IMPORTANTE:**
El panel de administración actualmente **NO tiene autenticación**.

### Recomendaciones de seguridad:

1. **Agregar autenticación:**
   - NextAuth.js
   - Credenciales de usuario/contraseña
   - JWT tokens

2. **Restricción por IP:**
   - Configurar Cloudflare para permitir solo IPs autorizadas
   - Firewall rules en Cloudflare

3. **Rate limiting:**
   - Limitar intentos de acceso
   - Protección contra fuerza bruta

4. **HTTPS obligatorio:**
   - ✅ Ya configurado con Cloudflare Tunnel
   - Certificado SSL automático

---

## 📱 Funcionalidades del Panel

### 🎯 Modo Automático (Bot)
- 🤖 Ollama responde automáticamente
- 📝 Usa el prompt del sistema configurado
- ⚡ Respuesta inmediata
- 💬 Conversación fluida con IA

### 👤 Modo Manual
- 👨‍💼 Respuestas humanas
- ✍️ Control total del mensaje
- 🔔 Notificaciones de nuevos mensajes
- ⏰ Respuesta cuando tú decidas

### 🔄 Cambiar entre modos
Puedes cambiar cada conversación entre automático y manual según necesites.

---

## 📊 Dashboard en Tiempo Real

El dashboard se actualiza automáticamente cada **30 segundos** con:

- 🔴 Conversaciones sin leer
- 💬 Mensajes recibidos hoy
- 📈 Gráfico de actividad por hora
- 👥 Usuarios activos
- 🤖 Distribución de modos (auto/manual)

---

## 🎨 Diseño Visual

El panel tiene un diseño moderno con:
- 🎨 Gradiente violeta/morado
- 📱 Responsive (funciona en móvil)
- 🌙 Tema oscuro/claro
- ✨ Animaciones suaves
- 📊 Gráficos interactivos

---

## 🚀 Guía de Uso Rápida

### Para ver estadísticas:
1. Ve a: `https://chatbot.zgamersa.com/admin`
2. Verás el dashboard principal

### Para responder manualmente:
1. Ve a: `https://chatbot.zgamersa.com/admin/inbox`
2. Click en una conversación
3. Escribe tu respuesta
4. Enviar

### Para configurar el bot:
1. Ve a: `https://chatbot.zgamersa.com/admin/ai`
2. Edita el prompt del sistema
3. Ajusta parámetros
4. Guardar

---

## 🔧 Troubleshooting

### El panel no carga:
```bash
# Verificar que Next.js está corriendo
pm2 list

# Ver logs
pm2 logs pithy-chatbot
```

### No veo estadísticas:
```bash
# Verificar base de datos
pm2 logs pithy-chatbot | grep database

# Verificar API
curl https://chatbot.zgamersa.com/api/admin/stats
```

### No puedo enviar mensajes:
```bash
# Verificar Ollama
pm2 logs ollama

# Probar Ollama directamente
curl http://localhost:11434/api/tags
```

---

## 📝 Notas Importantes

1. **URL permanente:** `https://chatbot.zgamersa.com` NUNCA cambia
2. **Sin VPN necesaria:** Accesible desde cualquier lugar
3. **Sin autenticación:** Considera agregar login/password
4. **Tiempo real:** Datos se actualizan automáticamente
5. **Múltiples dispositivos:** Puedes abrir en varios navegadores

---

## 🎉 Resumen

**Tu panel de administración completo está en:**

```
🏠 https://chatbot.zgamersa.com/admin
```

Desde ahí puedes:
- ✅ Ver todas las conversaciones
- ✅ Responder manualmente
- ✅ Cambiar modo bot/manual
- ✅ Ver estadísticas en tiempo real
- ✅ Configurar la IA
- ✅ Gestionar etiquetas
- ✅ Programar mensajes

**¡Todo en una sola URL profesional y permanente!**
