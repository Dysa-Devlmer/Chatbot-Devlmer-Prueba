# 🔄 Actualización del Sistema - PITHY Chatbot

## ⚠️ ACCIÓN REQUERIDA: Actualizar Base de Datos

El sistema se sincronizó con las **6 nuevas fases profesionales** desde el repositorio remoto. Para que funcionen correctamente, necesitas actualizar la base de datos.

---

## 📋 Nuevas Funcionalidades Disponibles

### ✅ Fase 1: Analytics Dashboard
- **URL**: http://localhost:7847/admin/analytics
- **Descripción**: Dashboard profesional con KPIs, gráficos y métricas

### ✅ Fase 2: Quick Replies
- **URL**: http://localhost:7847/admin/quick-replies
- **Descripción**: Sistema de respuestas rápidas con atajos de teclado

### ✅ Fase 3: Notificaciones en Tiempo Real
- **Integrado en**: Inbox
- **Descripción**: Notificaciones push, sonidos y alertas

### ✅ Fase 4: Sistema de Etiquetas
- **URL**: http://localhost:7847/admin/tags
- **Descripción**: Etiquetas por categoría para organizar conversaciones

### ✅ Fase 5: Configuración Avanzada de IA
- **URL**: http://localhost:7847/admin/ai
- **Descripción**: Configuración de modelos, temperatura y parámetros

### ✅ Fase 6: Mensajes Programados
- **URL**: http://localhost:7847/admin/scheduled
- **Descripción**: Programar mensajes para envío futuro

---

## 🚀 Cómo Actualizar (2 Opciones)

### **Opción 1: Automática (Recomendada)**

1. **Cierra la ventana de PowerShell** donde corre Next.js
2. Ejecuta:
   ```powershell
   powershell -ExecutionPolicy Bypass -File actualizar-base-datos.ps1
   ```
3. El script hará todo automáticamente y reiniciará el servidor

---

### **Opción 2: Manual**

1. **Cierra la ventana de PowerShell** donde corre Next.js

2. Abre una nueva terminal de PowerShell y ejecuta:
   ```powershell
   cd E:\prueba
   npx prisma generate
   npx prisma db push
   ```

3. Reinicia el servidor:
   ```powershell
   npm run dev
   ```

---

## ✅ Verificar que Todo Funciona

Después de actualizar, verifica que las nuevas páginas cargan correctamente:

```
✓ http://localhost:7847/admin
✓ http://localhost:7847/admin/analytics
✓ http://localhost:7847/admin/quick-replies
✓ http://localhost:7847/admin/tags
✓ http://localhost:7847/admin/ai
✓ http://localhost:7847/admin/scheduled
✓ http://localhost:7847/admin/inbox
```

---

## 📊 Tablas Nuevas en la Base de Datos

Después de ejecutar las migraciones, tendrás estas nuevas tablas:

- `Tag` - Etiquetas para conversaciones
- `QuickReply` - Respuestas rápidas predefinidas
- `ScheduledMessage` - Mensajes programados
- `AIConfig` - Configuración de IA
- Campo `tags` agregado a `Conversation`

---

## 🔧 Configuración del Webhook (Pendiente)

Una vez que la base de datos esté actualizada, configura el webhook en Meta:

**URL del Webhook:**
```
https://primulaceous-skinflintily-garret.ngrok-free.dev/api/whatsapp/webhook
```

**Token de Verificación:**
```
mi_token_secreto_123
```

**Pasos:**
1. Ve a https://developers.facebook.com/apps
2. WhatsApp > Configuration > Edit Webhook
3. Pega la URL y el token
4. Suscríbete a: `messages` y `message_status`

---

## 💡 Horario Actualizado

El horario de atención se extendió:

- **Lunes a Viernes**: 9:00 AM - 12:00 AM (medianoche) ✨ NUEVO
- **Sábados**: 10:00 AM - 2:00 PM
- **Domingos**: Cerrado

Para modificar: edita `config-horarios.json`

---

## 📝 Notas Importantes

⚠️ **Importante**: El servidor Next.js debe estar detenido durante la actualización de Prisma, de lo contrario obtendrás errores de permisos.

✅ **Después de actualizar**: Todas las 6 fases estarán completamente funcionales.

🔄 **Sincronización**: Todos los cambios están en el branch:
```
claude/reset-chatbot-devlmer-01Ri41mTnZb59LBAsfFGQkr8
```

---

## 🆘 Soporte

Si tienes problemas durante la actualización, revisa:
- `COMO-USAR-EL-CHATBOT.md`
- `CONFIGURACION-WEBHOOK.txt`
- O pregúntame directamente

---

**¡El sistema está casi listo! Solo falta actualizar la base de datos.**
