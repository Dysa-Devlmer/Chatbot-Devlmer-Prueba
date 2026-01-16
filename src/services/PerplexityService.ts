/**
 * PerplexityService
 *
 * Servicio de IA para generar respuestas con Perplexity y fallback a Claude.
 */
import Anthropic from '@anthropic-ai/sdk'
import { perplexityLogger, logError } from '@/lib/logger'
import { ConversationContext, AIResponse } from '@/types/schemas'
import { ollamaService } from './OllamaService'

export interface PerplexityMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface PerplexityRequest {
  model: string
  messages: PerplexityMessage[]
  temperature: number
  max_tokens: number
  top_p: number
}

interface PerplexityApiChoice {
  message?: {
    content?: string
  }
}

interface PerplexityApiResponse {
  choices?: PerplexityApiChoice[]
  citations?: string[]
  sources?: Array<{ url?: string }> | string[]
  references?: Array<{ url?: string }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: {
    message?: string
  }
}

export class PerplexityService {
  private readonly apiKey: string
  private readonly claudeApiKey?: string
  private readonly model = 'sonar-pro'
  private readonly temperature = 0.7
  private readonly maxTokens = 1000
  private readonly topP = 1
  private readonly timeoutMs = 30_000
  private claudeClient?: Anthropic

  /**
   * Inicializa el servicio y valida configuracion requerida.
   */
  constructor() {
    const apiKey = process.env.PERPLEXITY_API_KEY?.trim()

    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY no esta configurada en el entorno')
    }

    this.apiKey = apiKey
    this.claudeApiKey = process.env.CLAUDE_API_KEY?.trim()

    perplexityLogger.info('PerplexityService initialized')
  }

  /**
   * Genera una respuesta usando Perplexity y aplica fallback si falla.
   */
  async generateResponse(
    text: string,
    context?: ConversationContext
  ): Promise<AIResponse> {
    const formattedText = this.formatMessage(text)
    const messages = this.buildMessages(formattedText, context)

    perplexityLogger.info('Generating response with Perplexity', {
      textLength: formattedText.length,
      hasContext: Boolean(context),
      messageCount: messages.length,
    })

    const request: PerplexityRequest = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      top_p: this.topP,
    }

    this.logRequest(
      {
        model: request.model,
        messageCount: request.messages.length,
        temperature: request.temperature,
        maxTokens: request.max_tokens,
        topP: request.top_p,
      },
      'perplexity'
    )

    try {
      return await this.callPerplexity(request)
    } catch (error) {
      const originalError = error instanceof Error
        ? error
        : new Error('Unknown error calling Perplexity')

      perplexityLogger.warn('Perplexity request failed', {
        message: originalError.message,
      })

      return this.handleFallback(formattedText, originalError, context)
    }
  }

  /**
   * Fallback automático: Claude → Ollama si ambos fallan
   */
  async handleFallback(
    text: string,
    originalError: Error,
    context?: ConversationContext
  ): Promise<AIResponse> {
    perplexityLogger.warn('Perplexity failed, trying Claude fallback', {
      error: originalError.message,
    })

    // Intenta con Claude primero
    if (this.claudeApiKey) {
      try {
        if (!this.claudeClient) {
          this.claudeClient = new Anthropic({ apiKey: this.claudeApiKey })
        }

        const response = await this.claudeClient.messages.create({
          model: process.env.CLAUDE_MODEL?.trim() || 'claude-3-5-sonnet-latest',
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          messages: [{ role: 'user', content: text }],
        })

        const responseText = response.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('')
          .trim()

        if (responseText) {
          perplexityLogger.info('Claude fallback succeeded')
          return { response: responseText }
        }
      } catch (error) {
        perplexityLogger.warn('Claude fallback failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } else {
      perplexityLogger.warn('Claude fallback unavailable: missing CLAUDE_API_KEY')
    }

    // Intenta con Ollama como último fallback
    try {
      perplexityLogger.info('Trying Ollama fallback')
      return await ollamaService.generateResponse(text, context)
    } catch (error) {
      logError(perplexityLogger, error, { stage: 'ollama-fallback' })
      return this.getGenericResponse()
    }
  }

  /**
   * Verifica si el servicio esta configurado con API keys.
   */
  isConfigured(): boolean {
    if (!this.apiKey) {
      return false
    }

    if (!this.claudeApiKey) {
      perplexityLogger.warn('CLAUDE_API_KEY no configurada; fallback limitado')
    }

    return true
  }

  private async callPerplexity(
    request: PerplexityRequest
  ): Promise<AIResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errorMessage = `Perplexity API error: ${response.status}`

        try {
          const errorData = (await response.json()) as PerplexityApiResponse
          if (errorData?.error?.message) {
            errorMessage = `${errorMessage} - ${errorData.error.message}`
          }
        } catch {
          // Best-effort error parsing
        }

        throw new Error(errorMessage)
      }

      const data = (await response.json()) as PerplexityApiResponse
      let content = data.choices?.[0]?.message?.content?.trim()

      if (!content) {
        throw new Error('Perplexity returned an empty response')
      }

      // Limpiar la respuesta: remover referencias y hacer más legible
      content = this.cleanResponse(content)

      return {
        response: content,
        sources: this.extractSources(data),
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Perplexity request timed out')
      }

      throw error instanceof Error ? error : new Error('Unknown Perplexity error')
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Limpia la respuesta de Perplexity para hacerla más legible y humana
   * Remueve: citations [1][2], asteriscos decorativos, markdown excesivo
   */
  private cleanResponse(text: string): string {
    let cleaned = text

    // Remover referencias numeradas [1], [2], etc.
    cleaned = cleaned.replace(/\[\d+\]/g, '')

    // Remover asteriscos múltiples (**, ***, etc.)
    cleaned = cleaned.replace(/\*\*+/g, '')

    // Remover números entre paréntesis (1), (2), etc.
    cleaned = cleaned.replace(/\(\d+\)/g, '')

    // Convertir líneas de guiones múltiples en puntos seguidos
    cleaned = cleaned.replace(/---+/g, '.')

    // Remover guiones al inicio de líneas (bullets) y reemplazar con punto
    cleaned = cleaned.replace(/^\s*-\s+/gm, '')

    // Limpiar espacios múltiples
    cleaned = cleaned.replace(/\s+/g, ' ')

    // Remover saltos de línea excesivos
    cleaned = cleaned.replace(/\n\n+/g, '\n')

    // Trimear
    cleaned = cleaned.trim()

    return cleaned
  }

  private extractSources(data: PerplexityApiResponse): string[] | undefined {
    const sources = new Set<string>()

    if (Array.isArray(data.citations)) {
      data.citations
        .filter((item) => typeof item === 'string')
        .forEach((item) => sources.add(item))
    }

    if (Array.isArray(data.sources)) {
      data.sources.forEach((item) => {
        if (typeof item === 'string') {
          sources.add(item)
        } else if (item?.url) {
          sources.add(item.url)
        }
      })
    }

    if (Array.isArray(data.references)) {
      data.references
        .map((item) => item?.url)
        .filter((item): item is string => typeof item === 'string')
        .forEach((item) => sources.add(item))
    }

    return sources.size > 0 ? Array.from(sources) : undefined
  }

  private buildMessages(
    text: string,
    context?: ConversationContext
  ): PerplexityMessage[] {
    const messages: PerplexityMessage[] = []

    // Agregar contexto del sistema
    const systemContext = this.buildSystemContext(context)
    if (systemContext) {
      messages.push({ role: 'system', content: systemContext })
    }

    // Perplexity requiere que los mensajes altern entre user y assistant
    // Por eso, incluir solo el resumen del contexto en el sistema, no mensajes individuales
    if (context?.recentMessages?.length) {
      // Construir un resumen de conversación anterior en lugar de mensajes individuales
      const conversationSummary = context.recentMessages
        .slice(-6) // Últimos 6 mensajes para no saturar
        .map((msg) => {
          const role = msg.role === 'user' ? 'Usuario' : 'Asistente'
          return `${role}: ${this.formatMessage(msg.content)}`
        })
        .join('\n')

      if (conversationSummary) {
        messages.push({
          role: 'system',
          content: `Contexto de conversación anterior:\n${conversationSummary}`,
        })
      }
    }

    // Mensaje actual del usuario
    messages.push({ role: 'user', content: text })

    return messages
  }

  private buildSystemContext(context?: ConversationContext): string | null {
    if (!context) {
      return null
    }

    const profile = context.userProfile
    const language = profile?.language ? `Idioma: ${profile.language}` : ''
    const name = profile?.name ? `Nombre: ${profile.name}` : ''
    const preferences = profile?.preferences
      ? `Preferencias: ${JSON.stringify(profile.preferences)}`
      : ''

    const metadata = [name, language, preferences]
      .filter(Boolean)
      .join(' | ')

    if (!metadata) {
      return `Contexto conversacion: ${context.conversationId}`
    }

    return `Contexto conversacion: ${context.conversationId}. ${metadata}`
  }

  private getGenericResponse(): AIResponse {
    return {
      response:
        'Lo siento, tuve un problema procesando tu mensaje. Por favor intenta de nuevo en unos minutos.',
    }
  }

  private logRequest(request: Record<string, unknown>, service: string): void {
    perplexityLogger.debug('AI request prepared', {
      service,
      ...request,
    })
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
}

export const perplexityService = new PerplexityService()





