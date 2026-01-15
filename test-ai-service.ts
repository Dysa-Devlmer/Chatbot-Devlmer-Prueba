import { AIService } from './src/lib/ai';

async function testAIService() {
  console.log('🧪 Iniciando prueba del servicio de IA...');

  try {
    // Verificar el proveedor de IA actual
    const provider = await AIService.getActiveProvider();
    console.log(`🤖 Proveedor de IA actual: ${provider}`);

    // Verificar si está configurado para usar Perplexity
    if (provider === 'perplexity') {
      console.log('✅ Configurado para usar Perplexity');
    } else {
      console.log('✅ Configurado para usar Ollama');
    }

    // Probar el procesamiento de un mensaje simple
    console.log('\n💬 Probando procesamiento de mensaje...');
    const context = {
      userId: 'test-user',
      conversationId: 'test-conversation',
      recentMessages: []
    };

    const result = await AIService.processMessage('Hola, ¿qué puedes hacer?', context);
    
    console.log(`✅ Respuesta generada:`);
    console.log(`   "${result.response.substring(0, 200)}${result.response.length > 200 ? '...' : ''}"`);
    
    if (result.intent) {
      console.log(`   Intent: ${result.intent}`);
    }
    if (result.sentiment) {
      console.log(`   Sentiment: ${result.sentiment}`);
    }

    console.log('\n🎉 Prueba del servicio de IA completada exitosamente!');
  } catch (error) {
    console.error('💥 Error durante la prueba del servicio de IA:', error);
  }
}

// Ejecutar la prueba
testAIService();