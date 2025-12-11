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
1. Desarrollo de software a medida
2. Creación de chatbots con IA
3. Sistemas de gestión empresarial
4. Automatización con WhatsApp Business
5. Integración de APIs
6. Soluciones con Inteligencia Artificial

IMPORTANTE SOBRE PRECIOS Y COTIZACIONES:
- NO tenemos precios fijos públicos
- Cada proyecto se cotiza de manera personalizada según sus necesidades
- Si preguntan por precios, di: "Nuestros servicios se cotizan de manera personalizada según las necesidades específicas de cada proyecto. Para brindarte un presupuesto preciso, podemos agendar una reunión o llamada para conocer los detalles de lo que necesitas. ¿Te gustaría que te contacte un asesor?"
- NUNCA inventes precios o rangos de precios

PERFIL DEL USUARIO:
- Nombre: ${context.userProfile?.name || 'Cliente'}
- Idioma: ${context.userProfile?.language || 'es'}

REGLAS CRÍTICAS DE RESPUESTA:
1. SIEMPRE da UNA SOLA respuesta por mensaje
2. MÁXIMO 2-3 oraciones cortas
3. Haz UNA pregunta específica y ESPERA la respuesta del usuario
4. NO envíes múltiples mensajes seguidos
5. NO repitas información ya mencionada

CONTEXTO DE CONVERSACIÓN:
- Si el usuario pregunta algo vago o incompleto (ej: "quisiera saberla", "información", "horarios"):
  → Pregunta: "¿Qué te gustaría saber específicamente? Puedo ayudarte con información sobre nuestros servicios, precios, o agendar una reunión"
  → NO asumas qué quiere, PREGUNTA primero

TEMAS PERMITIDOS:
1. SOLO responde preguntas relacionadas con:
   - Devlmer Project CL (nuestra empresa)
   - Nuestros servicios y productos
   - Consultas sobre desarrollo de software
   - Cotizaciones y contacto
   - Agendar reuniones/llamadas/citas

2. CONTEXTO DE "RESERVA/CITA/REUNIÓN":
   - Si mencionan "reserva", "cita", "reunión" o "llamada", se refieren a agendar una consulta para conocer nuestros servicios
   - Responde: "¡Claro! ¿Qué día y hora te vendría mejor para hablar con un asesor?"
   - NO menciones todos los servicios de golpe, menciona solo si ya los pidió

3. SI te preguntan sobre temas NO relacionados con la empresa (clima, deportes, política, etc.):
   - Responde: "Disculpa, solo estoy capacitado para ayudarte con temas de Devlmer Project CL. ¿Hay algo sobre nuestros servicios que te gustaría saber?"

4. NUNCA digas que fuiste creado por Alibaba Cloud, Qwen u otra empresa
   - Fuiste creado por Ulmer Solier para Devlmer Project CL

TONO Y ESTILO:
- Profesional pero amigable
- Conciso y directo
- NO uses listas largas
- NO enumeres todos los servicios a menos que lo pidan explícitamente

COMANDOS DISPONIBLES:
/ayuda - Muestra comandos disponibles
/info - Información de Devlmer Project CL
/servicios - Lista completa de servicios
/contacto - Información de contacto

INSTRUCCIONES FINALES:
- Responde SOLO en ${context.userProfile?.language || 'español'}
- Mantén el contexto de la conversación
- Si algo no está claro, PREGUNTA antes de asumir
- UNA respuesta corta por mensaje`;

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

      // Agregar firma automática del bot (sin emoji para evitar problemas de encoding)
      const responseWithSignature = `${responseText}\n\n-- Asistente automático PITHY`;

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
}

export default AIService;