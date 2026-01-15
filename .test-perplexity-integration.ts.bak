import { PerplexityService } from './src/lib/perplexity';

async function testPerplexityIntegration() {
  console.log('🧪 Iniciando prueba de integración de Perplexity...');

  try {
    // Verificar si Perplexity está configurado
    const isConfigured = await PerplexityService.isConfigured();
    console.log(`🔑 Perplexity configurado: ${isConfigured}`);

    if (!isConfigured) {
      console.log('⚠️  Advertencia: Perplexity no está configurado con una API key válida');
      console.log('   Para pruebas completas, configure PERPLEXITY_API_KEY en su archivo .env');
      return;
    }

    // Probar la conexión
    console.log('\n📡 Probando conexión con Perplexity...');
    const connectionStatus = await PerplexityService.checkConnection();
    console.log(`✅ Disponible: ${connectionStatus.available}`);
    if (connectionStatus.error) {
      console.log(`❌ Error: ${connectionStatus.error}`);
      return;
    }

    // Probar el envío de un mensaje
    console.log('\n💬 Probando envío de mensaje...');
    const testMessage = 'Hola, ¿cómo estás? Responde brevemente.';

    const response = await PerplexityService.processMessage(testMessage);

    if (response.success) {
      console.log(`✅ Respuesta recibida:`);
      console.log(`   "${response.response.substring(0, 200)}${response.response.length > 200 ? '...' : ''}"`);
    } else {
      console.log(`❌ Error en la respuesta: ${response.error}`);
      return;
    }

    // Probar con contexto de conversación
    console.log('\n💭 Probando con contexto de conversación...');
    const context = {
      conversationHistory: [
        { role: 'user', content: 'Hola, me llamo Juan.' },
        { role: 'assistant', content: '¡Hola Juan! ¿En qué puedo ayudarte?' },
      ],
      systemPrompt: 'Eres un asistente útil y amigable.',
    };

    const responseWithContext = await PerplexityService.processMessage('¿Cómo te llamas?', context);

    if (responseWithContext.success) {
      console.log(`✅ Respuesta con contexto recibida:`);
      console.log(`   "${responseWithContext.response.substring(0, 200)}${responseWithContext.response.length > 200 ? '...' : ''}"`);
    } else {
      console.log(`❌ Error en la respuesta con contexto: ${responseWithContext.error}`);
    }

    console.log('\n🎉 Prueba de integración de Perplexity completada exitosamente!');
  } catch (error) {
    console.error('💥 Error durante la prueba de integración:', error);
  }
}

// Ejecutar la prueba
testPerplexityIntegration();