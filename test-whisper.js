/**
 * Script de prueba para el sistema de transcripción con Whisper
 * Uso: node test-whisper.js <archivo_audio>
 */

const { AIService } = require('./src/lib/ai');
const fs = require('fs');
const path = require('path');

async function testTranscription(audioFile) {
  console.log('🧪 Iniciando prueba de transcripción con Whisper\n');
  console.log('----------------------------------------');

  // Verificar que el archivo existe
  if (!audioFile) {
    console.error('❌ Por favor proporciona un archivo de audio');
    console.log('\nUso: node test-whisper.js <archivo_audio>');
    console.log('Ejemplo: node test-whisper.js audio.mp3');
    process.exit(1);
  }

  const audioPath = path.resolve(audioFile);

  if (!fs.existsSync(audioPath)) {
    console.error(`❌ El archivo no existe: ${audioPath}`);
    process.exit(1);
  }

  console.log(`📁 Archivo de audio: ${audioPath}`);
  console.log(`📊 Tamaño: ${(fs.statSync(audioPath).size / 1024).toFixed(2)} KB`);
  console.log('\n🎤 Iniciando transcripción...\n');

  try {
    // Llamar al servicio de transcripción
    const startTime = Date.now();
    const result = await AIService.transcribeAudio(audioPath);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('----------------------------------------');

    if (result.success) {
      console.log('✅ TRANSCRIPCIÓN EXITOSA\n');
      console.log(`📝 Texto transcrito:\n"${result.text}"\n`);
      console.log(`🌐 Idioma detectado: ${result.language || 'No detectado'}`);
      console.log(`⏱️ Duración del audio: ${result.duration ? result.duration.toFixed(2) + ' segundos' : 'No disponible'}`);
      console.log(`⏱️ Tiempo de procesamiento: ${elapsedTime} segundos`);
    } else {
      console.log('❌ ERROR EN TRANSCRIPCIÓN\n');
      console.log(`Error: ${result.error}`);
      console.log('\n💡 Sugerencias:');
      console.log('1. Verifica que faster-whisper esté instalado: pip install faster-whisper');
      console.log('2. Asegúrate de que el archivo de audio esté en un formato soportado (mp3, wav, m4a, ogg)');
      console.log('3. Revisa los logs para más detalles');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.log('\n💡 Verifica la instalación:');
    console.log('1. pip install faster-whisper');
    console.log('2. El script whisper-transcribe.py debe existir en el directorio raíz');
  }

  console.log('\n----------------------------------------');
  console.log('🧪 Prueba completada');
}

// Ejecutar prueba
const audioFile = process.argv[2];
testTranscription(audioFile);