// Test de precisión de fechas y horarios
// Verifica que el chatbot NO modifique fechas/horas mencionadas por el usuario

const { Ollama } = require('ollama');

const ollama = new Ollama({
  host: 'http://localhost:11434',
});

const testCases = [
  {
    input: "Quiero agendar una reunión para el miércoles a las 3 de la tarde",
    expectedKeywords: ["miércoles", "3", "tarde"],
    description: "Fecha específica con día y hora"
  },
  {
    input: "Necesito una cita el lunes a las 10 am",
    expectedKeywords: ["lunes", "10", "am"],
    description: "Día de semana con hora AM"
  },
  {
    input: "Agendemos para el viernes 15 a las 5:30 pm",
    expectedKeywords: ["viernes", "15", "5:30", "pm"],
    description: "Día con número y hora específica"
  }
];

async function testDatePrecision() {
  console.log('🧪 TEST DE PRECISIÓN DE FECHAS Y HORARIOS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const systemPrompt = `Eres PITHY, asesor de Devlmer Project CL.

SERVICIOS:
• Chatbots IA (atención 24/7, WhatsApp)
• Software a medida
• Automatización empresarial

REGLAS CRÍTICAS:
1. Máximo 40 palabras (2 oraciones)
2. NUNCA inventes datos: Si el cliente dice "lunes 4pm", repite EXACTAMENTE "lunes a las 4pm"
3. Si mencionan fechas/horas, CONFIRMA los datos exactos que dijeron
4. NO cambies ni asumas información que no te dieron

EJEMPLOS:
U: Hola
P: ¡Hola! Soy PITHY de Devlmer. ¿En qué puedo ayudarte?

U: ¿Hacen chatbots?
P: Sí, creamos chatbots IA para WhatsApp con atención 24/7. ¿Cuántas consultas diarias recibes?

U: Agendar reunión lunes 4pm
P: Perfecto. Confirmo: reunión el lunes a las 4pm. ¿Qué tema quieres tratar?

U: No, martes 3pm
P: Corregido: martes a las 3pm. ¿Algún tema específico?

PROHIBIDO: inventar fechas, cambiar horarios, asumir información, frases largas.`;

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.description}`);
    console.log(`   Input: "${testCase.input}"`);

    const fullPrompt = `${systemPrompt}\n\nUsuario: ${testCase.input}\n\nRECUERDA: Máximo 40 palabras (2 oraciones).\nPITHY:`;

    try {
      const response = await ollama.generate({
        model: 'llama3.2:latest',
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.5,
          top_p: 0.9,
          top_k: 40,
          num_predict: 80,
          repeat_penalty: 1.3,
          stop: ['\n\n', 'Usuario:', 'PITHY:', 'U:'],
        },
      });

      const botResponse = response.response.trim();
      console.log(`   Output: "${botResponse}"`);

      // Verificar que contiene las palabras clave esperadas
      const containsAll = testCase.expectedKeywords.every(keyword =>
        botResponse.toLowerCase().includes(keyword.toLowerCase())
      );

      if (containsAll) {
        console.log(`   ✅ PASSED - Contiene todas las palabras clave\n`);
        passed++;
      } else {
        const missing = testCase.expectedKeywords.filter(keyword =>
          !botResponse.toLowerCase().includes(keyword.toLowerCase())
        );
        console.log(`   ❌ FAILED - Faltan palabras clave: ${missing.join(', ')}\n`);
        failed++;
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
      failed++;
    }

    // Pequeña pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n📊 RESULTADOS FINALES:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / testCases.length) * 100)}%\n`);

  if (passed === testCases.length) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON! El sistema mantiene precisión en fechas.\n');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisar configuración del prompt.\n');
  }
}

// Ejecutar tests
testDatePrecision().catch(console.error);
