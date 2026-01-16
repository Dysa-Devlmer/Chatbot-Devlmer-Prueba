/**
 * OllamaService
 *
 * Servicio de IA usando Ollama (local, gratuito y sin API key)
 * Como fallback cuando Perplexity falla
 */
import { ollamaLogger, logError } from '@/lib/logger'
import { ConversationContext, AIResponse } from '@/types/schemas'

interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface OllamaRequest {
  model: string
  messages: OllamaMessage[]
  temperature: number
  top_p: number
  stream: boolean
}

interface OllamaChoice {
  message?: {
    content?: string
  }
}

interface OllamaResponse {
  message?: {
    content?: string
  }
  choices?: OllamaChoice[]
  error?: string
}

export class OllamaService {
  private readonly baseUrl: string
  private readonly model = 'llama3.2'
  private readonly temperature = 0.7
  private readonly topP = 1
  private readonly timeoutMs = 60_000

  constructor() {
    const baseUrl = process.env.OLLAMA_HOST?.trim() || 'http://localhost:11434'
    this.baseUrl = baseUrl
    ollamaLogger.info('OllamaService initialized', { baseUrl })
  }

  /**
   * Genera una respuesta usando Ollama
   */
  async generateResponse(
    text: string,
    context?: ConversationContext
  ): Promise<AIResponse> {
    const formattedText = this.formatMessage(text)
    const messages = this.buildMessages(formattedText, context)

    ollamaLogger.info('Generating response with Ollama', {
      textLength: formattedText.length,
      hasContext: Boolean(context),
      messageCount: messages.length,
      model: this.model,
    })

    const request: OllamaRequest = {
      model: this.model,
      messages,
      temperature: this.temperature,
      top_p: this.topP,
      stream: false,
    }

    try {
      return await this.callOllama(request)
    } catch (error) {
      const originalError = error instanceof Error
        ? error
        : new Error('Unknown error calling Ollama')

      logError(ollamaLogger, originalError, { stage: 'ollama-generation' })

      return {
        response: 'No pude generar una respuesta en este momento. Por favor intenta de nuevo.',
      }
    }
  }

  private async callOllama(request: OllamaRequest): Promise<AIResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const url = `${this.baseUrl}/api/chat`
      ollamaLogger.debug('Calling Ollama endpoint', { url, model: request.model })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errorMessage = `Ollama API error: ${response.status}`

        try {
          const errorData = (await response.json()) as OllamaResponse
          if (errorData?.error) {
            errorMessage = `${errorMessage} - ${errorData.error}`
          }
        } catch {
          // Best-effort error parsing
        }

        throw new Error(errorMessage)
      }

      const data = (await response.json()) as OllamaResponse
      const content = data.message?.content?.trim()

      if (!content) {
        throw new Error('Ollama returned an empty response')
      }

      ollamaLogger.info('Ollama response generated successfully', {
        contentLength: content.length,
      })

      return { response: content }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama request timed out')
      }

      throw error instanceof Error ? error : new Error('Unknown Ollama error')
    } finally {
      clearTimeout(timeout)
    }
  }

  private buildMessages(
    text: string,
    context?: ConversationContext
  ): OllamaMessage[] {
    const messages: OllamaMessage[] = []

    // Agregar contexto del sistema
    const systemContext = this.buildSystemContext(context)
    if (systemContext) {
      messages.push({ role: 'system', content: systemContext })
    }

    // Agregar mensajes recientes
    if (context?.recentMessages?.length) {
      context.recentMessages.forEach((message) => {
        messages.push({
          role: message.role,
          content: this.formatMessage(message.content),
        })
      })
    }

    // Agregar mensaje del usuario
    messages.push({ role: 'user', content: text })

    return messages
  }

  private buildSystemContext(context?: ConversationContext): string | null {
    if (!context) {
      return 'Eres un asistente de atención al cliente amable y útil. Responde en el idioma del usuario.'
    }

    const profile = context.userProfile
    const language = profile?.language || 'español'
    const name = profile?.name || 'usuario'

    return `Eres un asistente de atención al cliente amable y útil. El usuario se llama ${name} y prefiere comunicarse en ${language}. Responde siempre de forma clara, concisa y amigable.`
  }

  private formatMessage(text: string): string {
    const normalized = text
      .replace(/\s+/g, ' ')
      .replace(/\u0000/g, '')
      .trim()

    if (normalized.length <= 2000) {
      return normalized
    }

    return normalized.slice(0, 2000)
  }

  /**
   * Verifica si Ollama está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(`${this.baseUrl}/api/tags`, {
          signal: controller.signal,
        })
        return response.ok
      } finally {
        clearTimeout(timeout)
      }
    } catch {
      return false
    }
  }
}

export const ollamaService = new OllamaService()
