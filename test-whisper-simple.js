/**
 * Test simple de transcripción directa con Python
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function testWhisper(audioFile) {
  if (!audioFile) {
    console.error('❌ Uso: node test-whisper-simple.js <archivo_audio>');
    process.exit(1);
  }

  const audioPath = path.resolve(audioFile);
  if (!fs.existsSync(audioPath)) {
    console.error(`❌ Archivo no encontrado: ${audioPath}`);
    process.exit(1);
  }

  console.log('🧪 PRUEBA DE TRANSCRIPCIÓN CON WHISPER');
  console.log('=======================================\n');
  console.log(`📁 Archivo: ${audioPath}`);
  console.log(`📊 Tamaño: ${(fs.statSync(audioPath).size / 1024).toFixed(2)} KB`);
  console.log('\n🎤 Transcribiendo...\n');

  const scriptPath = path.join(__dirname, 'whisper-transcribe.py');
  const command = `python "${scriptPath}" "${audioPath}" base es`;

  const startTime = Date.now();

  exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    if (error) {
      console.error('❌ ERROR:', error.message);
      if (stderr) console.error('Detalles:', stderr);
      process.exit(1);
    }

    try {
      const result = JSON.parse(stdout);

      console.log('=======================================');
      if (result.success) {
        console.log('✅ TRANSCRIPCIÓN EXITOSA\n');
        console.log('📝 TEXTO TRANSCRITO:');
        console.log(`"${result.text}"\n`);
        console.log(`🌐 Idioma: ${result.language || 'es'}`);
        console.log(`⏱️ Duración del audio: ${result.duration ? result.duration.toFixed(2) + 's' : 'N/A'}`);
        console.log(`⏱️ Tiempo de proceso: ${elapsed}s`);
      } else {
        console.log('❌ ERROR EN TRANSCRIPCIÓN');
        console.log(`Detalles: ${result.error}`);
      }
    } catch (e) {
      console.error('❌ Error parseando resultado:', e);
      console.log('Salida raw:', stdout);
    }
    console.log('=======================================');
  });
}

// Ejecutar
testWhisper(process.argv[2]);