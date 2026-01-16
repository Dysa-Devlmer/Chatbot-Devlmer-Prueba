# 🔧 SOLUCIÓN PARA EL PROBLEMA DE TRANSCRIPCIÓN

## ⚠️ Problema Detectado

Cuando enviaste un audio por WhatsApp, el bot respondió dos veces:
1. Primera respuesta: Procesó correctamente (respuesta de IA)
2. Segunda respuesta: "No pude transcribir correctamente" (error)

Esto indica que:
- El audio SÍ llegó al servidor
- El audio SÍ se procesó con IA
- Pero la transcripción con Whisper falló

## 🎯 Causa Probable

WhatsApp envía audios en formato `.ogg` o `.opus` que pueden no ser compatibles directamente con el script de transcripción básico.

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. **Script Mejorado de Transcripción**

Creé `whisper-transcribe-enhanced.py` que:
- Detecta el formato del audio
- Convierte a WAV si es necesario (usando ffmpeg)
- Maneja mejor los errores
- Reintenta con diferentes configuraciones
- Detecta audios vacíos o muy pequeños

### 2. **Para Activar la Solución**

#### Opción A: Instalar ffmpeg (Recomendado)
```bash
# Descarga ffmpeg desde: https://ffmpeg.org/download.html
# O usa winget:
winget install ffmpeg

# Verificar instalación:
ffmpeg -version
```

#### Opción B: Usar el Script Mejorado Sin ffmpeg
El script `whisper-transcribe-enhanced.py` intentará transcribir directamente formatos .ogg/.opus

### 3. **Actualización Manual del Código**

Edita `src/lib/ai.ts` línea ~512 y cambia:

**DE:**
```typescript
const commands = [
  `faster-whisper "${audioFilePath}" --model ${config.model} --language ${config.language} --output_format txt`,
  `whisper "${audioFilePath}" --model ${config.model} --language ${config.language} --output_format txt`,
];
```

**A:**
```typescript
// Usar script Python mejorado
const scriptPath = path.join(process.cwd(), 'whisper-transcribe-enhanced.py');
const command = `python "${scriptPath}" "${audioFilePath}" ${config.model} ${config.language}`;

console.log(`🔄 Ejecutando transcripción mejorada...`);
console.log(`📁 Archivo: ${audioFilePath}`);

exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    console.error('Stderr:', stderr);
    reject(new Error('Transcripción falló'));
    return;
  }

  try {
    const result = JSON.parse(stdout);
    if (result.success) {
      resolve({
        text: result.text,
        language: result.language,
        duration: result.duration
      });
    } else {
      reject(new Error(result.error || 'Sin transcripción'));
    }
  } catch (e) {
    reject(new Error('Error parseando resultado'));
  }
});
```

## 🧪 PARA PROBAR LA SOLUCIÓN

### 1. **Test Local del Script**
```bash
# Prueba con un audio WAV normal
python whisper-transcribe-enhanced.py test-audio.wav

# Si tienes un audio .ogg de WhatsApp, prueba:
python whisper-transcribe-enhanced.py audio-whatsapp.ogg
```

### 2. **Reiniciar el Sistema**
```bash
# Cerrar todo con Ctrl+C en cada ventana
# Luego reiniciar:
.\iniciar-sistema-whisper.ps1
```

### 3. **Enviar Audio de Prueba**
Envía un nuevo audio por WhatsApp diciendo claramente:
- "Hola, necesito información sobre sus servicios"

## 📊 RESULTADO ESPERADO

Deberías recibir:
1. **Solo UNA respuesta** (no dos)
2. **Con texto + audio** de la respuesta
3. En los logs verás:
   ```
   📁 Archivo: temp-audio-xxx.ogg (45632 bytes)
   📼 Formato detectado: .ogg
   🔄 Convirtiendo .ogg a WAV... (si tienes ffmpeg)
   ✅ Transcripción: "Hola, necesito información..."
   ```

## 🔍 DEBUGGING

Si sigue fallando, revisa:

1. **En la consola de Next.js** busca errores como:
   - "No se encontró Whisper instalado"
   - "El archivo de audio está vacío"
   - "Error ejecutando Whisper"

2. **Verifica que faster-whisper funcione:**
   ```bash
   python -c "from faster_whisper import WhisperModel; print('OK')"
   ```

3. **Prueba manualmente con un audio de WhatsApp:**
   - Descarga un audio .ogg de WhatsApp
   - Ejecuta: `python whisper-transcribe-enhanced.py archivo.ogg`

## 💡 SOLUCIÓN ALTERNATIVA RÁPIDA

Si nada funciona, puedes temporalmente deshabilitar Whisper y usar solo respuestas de texto:

En `app/api/whatsapp/webhook/route.ts`, busca el case 'audio' y comenta la línea de transcripción:

```typescript
case 'audio':
  // const transcription = await AIService.transcribeAudio(audioData.filePath);

  // Usar mensaje genérico por ahora
  textToProcess = "El usuario envió un mensaje de voz";
  break;
```

## 📞 PRÓXIMOS PASOS

1. Instala ffmpeg para mejor compatibilidad
2. Usa el script `whisper-transcribe-enhanced.py`
3. Si persiste el problema, comparte los logs exactos de error

---

**El problema es solucionable**. Lo más probable es que sea un tema de formato de audio que el script mejorado debería resolver.