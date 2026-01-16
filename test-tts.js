/**
 * Test de Text-to-Speech
 * Prueba la generación de audio desde texto
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Voces recomendadas en español
const VOICES = {
  'chile-mujer': 'es-CL-CatalinaNeural',
  'chile-hombre': 'es-CL-LorenzoNeural',
  'mexico-mujer': 'es-MX-DaliaNeural',
  'mexico-hombre': 'es-MX-JorgeNeural',
  'españa-mujer': 'es-ES-ElviraNeural',
  'españa-hombre': 'es-ES-AlvaroNeural',
  'argentina-mujer': 'es-AR-ElenaNeural',
  'colombia-mujer': 'es-CO-SalomeNeural'
};

function testTTS(text, voiceKey = 'chile-mujer') {
  console.log('🎤 TEST DE TEXT-TO-SPEECH');
  console.log('=========================\n');

  const voice = VOICES[voiceKey] || VOICES['chile-mujer'];
  const outputFile = `tts-output-${Date.now()}.mp3`;

  console.log(`📝 Texto: "${text}"`);
  console.log(`🎭 Voz: ${voice} (${voiceKey})`);
  console.log(`📁 Archivo: ${outputFile}`);
  console.log('\n🔊 Generando audio...\n');

  const command = `python -m edge_tts --voice "${voice}" --text "${text}" --write-media "${outputFile}"`;

  const startTime = Date.now();

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error:', error.message);
      if (stderr) console.error('Detalles:', stderr);
      return;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const fileSize = fs.statSync(outputFile).size;

    console.log('=========================');
    console.log('✅ AUDIO GENERADO CON ÉXITO\n');
    console.log(`📊 Tamaño: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`⏱️ Tiempo: ${elapsed}s`);
    console.log(`🎵 Reproducir: ${outputFile}`);
    console.log('=========================\n');

    // Reproducir el audio automáticamente en Windows
    exec(`start ${outputFile}`, (err) => {
      if (!err) {
        console.log('🔊 Reproduciendo audio...');
      }
    });
  });
}

// Textos de prueba
const TEXTOS_PRUEBA = [
  "Hola, soy PITHY, tu asistente virtual. Ahora puedo responder con mensajes de voz.",
  "Gracias por tu consulta sobre diseño web. Te enviaré información detallada por mensaje.",
  "He recibido tu mensaje de voz y lo he procesado correctamente. ¿En qué más puedo ayudarte?"
];

// Ejecutar prueba
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Uso: node test-tts.js [texto] [voz]\n');
  console.log('Voces disponibles:');
  Object.keys(VOICES).forEach(key => {
    console.log(`  ${key}: ${VOICES[key]}`);
  });
  console.log('\nEjemplos:');
  console.log('  node test-tts.js "Hola mundo"');
  console.log('  node test-tts.js "Hola mundo" mexico-mujer\n');
  console.log('Usando texto de prueba por defecto...\n');
  testTTS(TEXTOS_PRUEBA[0]);
} else {
  const text = args[0];
  const voice = args[1] || 'chile-mujer';
  testTTS(text, voice);
}