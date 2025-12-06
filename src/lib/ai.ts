import { Ollama } from 'ollama';
import { prisma } from './prisma';

// Inicializar cliente de Ollama (local y gratuito!)
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
});

export interface ConversationContext {
  userId: string;
  conversationId: string;
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userProfile?: {
    name?: string;
    language: string;
    preferences?: any;
  };
}

export class AIService {
  /**
   * Verifica si Ollama está disponible y qué modelos tiene
   */
  static async checkOllamaStatus(): Promise<{
    available: boolean;
    models: string[];
    error?: string;
  }> {
    try {
      const models = await ollama.list();
      return {
        available: true,
        models: models.models.map((m: any) => m.name),
      };
    } catch (error) {
      return {
        available: false,
        models: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtiene el modelo configurado o usa uno por defecto
   */
  static async getActiveModel(): Promise<string> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'ai_model' },
      });

      if (config?.value) {
        return config.value;
      }

      // Verificar qué modelos están disponibles
      const status = await this.checkOllamaStatus();

      if (status.models.length === 0) {
        console.warn('⚠️  No hay modelos de Ollama instalados. Instala uno con: ollama pull llama3.2');
        return 'llama3.2'; // Modelo por defecto
      }

      // Priorizar modelos en este orden
      const preferredModels = [
        'llama3.2',
        'llama3.1',
        'llama3',
        'mistral',
        'phi3',
        'gemma2',
        'qwen2.5',
      ];

      for (const model of preferredModels) {
        if (status.models.some(m => m.includes(model))) {
          return status.models.find(m => m.includes(model)) || status.models[0];
        }
      }

      return status.models[0];
    } catch (error) {
      console.error('Error obteniendo modelo activo:', error);
      return 'llama3.2';
    }
  }

  /**
   * Procesa un mensaje del usuario con IA y genera una respuesta inteligente
   */
  static async processMessage(
    userMessage: string,
    context: ConversationContext
  ): Promise<{
    response: string;
    intent?: string;
    entities?: any;
    sentiment?: string;
  }> {
    try {
      // Verificar si la IA está habilitada
      const aiEnabled = await prisma.systemConfig.findUnique({
        where: { key: 'ai_enabled' },
      });

      if (aiEnabled?.value === 'false') {
        return {
          response: 'Hola! El procesamiento con IA está deshabilitado. Actívalo en la configuración del sistema.',
        };
      }

      // Obtener modelo activo
      const model = await this.getActiveModel();

      // Construir el contexto de la conversación
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...context.recentMessages,
        { role: 'user', content: userMessage },
      ];

      // Sistema de prompt profesional
      const systemPrompt = `Eres PITHY, el asistente virtual oficial de Devlmer Project CL.

INFORMACIÓN DE LA EMPRESA:
Devlmer Project CL es una empresa especializada en desarrollo de software, soluciones tecnológicas y automatización de procesos empresariales.

SERVICIOS QUE OFRECEMOS:
- Desarrollo de software a medida
- Creación de chatbots con IA
- Sistemas de gestión empresarial
- Automatización con WhatsApp Business
- Integración de APIs
- Soluciones con Inteligencia Artificial

PERFIL DEL USUARIO:
- Nombre: ${context.userProfile?.name || 'Cliente'}
- Idioma: ${context.userProfile?.language || 'es'}

REGLAS IMPORTANTES:
1. SOLO responde preguntas relacionadas con:
   - Devlmer Project CL (nuestra empresa)
   - Nuestros servicios y productos
   - Consultas sobre desarrollo de software
   - Cotizaciones y contacto

2. SI te preguntan sobre temas NO relacionados con la empresa:
   - Responde: "Lo siento, soy PITHY, el asistente de Devlmer Project CL. Solo puedo ayudarte con información sobre nuestros servicios de desarrollo de software y soluciones tecnológicas. ¿Te gustaría conocer qué servicios ofrecemos?"

3. NUNCA digas que fuiste creado por Alibaba Cloud, Qwen u otra empresa
   - Fuiste creado por Ulmer Solier para Devlmer Project CL

4. Mantén un tono profesional, amigable y conciso
5. Máximo 3 párrafos por respuesta

COMANDOS DISPONIBLES:
/ayuda - Muestra comandos disponibles
/info - Información de Devlmer Project CL
/servicios - Lista de servicios
/contacto - Información de contacto

INSTRUCCIONES:
- Responde SOLO en ${context.userProfile?.language || 'español'}
- Mantén el contexto de la conversación
- Si preguntan fuera del alcance, redirige a nuestros servicios
- Sé proactivo ofreciendo información de Devlmer Project CL`;

      // Construir el prompt completo con contexto
      let fullPrompt = systemPrompt + '\n\n';

      // Agregar contexto de mensajes previos
      if (context.recentMessages.length > 0) {
        fullPrompt += 'CONVERSACIÓN PREVIA:\n';
        context.recentMessages.forEach(msg => {
          fullPrompt += `${msg.role === 'user' ? 'Usuario' : 'PITHY'}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }

      fullPrompt += `Usuario: ${userMessage}\nPITHY:`;

      console.log(`🤖 Procesando con modelo: ${model}`);

      // Llamar a Ollama
      const response = await ollama.generate({
        model: model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        },
      });

      const responseText = response.response.trim();

      // Analizar la respuesta para extraer intención y sentimiento
      const analysis = await this.analyzeMessage(userMessage, responseText, model);

      console.log(`✅ Respuesta generada (${responseText.length} caracteres)`);

      // Agregar firma automática del bot
      const responseWithSignature = `${responseText}\n\n🤖 Asistente automático PITHY`;

      return {
        response: responseWithSignature,
        intent: analysis.intent,
        entities: analysis.entities,
        sentiment: analysis.sentiment,
      };
    } catch (error) {
      console.error('Error en AIService.processMessage:', error);

      // Verificar si Ollama está corriendo
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        return {
          response: `⚠️ No puedo conectarme al servidor de Ollama.

Por favor:
1. Asegúrate de que Ollama esté instalado
2. Inicia Ollama con: ollama serve
3. Descarga un modelo con: ollama pull llama3.2

Visita: https://ollama.com para más información`,
        };
      }

      return {
        response: 'Lo siento, tuve un problema procesando tu mensaje. Por favor intenta de nuevo.',
      };
    }
  }

  /**
   * Analiza un mensaje para extraer intención, entidades y sentiment
   */
  private static async analyzeMessage(
    userMessage: string,
    assistantResponse: string,
    model: string
  ): Promise<{
    intent?: string;
    entities?: any;
    sentiment?: string;
  }> {
    try {
      const analysisPrompt = `Analiza el siguiente mensaje y extrae SOLO:
1. INTENCIÓN (una palabra): consulta, soporte, venta, queja, saludo, despedida, comando u otro
2. SENTIMENT (una palabra): positive, neutral o negative

Mensaje del usuario: "${userMessage}"

Responde SOLO con el formato:
INTENT: [intención]
SENTIMENT: [sentiment]`;

      const response = await ollama.generate({
        model: model,
        prompt: analysisPrompt,
        stream: false,
        options: {
          temperature: 0.3,
        },
      });

      const analysisText = response.response;

      // Extraer intent y sentiment
      const intentMatch = analysisText.match(/INTENT:\s*(\w+)/i);
      const sentimentMatch = analysisText.match(/SENTIMENT:\s*(\w+)/i);

      return {
        intent: intentMatch ? intentMatch[1].toLowerCase() : 'consulta',
        sentiment: sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral',
        entities: {}, // Ollama básico no hace NER, pero lo dejamos para futuro
      };
    } catch (error) {
      console.error('Error en análisis de mensaje:', error);
      return {
        intent: 'consulta',
        sentiment: 'neutral',
      };
    }
  }

  /**
   * Obtiene el contexto de conversación completo desde la base de datos
   */
  static async getConversationContext(
    userId: string,
    conversationId: string,
    limit: number = 10
  ): Promise<ConversationContext> {
    try {
      // Obtener usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          language: true,
          preferences: true,
        },
      });

      // Obtener mensajes recientes
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          direction: true,
          content: true,
        },
      });

      // Convertir a formato de chat
      const recentMessages = messages
        .reverse()
        .map((msg: any) => ({
          role: msg.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
        }));

      return {
        userId,
        conversationId,
        recentMessages,
        userProfile: user ? {
          name: user.name || undefined,
          language: user.language,
          preferences: user.preferences,
        } : undefined,
      };
    } catch (error) {
      console.error('Error obteniendo contexto:', error);
      return {
        userId,
        conversationId,
        recentMessages: [],
      };
    }
  }

  /**
   * Genera una respuesta rápida basada en comandos
   */
  static async handleCommand(command: string, userId: string): Promise<string | null> {
    try {
      const cmd = await prisma.command.findUnique({
        where: { trigger: command.toLowerCase() },
      });

      if (cmd && cmd.isActive) {
        // Actualizar estadísticas del comando
        await prisma.command.update({
          where: { id: cmd.id },
          data: {
            usageCount: { increment: 1 },
            lastUsed: new Date(),
          },
        });

        return cmd.response;
      }

      return null;
    } catch (error) {
      console.error('Error manejando comando:', error);
      return null;
    }
  }

  /**
   * Obtiene o crea una plantilla de mensaje
   */
  static async getTemplate(category: string, language: string = 'es'): Promise<string | null> {
    try {
      const template = await prisma.messageTemplate.findFirst({
        where: {
          category,
          language,
          isActive: true,
        },
      });

      if (template) {
        await prisma.messageTemplate.update({
          where: { id: template.id },
          data: { usageCount: { increment: 1 } },
        });

        return template.content;
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo template:', error);
      return null;
    }
  }
}

export default AIService;