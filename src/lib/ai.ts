import { Ollama } from 'ollama';
import { prisma } from './prisma';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { TranscriptionCache, TTSCache } from './audio-cache';

// Inicializar cliente de Ollama (local y gratuito!)
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
});

// URL del servicio de embeddings para RAG
const EMBEDDINGS_SERVICE_URL = process.env.EMBEDDINGS_SERVICE_URL || 'http://localhost:8001';

// Interfaces para el sistema de aprendizaje
interface SimilarConversation {
  id: string;
  user_message: string;
  bot_response: string;
  similarity: number;
  was_helpful: boolean | null;
}

interface LearningResult {
  id: string;
  vectorId: string | null;
  success: boolean;
}

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
   * Busca conversaciones similares en el sistema de aprendizaje (RAG)
   */
  static async searchSimilarConversations(
    query: string,
    nResults: number = 3,
    filterHelpful: boolean = true
  ): Promise<SimilarConversation[]> {
    try {
      const response = await fetch(`${EMBEDDINGS_SERVICE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          n_results: nResults,
          filter_helpful: filterHelpful,
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ Servicio de embeddings no disponible para búsqueda');
        return [];
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      // Silenciosamente retorna vacío si el servicio no está disponible
      console.debug('Servicio de embeddings no disponible:', error);
      return [];
    }
  }

  /**
   * Guarda una conversación para aprendizaje futuro
   */
  static async storeLearning(
    userMessage: string,
    botResponse: string,
    context: ConversationContext,
    intent?: string,
    category?: string
  ): Promise<LearningResult | null> {
    try {
      const response = await fetch(`${EMBEDDINGS_SERVICE_URL}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `learn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_message: userMessage,
          bot_response: botResponse,
          conversation_id: context.conversationId,
          user_id: context.userId,
          intent,
          category,
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ No se pudo guardar aprendizaje en embeddings');
        return null;
      }

      const data = await response.json();
      console.log('📚 Conversación guardada para aprendizaje:', data.vector_id);

      return {
        id: data.id || '',
        vectorId: data.vector_id || null,
        success: true,
      };
    } catch (error) {
      // No bloquear si el servicio no está disponible
      console.debug('Servicio de embeddings no disponible para guardar:', error);
      return null;
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

      // 🔍 RAG: Buscar conversaciones similares (opcional y con timeout agresivo)
      let similarConversations: SimilarConversation[] = [];

      // Verificar si RAG está habilitado (por defecto: deshabilitado para máxima velocidad)
      const ragConfig = await prisma.systemConfig.findUnique({
        where: { key: 'rag_enabled' },
      });
      const ragEnabled = ragConfig?.value === 'true';

      if (ragEnabled) {
        try {
          // Timeout de 300ms para no afectar velocidad de respuesta
          const ragPromise = this.searchSimilarConversations(userMessage, 3, true);
          const timeoutPromise = new Promise<SimilarConversation[]>((resolve) =>
            setTimeout(() => resolve([]), 300)
          );
          similarConversations = await Promise.race([ragPromise, timeoutPromise]);

          if (similarConversations.length > 0) {
            console.log(`📚 RAG: Encontradas ${similarConversations.length} conversaciones similares`);
          }
        } catch (ragError) {
          console.debug('RAG no disponible, continuando sin contexto histórico');
        }
      }

      // Construir el contexto de la conversación
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...context.recentMessages,
        { role: 'user', content: userMessage },
      ];

      // Obtener hora actual de Chile
      const now = new Date();
      const chileTime = now.toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const chileDate = now.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Sistema de prompt profesional MEJORADO - Más humano e inteligente
      const systemPrompt = `Eres PITHY, un asistente virtual amigable de Devlmer Project CL. Hablas como una persona real, no como un robot.

INFORMACIÓN DE LA EMPRESA:
Devlmer Project CL se especializa en desarrollo de software, soluciones tecnológicas y automatización de procesos.

Servicios principales: Desarrollo de software a medida, Chatbots con IA, Sistemas de gestión empresarial, Automatización con WhatsApp Business, Integración de APIs, Soluciones con IA.

PERFIL DEL USUARIO:
- Nombre: ${context.userProfile?.name || 'Cliente'}
- Idioma: ${context.userProfile?.language || 'es'}

═══════════════════════════════════════════════
REGLAS CRÍTICAS - SÉ INTELIGENTE Y HUMANO
═══════════════════════════════════════════════

1. PIENSA COMO HUMANO:
   - Si preguntan la hora → Responde con la hora actual de Chile (${chileTime})
   - Si preguntan la fecha → Responde con la fecha actual (${chileDate})
   - Si saludan → Saluda de vuelta naturalmente
   - Si agradecen → Responde "De nada" o "Con gusto"
   - Usa sentido común antes de redirigir

2. PREGUNTAS SIMPLES (Responde directamente):
   Hora: "Son las ${chileTime} (hora de Chile)"
   Fecha: "Hoy es ${chileDate}"
   Saludo: "¡Hola! ¿En qué puedo ayudarte?"
   Despedida: "¡Hasta pronto! Cualquier cosa, aquí estoy"

3. ADAPTA TU RESPUESTA según el contexto:
   - Si preguntan algo simple → Responde directo
   - Si preguntan sobre servicios → Explica brevemente
   - Si están interesados → Ofrece agendar reunión
   - Si están confundidos → Aclara con empatía

4. NO SEAS ROBOT:
   ❌ "Soy PITHY, el asistente de Devlmer Project CL. Solo puedo ayudarte con..."
   ✅ "¡Claro! [responde la pregunta]. ¿Algo más en lo que pueda ayudarte?"

   ❌ Enumerar todos los servicios sin que los pidan
   ✅ Mencionar solo lo relevante a su pregunta

5. UNA SOLA RESPUESTA:
   - Máximo 2-3 oraciones
   - Una idea principal
   - Si hay más que decir, hazlo en el siguiente mensaje

6. SOBRE PRECIOS:
   "Los precios varían según el proyecto. ¿Te gustaría que un asesor te contacte para darte un presupuesto personalizado?"
   NUNCA inventes precios.

7. TEMAS FUERA DE ALCANCE:
   Si preguntan sobre clima, deportes, noticias, política:
   "Esa es una buena pregunta, pero mi especialidad es ayudarte con soluciones de software. ¿Hay algo de Devlmer en lo que pueda ayudarte?"

8. SÉ NATURAL:
   - Usa contracciones naturales
   - Expresa empatía cuando corresponda
   - Admite si no sabes algo
   - No repitas información constantemente

EJEMPLOS DE RESPUESTAS CORRECTAS:

Pregunta: "¿Qué hora es?"
Respuesta: "Son las ${chileTime} (hora de Chile). ¿Necesitas algo más?"

Pregunta: "Hola"
Respuesta: "¡Hola! ¿En qué puedo ayudarte hoy?"

Pregunta: "¿Hacen chatbots?"
Respuesta: "Sí, desarrollamos chatbots con IA personalizados. ¿Te gustaría saber más sobre cómo funcionan?"

Pregunta: "¿Cuánto cuesta?"
Respuesta: "El costo depende del proyecto. ¿Te gustaría que un asesor te contacte para darte un presupuesto?"

RECUERDA: Eres un asistente inteligente que piensa antes de responder. Usa contexto y sentido común.`;

      // Construir el prompt completo con contexto
      let fullPrompt = systemPrompt + '\n\n';

      // 📚 RAG: Agregar contexto de conversaciones similares exitosas
      if (similarConversations.length > 0) {
        fullPrompt += 'EJEMPLOS DE RESPUESTAS EXITOSAS ANTERIORES (usa como referencia pero NO copies exactamente):\n';
        similarConversations.forEach((conv, index) => {
          fullPrompt += `Ejemplo ${index + 1} (similitud: ${(conv.similarity * 100).toFixed(0)}%):\n`;
          fullPrompt += `  Pregunta: "${conv.user_message}"\n`;
          fullPrompt += `  Respuesta: "${conv.bot_response}"\n\n`;
        });
        fullPrompt += 'Usa estos ejemplos como guía para el tono y estilo, pero adapta tu respuesta al contexto actual.\n\n';
      }

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

      // 📚 RAG: Guardar conversación para aprendizaje futuro (solo si RAG está habilitado)
      if (ragEnabled) {
        this.storeLearning(
          userMessage,
          responseText,
          context,
          analysis.intent,
          analysis.intent // Usar intent como category también
        ).catch(err => console.debug('Error guardando aprendizaje:', err));
      }

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

  /**
   * Transcribe audio usando Whisper
   * Soporta múltiples backends: local whisper, faster-whisper-server, o OpenAI
   */
  static async transcribeAudio(audioFilePath: string): Promise<{
    text: string;
    language?: string;
    duration?: number;
    success: boolean;
    error?: string;
    cached?: boolean;
  }> {
    try {
      console.log(`🎤 Iniciando transcripción de audio: ${audioFilePath}`);

      // Verificar que el archivo existe
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Archivo de audio no encontrado: ${audioFilePath}`);
      }

      // Verificar cache primero
      const cachedText = TranscriptionCache.get(audioFilePath);
      if (cachedText) {
        return {
          text: cachedText,
          success: true,
          cached: true,
        };
      }

      // Obtener configuración de Whisper
      const whisperConfig = await this.getWhisperConfig();

      let result: { text: string; language?: string; duration?: number };

      switch (whisperConfig.backend) {
        case 'faster-whisper-server':
          result = await this.transcribeWithFasterWhisperServer(audioFilePath, whisperConfig);
          break;
        case 'openai':
          result = await this.transcribeWithOpenAI(audioFilePath);
          break;
        case 'local':
        default:
          result = await this.transcribeWithLocalWhisper(audioFilePath, whisperConfig);
          break;
      }

      console.log(`✅ Transcripción completada: "${result.text.substring(0, 100)}..."`);

      // Guardar en cache
      if (result.text) {
        TranscriptionCache.set(audioFilePath, result.text);
      }

      return {
        ...result,
        success: true,
        cached: false,
      };
    } catch (error) {
      console.error('❌ Error en transcripción de audio:', error);
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en transcripción',
      };
    }
  }

  /**
   * Obtiene la configuración de Whisper desde la base de datos o usa valores por defecto
   */
  private static async getWhisperConfig(): Promise<{
    backend: 'local' | 'faster-whisper-server' | 'openai';
    model: string;
    language: string;
    serverUrl?: string;
  }> {
    try {
      const config = await prisma.systemConfig.findMany({
        where: {
          key: {
            in: ['whisper_backend', 'whisper_model', 'whisper_language', 'whisper_server_url'],
          },
        },
      });

      const configMap = new Map<string, string>(config.map((c: { key: string; value: string }) => [c.key, c.value]));

      return {
        backend: (configMap.get('whisper_backend') as 'local' | 'faster-whisper-server' | 'openai') || 'local',
        model: configMap.get('whisper_model') || 'small',
        language: configMap.get('whisper_language') || 'es',
        serverUrl: configMap.get('whisper_server_url') || 'http://localhost:8080',
      };
    } catch (error) {
      console.error('Error obteniendo config de Whisper:', error);
      return {
        backend: 'local',
        model: 'small',
        language: 'es',
      };
    }
  }

  /**
   * Transcribe usando whisper CLI local (whisper o faster-whisper)
   */
  private static async transcribeWithLocalWhisper(
    audioFilePath: string,
    config: { model: string; language: string }
  ): Promise<{ text: string; language?: string; duration?: number }> {
    return new Promise((resolve, reject) => {
      // Usar script mejorado si existe, sino el original
      let scriptPath = path.join(process.cwd(), 'whisper-transcribe-enhanced.py');
      if (!fs.existsSync(scriptPath)) {
        scriptPath = path.join(process.cwd(), 'whisper-transcribe.py');
      }

      const command = `python "${scriptPath}" "${audioFilePath}" ${config.model} ${config.language}`;

      console.log(`🔄 Ejecutando transcripción con faster-whisper...`);
      console.log(`📁 Archivo a transcribir: ${audioFilePath}`);

      // Verificar tamaño del archivo
      const fileSize = fs.statSync(audioFilePath).size;
      console.log(`📊 Tamaño del archivo: ${fileSize} bytes`);

      exec(command, {
        timeout: 120000,
        windowsHide: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
        },
        encoding: 'utf8',
      }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error ejecutando Whisper:`, error.message);
          if (stderr) {
            console.error(`Stderr:`, stderr);
          }

          // Si el script no existe o Python no está instalado, dar instrucciones
          if (error.message.includes('python') || error.message.includes('No such file')) {
            reject(new Error('Python o faster-whisper no están instalados. Instala con: pip install faster-whisper'));
          } else {
            reject(new Error(`Error en transcripción: ${error.message}`));
          }
          return;
        }

        try {
          // Parsear el resultado JSON
          const result = JSON.parse(stdout);

          if (result.success === false) {
            console.error(`❌ Transcripción falló: ${result.error}`);
            reject(new Error(result.error || 'Error desconocido en transcripción'));
            return;
          }

          console.log(`✅ Transcripción exitosa: "${result.text?.substring(0, 100)}..."`);

          resolve({
            text: result.text || 'No se pudo transcribir el audio',
            language: result.language || config.language,
            duration: result.duration,
          });
        } catch (parseError) {
          console.error(`❌ Error parseando resultado:`, parseError);
          console.error(`stdout:`, stdout);

          // Si no es JSON válido, intentar usar el texto directamente
          const text = stdout.trim();
          if (text) {
            resolve({
              text: text,
              language: config.language,
            });
          } else {
            reject(new Error('No se pudo obtener transcripción del audio'));
          }
        }
      });
    });
  }

  /**
   * Transcribe usando faster-whisper-server (API HTTP)
   */
  private static async transcribeWithFasterWhisperServer(
    audioFilePath: string,
    config: { serverUrl?: string; model: string; language: string }
  ): Promise<{ text: string; language?: string; duration?: number }> {
    const serverUrl = config.serverUrl || 'http://localhost:8080';

    // Leer el archivo de audio
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBlob = new Blob([audioBuffer]);

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', audioBlob, path.basename(audioFilePath));
    formData.append('model', config.model);
    formData.append('language', config.language);
    formData.append('response_format', 'json');

    console.log(`🌐 Enviando audio a faster-whisper-server: ${serverUrl}`);

    const response = await fetch(`${serverUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error del servidor Whisper: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      text: result.text || '',
      language: result.language || config.language,
      duration: result.duration,
    };
  }

  /**
   * Transcribe usando OpenAI Whisper API
   */
  private static async transcribeWithOpenAI(
    audioFilePath: string
  ): Promise<{ text: string; language?: string; duration?: number }> {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY no configurada para usar Whisper de OpenAI');
    }

    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBlob = new Blob([audioBuffer]);

    const formData = new FormData();
    formData.append('file', audioBlob, path.basename(audioFilePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error de OpenAI Whisper: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      text: result.text || '',
      language: 'es',
      duration: result.duration,
    };
  }

  /**
   * Verifica si Whisper está disponible en el sistema
   */
  static async checkWhisperStatus(): Promise<{
    available: boolean;
    backend: string;
    error?: string;
  }> {
    try {
      const config = await this.getWhisperConfig();

      if (config.backend === 'faster-whisper-server') {
        // Verificar servidor
        const serverUrl = config.serverUrl || 'http://localhost:8080';
        try {
          const response = await fetch(`${serverUrl}/health`, { method: 'GET' });
          return {
            available: response.ok,
            backend: 'faster-whisper-server',
          };
        } catch {
          return {
            available: false,
            backend: 'faster-whisper-server',
            error: `No se puede conectar a ${serverUrl}`,
          };
        }
      }

      if (config.backend === 'openai') {
        return {
          available: !!process.env.OPENAI_API_KEY,
          backend: 'openai',
          error: process.env.OPENAI_API_KEY ? undefined : 'OPENAI_API_KEY no configurada',
        };
      }

      // Verificar CLI local
      return new Promise((resolve) => {
        exec('which faster-whisper || which whisper', (error) => {
          resolve({
            available: !error,
            backend: 'local',
            error: error ? 'Whisper no encontrado. Instala con: pip install faster-whisper' : undefined,
          });
        });
      });
    } catch (error) {
      return {
        available: false,
        backend: 'unknown',
        error: error instanceof Error ? error.message : 'Error verificando Whisper',
      };
    }
  }

  /**
   * Convierte texto a audio usando Text-to-Speech
   * Soporta: edge-tts (Microsoft), gTTS (Google), o pyttsx3 (offline)
   * Incluye cache para evitar regenerar el mismo texto
   */
  static async textToSpeech(text: string): Promise<{
    audioPath: string;
    success: boolean;
    error?: string;
    cached?: boolean;
    cleanup: () => void;
  }> {
    try {
      console.log(`🔊 Generando audio TTS para: "${text.substring(0, 50)}..."`);

      // Obtener configuración de TTS
      const ttsConfig = await this.getTTSConfig();

      // Verificar cache primero
      const cachedPath = TTSCache.get(text, ttsConfig.voice);
      if (cachedPath) {
        return {
          audioPath: cachedPath,
          success: true,
          cached: true,
          cleanup: () => {
            // No eliminar archivos en cache
          },
        };
      }

      let audioPath: string;

      switch (ttsConfig.backend) {
        case 'xtts':
          // Verificar que hay audio de referencia configurado
          if (!ttsConfig.referenceAudio) {
            console.log('⚠️ XTTS requiere audio de referencia, usando edge-tts como fallback');
            audioPath = await this.generateWithEdgeTTS(text, ttsConfig);
          } else {
            audioPath = await this.generateWithXTTS(text, ttsConfig);
          }
          break;
        case 'edge-tts':
          audioPath = await this.generateWithEdgeTTS(text, ttsConfig);
          break;
        case 'gtts':
          audioPath = await this.generateWithGTTS(text, ttsConfig);
          break;
        case 'pyttsx3':
        default:
          audioPath = await this.generateWithPyttsx3(text, ttsConfig);
          break;
      }

      console.log(`✅ Audio TTS generado: ${audioPath}`);

      // Guardar en cache y obtener la ruta del cache
      const cachedAudioPath = TTSCache.set(text, ttsConfig.voice, audioPath);

      return {
        audioPath: cachedAudioPath,
        success: true,
        cached: false,
        cleanup: () => {
          // Eliminar archivo original (no el cache)
          try {
            if (fs.existsSync(audioPath) && audioPath !== cachedAudioPath) {
              fs.unlinkSync(audioPath);
              console.log(`🗑️ Audio TTS original eliminado: ${audioPath}`);
            }
          } catch (e) {
            console.error('Error eliminando audio TTS:', e);
          }
        },
      };
    } catch (error) {
      console.error('❌ Error en TTS:', error);
      return {
        audioPath: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en TTS',
        cleanup: () => {},
      };
    }
  }

  /**
   * Obtiene la configuración de TTS desde la base de datos
   */
  private static async getTTSConfig(): Promise<{
    backend: 'edge-tts' | 'gtts' | 'pyttsx3' | 'xtts';
    voice: string;
    language: string;
    rate: string;
    referenceAudio?: string;
  }> {
    try {
      const config = await prisma.systemConfig.findMany({
        where: {
          key: {
            in: ['tts_backend', 'tts_voice', 'tts_language', 'tts_rate', 'tts_reference_audio'],
          },
        },
      });

      const configMap = new Map<string, string>(config.map((c: { key: string; value: string }) => [c.key, c.value]));

      return {
        backend: (configMap.get('tts_backend') as 'edge-tts' | 'gtts' | 'pyttsx3' | 'xtts') || 'edge-tts',
        voice: configMap.get('tts_voice') || 'es-CL-CatalinaNeural', // Voz chilena por defecto
        language: configMap.get('tts_language') || 'es',
        rate: configMap.get('tts_rate') || '+0%',
        referenceAudio: configMap.get('tts_reference_audio') || '',
      };
    } catch (error) {
      console.error('Error obteniendo config de TTS:', error);
      return {
        backend: 'edge-tts',
        voice: 'es-CL-CatalinaNeural',
        language: 'es',
        rate: '+0%',
      };
    }
  }

  /**
   * Genera audio usando edge-tts (Microsoft Edge TTS - gratuito y alta calidad)
   */
  private static async generateWithEdgeTTS(
    text: string,
    config: { voice: string; rate: string }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempDir = os.tmpdir();
      const outputPath = path.join(tempDir, `tts_${Date.now()}.mp3`);

      // Escapar comillas en el texto
      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');

      const command = `python -m edge_tts --voice "${config.voice}" --rate="${config.rate}" --text "${escapedText}" --write-media "${outputPath}"`;

      console.log(`🔄 Ejecutando edge-tts...`);

      exec(command, { timeout: 60000, windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error en edge-tts: ${error.message}`));
          return;
        }

        if (!fs.existsSync(outputPath)) {
          reject(new Error('edge-tts no generó el archivo de audio'));
          return;
        }

        resolve(outputPath);
      });
    });
  }

  /**
   * Genera audio usando XTTS v2 (Clonación de voz)
   * Requiere: venv_xtts con TTS instalado y audio de referencia
   */
  private static async generateWithXTTS(
    text: string,
    config: { language: string; referenceAudio?: string }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempDir = os.tmpdir();
      const outputPath = path.join(tempDir, `xtts_${Date.now()}.wav`);

      // Escapar comillas en el texto
      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');

      // Usar el entorno virtual de XTTS
      const venvPython = process.platform === 'win32'
        ? path.join(process.cwd(), 'venv_xtts', 'Scripts', 'python.exe')
        : path.join(process.cwd(), 'venv_xtts', 'bin', 'python');

      const xttsScript = path.join(process.cwd(), 'xtts-tts.py');
      const referenceAudio = config.referenceAudio || path.join(process.cwd(), 'voice_samples', 'default.wav');

      const command = `"${venvPython}" "${xttsScript}" "${escapedText}" "${referenceAudio}" "${outputPath}" ${config.language}`;

      console.log(`🔄 Ejecutando XTTS v2 (clonación de voz)...`);
      console.log(`📁 Audio de referencia: ${referenceAudio}`);

      exec(command, {
        timeout: 120000,  // 2 minutos para XTTS (es más lento)
        windowsHide: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
        },
        encoding: 'utf8',
      }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error en XTTS:`, error.message);
          if (stderr) {
            console.error(`Stderr:`, stderr);
          }
          reject(new Error(`Error en XTTS: ${error.message}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (result.success === false) {
            reject(new Error(result.error || 'Error desconocido en XTTS'));
            return;
          }

          if (!fs.existsSync(outputPath)) {
            reject(new Error('XTTS no generó el archivo de audio'));
            return;
          }

          console.log(`✅ Audio XTTS generado: ${outputPath}`);
          resolve(outputPath);
        } catch (parseError) {
          // Si no es JSON, verificar si el archivo existe
          if (fs.existsSync(outputPath)) {
            resolve(outputPath);
          } else {
            reject(new Error('XTTS no generó el archivo de audio'));
          }
        }
      });
    });
  }

  /**
   * Genera audio usando gTTS (Google Text-to-Speech)
   */
  private static async generateWithGTTS(
    text: string,
    config: { language: string }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempDir = os.tmpdir();
      const outputPath = path.join(tempDir, `tts_${Date.now()}.mp3`);

      // Crear script Python temporal para gTTS
      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
      const command = `python -c "from gtts import gTTS; tts = gTTS('${escapedText}', lang='${config.language}'); tts.save('${outputPath}')"`;

      console.log(`🔄 Ejecutando gTTS...`);

      exec(command, { timeout: 60000, windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error en gTTS: ${error.message}`));
          return;
        }

        if (!fs.existsSync(outputPath)) {
          reject(new Error('gTTS no generó el archivo de audio'));
          return;
        }

        resolve(outputPath);
      });
    });
  }

  /**
   * Genera audio usando pyttsx3 (offline)
   */
  private static async generateWithPyttsx3(
    text: string,
    config: { rate: string }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempDir = os.tmpdir();
      const outputPath = path.join(tempDir, `tts_${Date.now()}.mp3`);

      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
      const pythonScript = `
import pyttsx3
engine = pyttsx3.init()
engine.save_to_file("${escapedText}", "${outputPath}")
engine.runAndWait()
`;

      const command = `python -c "${pythonScript.replace(/\n/g, ';')}"`;

      console.log(`🔄 Ejecutando pyttsx3...`);

      exec(command, { timeout: 60000, windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error en pyttsx3: ${error.message}`));
          return;
        }

        if (!fs.existsSync(outputPath)) {
          reject(new Error('pyttsx3 no generó el archivo de audio'));
          return;
        }

        resolve(outputPath);
      });
    });
  }

  /**
   * Verifica si TTS está disponible
   */
  static async checkTTSStatus(): Promise<{
    available: boolean;
    backend: string;
    voices?: string[];
    error?: string;
  }> {
    try {
      const config = await this.getTTSConfig();

      // Verificar edge-tts
      return new Promise((resolve) => {
        exec('edge-tts --list-voices', { timeout: 10000 }, (error, stdout) => {
          if (!error && stdout) {
            // Extraer voces en español
            const spanishVoices = stdout
              .split('\n')
              .filter((line: string) => line.includes('es-'))
              .map((line: string) => line.split(':')[0]?.trim())
              .filter(Boolean)
              .slice(0, 10);

            resolve({
              available: true,
              backend: 'edge-tts',
              voices: spanishVoices,
            });
          } else {
            // Intentar con gTTS
            exec('python -c "from gtts import gTTS"', (gttsError) => {
              if (!gttsError) {
                resolve({
                  available: true,
                  backend: 'gtts',
                });
              } else {
                resolve({
                  available: false,
                  backend: 'none',
                  error: 'TTS no disponible. Instala con: pip install edge-tts',
                });
              }
            });
          }
        });
      });
    } catch (error) {
      return {
        available: false,
        backend: 'unknown',
        error: error instanceof Error ? error.message : 'Error verificando TTS',
      };
    }
  }

  /**
   * Verifica si el servicio de embeddings/RAG está disponible
   */
  static async checkEmbeddingsStatus(): Promise<{
    available: boolean;
    totalEmbeddings: number;
    ollamaStatus: string;
    chromadbStatus: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${EMBEDDINGS_SERVICE_URL}/stats`);

      if (!response.ok) {
        return {
          available: false,
          totalEmbeddings: 0,
          ollamaStatus: 'unknown',
          chromadbStatus: 'unknown',
          error: `Error del servidor: ${response.statusText}`,
        };
      }

      const stats = await response.json();

      return {
        available: true,
        totalEmbeddings: stats.total_embeddings || 0,
        ollamaStatus: stats.ollama_status || 'unknown',
        chromadbStatus: stats.chromadb_status || 'unknown',
      };
    } catch (error) {
      return {
        available: false,
        totalEmbeddings: 0,
        ollamaStatus: 'offline',
        chromadbStatus: 'offline',
        error: 'Servicio de embeddings no disponible. Inicia con: cd embeddings-service && uvicorn main:app --port 8001',
      };
    }
  }
}

export default AIService;