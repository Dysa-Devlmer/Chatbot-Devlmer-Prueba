import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AIConfig {
  aiEnabled: boolean;
  selectedModel: string;
  availableModels: string[];
  temperature: number;
  maxTokens: number;
  autoRespond: boolean;
  sentimentAnalysis: boolean;
  intentDetection: boolean;
  ragEnabled: boolean;
}

export interface ConversationInsights {
  summary: string;
  mainTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  suggestedActions: string[];
  suggestedResponses: string[];
}

// GET - Obtener configuracion de IA y estado
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    // Accion: Obtener insights de una conversacion
    if (action === 'insights') {
      const conversationId = searchParams.get('conversationId');

      if (!conversationId) {
        return NextResponse.json(
          { error: 'conversationId es requerido' },
          { status: 400 }
        );
      }

      const insights = await getConversationInsights(conversationId);
      return NextResponse.json({ insights });
    }

    // Accion: Obtener sugerencias de respuesta
    if (action === 'suggestions') {
      const conversationId = searchParams.get('conversationId');

      if (!conversationId) {
        return NextResponse.json(
          { error: 'conversationId es requerido' },
          { status: 400 }
        );
      }

      const suggestions = await getResponseSuggestions(conversationId);
      return NextResponse.json({ suggestions });
    }

    // Por defecto: Obtener configuracion de IA
    const config = await getAIConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error in AI API:', error);
    return NextResponse.json(
      { error: 'Error al procesar solicitud de IA' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar configuracion de IA
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      aiEnabled,
      selectedModel,
      temperature,
      maxTokens,
      autoRespond,
      sentimentAnalysis,
      intentDetection,
      ragEnabled,
    } = body;

    // Actualizar configuraciones
    const updates: Array<{ key: string; value: string }> = [];

    if (aiEnabled !== undefined) {
      updates.push({ key: 'ai_enabled', value: String(aiEnabled) });
    }
    if (selectedModel !== undefined) {
      updates.push({ key: 'ai_model', value: selectedModel });
    }
    if (temperature !== undefined) {
      updates.push({ key: 'ai_temperature', value: String(temperature) });
    }
    if (maxTokens !== undefined) {
      updates.push({ key: 'ai_max_tokens', value: String(maxTokens) });
    }
    if (autoRespond !== undefined) {
      updates.push({ key: 'ai_auto_respond', value: String(autoRespond) });
    }
    if (sentimentAnalysis !== undefined) {
      updates.push({ key: 'ai_sentiment_analysis', value: String(sentimentAnalysis) });
    }
    if (intentDetection !== undefined) {
      updates.push({ key: 'ai_intent_detection', value: String(intentDetection) });
    }
    if (ragEnabled !== undefined) {
      updates.push({ key: 'rag_enabled', value: String(ragEnabled) });
    }

    // Upsert cada configuracion
    for (const update of updates) {
      await prisma.systemConfig.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value, type: 'string' },
      });
    }

    const config = await getAIConfig();
    return NextResponse.json({ config, success: true });
  } catch (error) {
    console.error('Error updating AI config:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuracion de IA' },
      { status: 500 }
    );
  }
}

// Helpers

async function getAIConfig(): Promise<AIConfig> {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          'ai_enabled',
          'ai_model',
          'ai_temperature',
          'ai_max_tokens',
          'ai_auto_respond',
          'ai_sentiment_analysis',
          'ai_intent_detection',
          'rag_enabled',
        ],
      },
    },
  });

  const configMap = configs.reduce((acc: Record<string, string>, c: { key: string; value: string }) => {
    acc[c.key] = c.value;
    return acc;
  }, {});

  // Obtener modelos disponibles (simulado por ahora)
  const availableModels = [
    'llama3.2',
    'llama3.1',
    'mistral',
    'qwen2.5',
    'phi3',
    'gemma2',
  ];

  return {
    aiEnabled: configMap['ai_enabled'] !== 'false',
    selectedModel: configMap['ai_model'] || 'llama3.2',
    availableModels,
    temperature: parseFloat(configMap['ai_temperature'] || '0.7'),
    maxTokens: parseInt(configMap['ai_max_tokens'] || '1024'),
    autoRespond: configMap['ai_auto_respond'] !== 'false',
    sentimentAnalysis: configMap['ai_sentiment_analysis'] !== 'false',
    intentDetection: configMap['ai_intent_detection'] !== 'false',
    ragEnabled: configMap['rag_enabled'] !== 'false', // Por defecto HABILITADO para aprendizaje
  };
}

async function getConversationInsights(conversationId: string): Promise<ConversationInsights> {
  // Obtener mensajes de la conversacion
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'asc' },
    select: {
      content: true,
      direction: true,
      intent: true,
      timestamp: true,
    },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      sentiment: true,
      category: true,
      status: true,
    },
  });

  // Analizar mensajes para generar insights
  type MessageInfo = { content: string; direction: string; intent: string | null; timestamp: Date };
  const userMessages = messages.filter((m: MessageInfo) => m.direction === 'inbound');
  const keywords = extractKeywords(userMessages.map((m: MessageInfo) => m.content).join(' '));

  // Determinar urgencia basado en palabras clave
  const urgentWords = ['urgente', 'inmediato', 'rapido', 'ahora', 'pronto', 'emergencia'];
  const hasUrgentWords = userMessages.some((m: MessageInfo) =>
    urgentWords.some((w) => m.content.toLowerCase().includes(w))
  );

  // Generar resumen basico
  const messageCount = messages.length;
  const userMessageCount = userMessages.length;
  const lastMessage = messages[messages.length - 1];

  // Determinar sentimiento predominante
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (conversation?.sentiment === 'positive') sentiment = 'positive';
  else if (conversation?.sentiment === 'negative') sentiment = 'negative';

  // Sugerir acciones basadas en el contexto
  const suggestedActions: string[] = [];
  const suggestedResponses: string[] = [];

  if (hasUrgentWords) {
    suggestedActions.push('Priorizar esta conversacion');
  }
  if (sentiment === 'negative') {
    suggestedActions.push('Considerar escalar a modo manual');
    suggestedResponses.push('Lamento los inconvenientes. Permíteme ayudarte personalmente.');
  }
  if (userMessageCount > 5 && messages[messages.length - 1]?.direction === 'inbound') {
    suggestedActions.push('Cliente esperando respuesta');
    suggestedResponses.push('Gracias por esperar. Estoy revisando tu consulta.');
  }

  // Detectar temas principales
  const mainTopics: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    Precio: ['precio', 'costo', 'valor', 'cotizacion', 'presupuesto'],
    Soporte: ['error', 'problema', 'no funciona', 'ayuda', 'falla'],
    Servicios: ['servicio', 'desarrollo', 'software', 'app', 'web'],
    Contacto: ['contacto', 'llamar', 'telefono', 'email', 'correo'],
    Horario: ['horario', 'atencion', 'hora', 'cuando', 'disponible'],
  };

  for (const [topic, words] of Object.entries(topicKeywords)) {
    if (userMessages.some((m: MessageInfo) => words.some((w) => m.content.toLowerCase().includes(w)))) {
      mainTopics.push(topic);
    }
  }

  if (mainTopics.length === 0) {
    mainTopics.push('Consulta General');
  }

  // Agregar respuestas sugeridas basadas en temas
  if (mainTopics.includes('Precio')) {
    suggestedResponses.push('Los precios varían según el proyecto. ¿Podrías contarme más detalles?');
  }
  if (mainTopics.includes('Horario')) {
    suggestedResponses.push('Nuestro horario es de Lunes a Viernes, 9:00 - 18:00.');
  }
  if (mainTopics.includes('Contacto')) {
    suggestedResponses.push('Puedes contactarnos al +56 9 6541 9765 o por email a contacto@zgamersa.com');
  }

  return {
    summary: `Conversación con ${userMessageCount} mensajes del cliente. ${messageCount - userMessageCount} respuestas enviadas.`,
    mainTopics,
    sentiment,
    urgency: hasUrgentWords ? 'high' : sentiment === 'negative' ? 'medium' : 'low',
    suggestedActions,
    suggestedResponses: suggestedResponses.slice(0, 3),
  };
}

async function getResponseSuggestions(conversationId: string): Promise<string[]> {
  // Obtener ultimo mensaje del usuario
  const lastUserMessage = await prisma.message.findFirst({
    where: {
      conversationId,
      direction: 'inbound',
    },
    orderBy: { timestamp: 'desc' },
  });

  if (!lastUserMessage) {
    return [
      '¡Hola! ¿En qué puedo ayudarte hoy?',
      'Gracias por contactarnos. ¿Cómo puedo asistirte?',
    ];
  }

  const content = lastUserMessage.content.toLowerCase();
  const suggestions: string[] = [];

  // Sugerencias basadas en palabras clave
  if (content.includes('hola') || content.includes('buenos')) {
    suggestions.push('¡Hola! Bienvenido a Devlmer Project. ¿En qué puedo ayudarte?');
    suggestions.push('¡Hola! Gracias por escribirnos. ¿Qué consulta tienes hoy?');
  }

  if (content.includes('precio') || content.includes('costo') || content.includes('cotiza')) {
    suggestions.push('Los precios dependen del alcance del proyecto. ¿Podrías darme más detalles?');
    suggestions.push('Con gusto te preparo una cotización. ¿Qué tipo de desarrollo necesitas?');
  }

  if (content.includes('servicio') || content.includes('hacen')) {
    suggestions.push('Ofrecemos desarrollo de software, chatbots con IA y automatización. ¿Qué te interesa?');
    suggestions.push('Nuestros servicios incluyen apps web, móviles e integración de APIs. ¿Te cuento más?');
  }

  if (content.includes('gracias') || content.includes('adios') || content.includes('bye')) {
    suggestions.push('¡Gracias a ti! Si tienes más consultas, aquí estamos.');
    suggestions.push('Fue un placer atenderte. ¡Que tengas un excelente día!');
  }

  if (content.includes('ayuda') || content.includes('problema') || content.includes('error')) {
    suggestions.push('Entiendo tu situación. Permíteme ayudarte a resolver esto.');
    suggestions.push('Lamento el inconveniente. ¿Puedes darme más detalles del problema?');
  }

  // Si no hay sugerencias específicas, agregar genéricas
  if (suggestions.length === 0) {
    suggestions.push('Gracias por tu mensaje. ¿Podrías darme más detalles?');
    suggestions.push('Entiendo. Permíteme revisar y te respondo en un momento.');
    suggestions.push('¿Hay algo específico en lo que pueda ayudarte?');
  }

  return suggestions.slice(0, 4);
}

function extractKeywords(text: string): string[] {
  const stopWords = ['el', 'la', 'de', 'en', 'un', 'una', 'que', 'es', 'y', 'a', 'los', 'las', 'del', 'al', 'se', 'con', 'por', 'para', 'su', 'no', 'me', 'te', 'lo', 'le'];

  const words = text
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.includes(w));

  // Contar frecuencia
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1;
  });

  // Ordenar por frecuencia
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
