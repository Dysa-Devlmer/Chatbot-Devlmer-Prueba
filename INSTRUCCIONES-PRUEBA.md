# 🚀 INSTRUCCIONES PARA PROBAR EL SISTEMA

## ✅ Estado del Sistema

### Servicios Iniciados:
- ✅ **Ollama**: Corriendo (modelos: qwen2.5:7b, mistral)
- ✅ **Next.js**: Corriendo en puerto 7847
- ✅ **ngrok**: Corriendo (túnel activo)
- ✅ **Whisper**: Instalado y configurado
- ✅ **TTS (edge-tts)**: Instalado y configurado

---

## 📱 CÓMO PROBAR EL SISTEMA

### 1. **Obtener la URL del Webhook**

Abre tu navegador y ve a:
```
http://localhost:4040
```

Ahí verás la URL pública de ngrok, algo como:
```
https://xxxxx.ngrok-free.app
```

### 2. **Configurar el Webhook en WhatsApp**

La URL completa del webhook será:
```
https://xxxxx.ngrok-free.app/api/whatsapp/webhook
```

Token de verificación:
```
mi_token_secreto_123
```

### 3. **Panel de Administración**

Abre el panel en:
```
http://localhost:7847/admin
```

Desde ahí puedes:
- Ver mensajes en el Inbox
- Configurar respuestas rápidas
- Ver analytics
- Gestionar la configuración de IA

---

## 🧪 PRUEBAS RECOMENDADAS

### **Test 1: Mensaje de Texto Normal**
1. Envía un mensaje de texto por WhatsApp
2. El bot debería responder automáticamente
3. Verifica en el panel que aparece en el Inbox

### **Test 2: Mensaje de Voz (NUEVO!)**
1. **Envía un audio por WhatsApp** 🎤
2. El bot hará lo siguiente:
   - Transcribirá el audio con Whisper
   - Procesará el texto con Ollama
   - Generará una respuesta
   - Convertirá la respuesta a audio con TTS
   - **Te responderá con TEXTO + AUDIO** 🔊

### **Test 3: Horario de Atención**
- El bot responde de 9:00 AM a 3:00 AM
- Fuera de horario envía mensaje automático

---

## 📊 QUÉ ESPERAR

### Cuando envíes un **AUDIO**:

1. **En la consola de Next.js verás:**
```
🎤 Audio recibido de: +5491xxxxxxxxx
📥 Descargando audio...
🎤 Iniciando transcripción de audio...
✅ Transcripción completada: "tu mensaje..."
🤖 Generando respuesta con IA...
🔊 Generando audio de respuesta...
✅ Audio enviado exitosamente
```

2. **En WhatsApp recibirás:**
- Un mensaje de texto con la respuesta
- Un audio con la misma respuesta narrada

3. **Tiempos esperados:**
- Transcripción: 3-5 segundos
- Procesamiento IA: 1-2 segundos
- Generación de audio: 2-3 segundos
- **Total: 6-10 segundos**

---

## 🎭 Voces Disponibles para TTS

El sistema usa por defecto:
- **es-CL-CatalinaNeural** (Voz chilena femenina)

Puedes cambiar la voz editando en el código si lo deseas.

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Si el bot no responde:
1. Verifica que ngrok esté corriendo: http://localhost:4040
2. Verifica que Next.js esté corriendo: http://localhost:7847
3. Revisa los logs en las ventanas de PowerShell

### Si el audio no se transcribe:
1. Verifica que faster-whisper esté instalado:
   ```bash
   pip list | grep faster-whisper
   ```
2. Revisa los logs de la consola de Next.js

### Si no se genera audio de respuesta:
1. Verifica que edge-tts esté instalado:
   ```bash
   pip list | grep edge-tts
   ```
2. Prueba manualmente:
   ```bash
   edge-tts --voice "es-CL-CatalinaNeural" --text "Prueba" --write-media test.mp3
   ```

---

## 🎯 FLUJO COMPLETO DE AUDIO

```
👤 Usuario envía audio (20 segundos)
    ↓
🎤 Whisper transcribe (5 segundos)
    ↓
🤖 Ollama procesa (2 segundos)
    ↓
🔊 TTS genera audio (3 segundos)
    ↓
📱 Usuario recibe texto + audio (Total: ~10 segundos)
```

---

## ✨ CARACTERÍSTICAS ACTIVAS

- ✅ Transcripción de voz (Whisper)
- ✅ Respuestas en audio (TTS)
- ✅ IA conversacional (Ollama)
- ✅ 77 voces en español disponibles
- ✅ Analytics en tiempo real
- ✅ Quick Replies
- ✅ Mensajes programados
- ✅ Sistema de etiquetas

---

## 📞 PARA EMPEZAR A PROBAR:

1. **Abre http://localhost:4040** para obtener tu URL de ngrok
2. **Configura esa URL** en tu webhook de WhatsApp
3. **Envía un mensaje de voz** para probar el flujo completo
4. **Disfruta** de tu bot conversacional con capacidades de voz!

---

**¡El sistema está listo para pruebas!** 🎉

Si necesitas ayuda, revisa los logs en las ventanas de PowerShell donde están corriendo los servicios.