import { prisma } from './prisma';

interface PerplexityConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface PerplexityMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PerplexityResponse {
  response: string;
  success: boolean;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexityService {
  private static config: PerplexityConfig | null = null;

  /**
   * Obtiene la configuración de Perplexity desde la base de datos
   */
  static async loadConfig(): Promise<void> {
    try {
      const apiKeyConfig = await prisma.systemConfig.findUnique({
        where: { key: 'perplexity_api_key' },
      });

      const modelConfig = await prisma.systemConfig.findUnique({
        where: { key: 'perplexity_model' },
      });

      const temperatureConfig = await prisma.systemConfig.findUnique({
        where: { key: 'perplexity_temperature' },
      });

      const maxTokensConfig = await prisma.systemConfig.findUnique({
        where: { key: 'perplexity_max_tokens' },
      });

      this.config = {
        apiKey: apiKeyConfig?.value || process.env.PERPLEXITY_API_KEY || '',
        model: modelConfig?.value || 'llama-3.1-sonar-large-128k-chat',
        temperature: parseFloat(temperatureConfig?.value || '0.7'),
        maxTokens: parseInt(maxTokensConfig?.value || '1024', 10),
      };
    } catch (error) {
      console.error('Error cargando configuración de Perplexity:', error);
      throw new Error('No se pudo cargar la configuración de Perplexity');
    }
  }

  /**
   * Verifica si la configuración de Perplexity está completa
   */
  static async isConfigured(): Promise<boolean> {
    if (!this.config) {
      await this.loadConfig();
    }

    return !!this.config?.apiKey;
  }

  /**
   * Envía un mensaje a la API de Perplexity y devuelve la respuesta
   */
  static async sendMessage(
    messages: PerplexityMessage[],
    options?: Partial<PerplexityConfig>
  ): Promise<PerplexityResponse> {
    if (!this.config) {
      await this.loadConfig();
    }

    // Validar que tengamos la API key
    if (!this.config?.apiKey) {
      return {
        response: '',
        success: false,
        error: 'La API key de Perplexity no está configurada',
      };
    }

    try {
      // Combinar la configuración predeterminada con las opciones proporcionadas
      const config = {
        ...this.config,
        ...options,
      } as PerplexityConfig;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          response: '',
          success: false,
          error: `Error de la API de Perplexity: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`,
        };
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        return {
          response: '',
          success: false,
          error: 'La API de Perplexity no devolvió una respuesta válida',
        };
      }

      return {
        response: data.choices[0].message.content,
        success: true,
        usage: data.usage,
      };
    } catch (error) {
      console.error('Error llamando a la API de Perplexity:', error);
      return {
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al llamar a la API de Perplexity',
      };
    }
  }

  /**
   * Procesa un mensaje del usuario con la IA de Perplexity
   */
  static async processMessage(
    userMessage: string,
    context?: {
      conversationHistory?: PerplexityMessage[];
      systemPrompt?: string;
    }
  ): Promise<PerplexityResponse> {
    if (!this.config) {
      await this.loadConfig();
    }

    try {
      // Preparar los mensajes para enviar a la API
      const messages: PerplexityMessage[] = [];

      // Agregar el prompt del sistema si está definido
      if (context?.systemPrompt) {
        messages.push({
          role: 'system',
          content: context.systemPrompt,
        });
      } else {
        // Prompt del sistema predeterminado
        messages.push({
          role: 'system',
          content: `Eres un asistente de IA útil y amigable. Responde de manera clara, concisa y profesional.`,
        });
      }

      // Agregar el historial de conversación si está disponible
      if (context?.conversationHistory) {
        messages.push(...context.conversationHistory);
      }

      // Agregar el mensaje del usuario
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Enviar a la API de Perplexity
      return await this.sendMessage(messages);
    } catch (error) {
      console.error('Error procesando mensaje con Perplexity:', error);
      return {
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al procesar mensaje con Perplexity',
      };
    }
  }

  /**
   * Verifica si la API de Perplexity está disponible
   */
  static async checkConnection(): Promise<{
    available: boolean;
    model?: string;
    error?: string;
  }> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config?.apiKey) {
      return {
        available: false,
        error: 'API key de Perplexity no configurada',
      };
    }

    try {
      // Hacer una llamada de prueba a la API
      const response = await this.sendMessage([
        {
          role: 'user',
          content: 'Hola, ¿estás disponible?',
        }
      ], { maxTokens: 10 });

      if (response.success) {
        return {
          available: true,
          model: this.config.model,
        };
      } else {
        return {
          available: false,
          error: response.error,
        };
      }
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Error desconocido verificando conexión',
      };
    }
  }
}

export default PerplexityService;