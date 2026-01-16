/**
 * WhatsAppRepository
 *
 * Repository para interacciones con la API de WhatsApp Business.
 * Responsable de:
 * - Envío de mensajes (texto, audio, multimedia)
 * - Descarga de medios
 * - Subida de medios
 * - Gestión de tokens y configuración
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { exec } from 'child_process'
import { whatsappLogger } from '@/lib/logger'

/**
 * Resultado de descarga de medio
 */
export interface MediaDownloadResult {
  filePath: string
  mimeType: string
  cleanup: () => void
}

/**
 * Resultado de envío de mensaje
 */
export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Información de medio de WhatsApp
 */
interface WhatsAppMediaInfo {
  url: string
  mime_type: string
  sha256?: string
  file_size?: number
}

/**
 * Configuración de WhatsApp API
 */
interface WhatsAppConfig {
  token: string
  phoneNumberId: string
  apiVersion: string
}

/**
 * Repository para operaciones con WhatsApp API
 */
export class WhatsAppRepository {
  private config: WhatsAppConfig

  constructor() {
    const token = process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneNumberId) {
      throw new Error('WhatsApp credentials not configured in environment variables')
    }

    this.config = {
      token,
      phoneNumberId,
      apiVersion: 'v18.0',
    }

    whatsappLogger.info('WhatsApp repository initialized', {
      phoneNumberId: phoneNumberId.substring(0, 8) + '...',
    })
  }

  /**
   * Obtener información de un medio por su ID
   */
  private async getMediaInfo(mediaId: string): Promise<WhatsAppMediaInfo> {
    const url = `https://graph.facebook.com/${this.config.apiVersion}/${mediaId}`

    whatsappLogger.debug('Fetching media info', { mediaId })

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      whatsappLogger.error('Failed to fetch media info', {
        mediaId,
        status: response.status,
        error: errorText,
      })
      throw new Error(`Failed to fetch media info: ${response.statusText}`)
    }

    const mediaInfo = await response.json()

    whatsappLogger.debug('Media info retrieved', {
      mediaId,
      mimeType: mediaInfo.mime_type,
      fileSize: mediaInfo.file_size,
    })

    return mediaInfo
  }

  /**
   * Descargar contenido de medio por URL
   */
  private async downloadMediaContent(mediaUrl: string): Promise<Buffer> {
    whatsappLogger.debug('Downloading media content', { mediaUrl })

    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
    })

    if (!response.ok) {
      whatsappLogger.error('Failed to download media content', {
        mediaUrl,
        status: response.status,
      })
      throw new Error(`Failed to download media: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    whatsappLogger.debug('Media content downloaded', {
      size: buffer.length,
    })

    return buffer
  }

  /**
   * Descargar medio de WhatsApp por ID
   */
  async downloadMedia(mediaId: string): Promise<MediaDownloadResult> {
    whatsappLogger.info('Downloading WhatsApp media', { mediaId })

    try {
      // Obtener información del medio
      const mediaInfo = await this.getMediaInfo(mediaId)

      // Descargar contenido
      const buffer = await this.downloadMediaContent(mediaInfo.url)

      // Determinar extensión del archivo
      const extension = this.getFileExtension(mediaInfo.mime_type)

      // Guardar en archivo temporal
      const tempDir = os.tmpdir()
      const tempFilePath = path.join(tempDir, `whatsapp_media_${mediaId}${extension}`)

      fs.writeFileSync(tempFilePath, buffer)

      whatsappLogger.info('Media downloaded successfully', {
        mediaId,
        filePath: tempFilePath,
        size: buffer.length,
        mimeType: mediaInfo.mime_type,
      })

      return {
        filePath: tempFilePath,
        mimeType: mediaInfo.mime_type,
        cleanup: () => {
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath)
              whatsappLogger.debug('Temporary media file deleted', { filePath: tempFilePath })
            }
          } catch (error) {
            whatsappLogger.error('Failed to delete temporary media file', {
              filePath: tempFilePath,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        },
      }
    } catch (error) {
      whatsappLogger.error('Failed to download media', {
        mediaId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Enviar mensaje de texto
   */
  async sendTextMessage(phoneNumber: string, text: string): Promise<SendMessageResult> {
    whatsappLogger.info('Sending text message', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      textLength: text.length,
    })

    try {
      const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber.replace(/\D/g, ''),
          type: 'text',
          text: { body: text },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        whatsappLogger.error('Failed to send text message', {
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          status: response.status,
          error: errorText,
        })
        throw new Error(`WhatsApp API error: ${response.statusText}`)
      }

      const result = await response.json()
      const messageId = result.messages?.[0]?.id

      whatsappLogger.info('Text message sent successfully', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        messageId,
      })

      return {
        success: true,
        messageId,
      }
    } catch (error) {
      whatsappLogger.error('Failed to send text message', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending message',
      }
    }
  }

  /**
   * Subir medio a WhatsApp
   */
  private async uploadMedia(filePath: string, mimeType: string): Promise<string> {
    whatsappLogger.info('Uploading media to WhatsApp', { filePath, mimeType })

    const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/media`

    // Leer archivo
    const fileBuffer = fs.readFileSync(filePath)
    const fileBlob = new Blob([fileBuffer], { type: mimeType })

    // Crear FormData
    const formData = new FormData()
    formData.append('file', fileBlob, path.basename(filePath))
    formData.append('type', mimeType)
    formData.append('messaging_product', 'whatsapp')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      whatsappLogger.error('Failed to upload media', {
        filePath,
        status: response.status,
        error: errorText,
      })
      throw new Error(`Failed to upload media: ${response.statusText}`)
    }

    const result = await response.json()
    const mediaId = result.id

    whatsappLogger.info('Media uploaded successfully', {
      filePath,
      mediaId,
    })

    return mediaId
  }

  /**
   * Convertir audio a formato OGG/OPUS para WhatsApp
   */
  private async convertToOggOpus(inputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempDir = os.tmpdir()
      const outputPath = path.join(tempDir, `voice_note_${Date.now()}.ogg`)

      // Comando ffmpeg optimizado para notas de voz
      const command = `ffmpeg -i "${inputPath}" -c:a libopus -b:a 24k -vbr on -compression_level 10 -frame_duration 60 -application voip -y "${outputPath}"`

      whatsappLogger.debug('Converting audio to OGG/OPUS', { inputPath, outputPath })

      exec(command, { timeout: 30000, windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          whatsappLogger.error('Failed to convert audio', {
            inputPath,
            error: error.message,
          })
          reject(new Error(`Failed to convert audio: ${error.message}`))
          return
        }

        if (!fs.existsSync(outputPath)) {
          whatsappLogger.error('ffmpeg did not generate output file', { outputPath })
          reject(new Error('ffmpeg did not generate OGG file'))
          return
        }

        const fileSize = fs.statSync(outputPath).size
        whatsappLogger.debug('Audio converted successfully', {
          outputPath,
          size: fileSize,
        })

        resolve(outputPath)
      })
    })
  }

  /**
   * Enviar mensaje de audio (nota de voz)
   */
  async sendAudioMessage(phoneNumber: string, audioFilePath: string): Promise<SendMessageResult> {
    whatsappLogger.info('Sending audio message', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      audioFilePath,
    })

    let convertedFilePath: string | null = null

    try {
      // Convertir a OGG/OPUS
      convertedFilePath = await this.convertToOggOpus(audioFilePath)

      // Subir medio
      const mediaId = await this.uploadMedia(convertedFilePath, 'audio/ogg; codecs=opus')

      // Enviar mensaje con el audio
      const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber.replace(/\D/g, ''),
          type: 'audio',
          audio: {
            id: mediaId,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        whatsappLogger.error('Failed to send audio message', {
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          status: response.status,
          error: errorText,
        })
        throw new Error(`Failed to send audio: ${response.statusText}`)
      }

      const result = await response.json()
      const messageId = result.messages?.[0]?.id

      whatsappLogger.info('Audio message sent successfully', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        messageId,
      })

      return {
        success: true,
        messageId,
      }
    } catch (error) {
      whatsappLogger.error('Failed to send audio message', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending audio',
      }
    } finally {
      // Limpiar archivo temporal
      if (convertedFilePath && fs.existsSync(convertedFilePath)) {
        try {
          fs.unlinkSync(convertedFilePath)
          whatsappLogger.debug('Temporary OGG file deleted', { filePath: convertedFilePath })
        } catch (error) {
          whatsappLogger.error('Failed to delete temporary OGG file', {
            filePath: convertedFilePath,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }
  }

  /**
   * Determinar extensión de archivo según MIME type
   */
  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/mp4': '.mp4',
      'audio/wav': '.wav',
      'video/mp4': '.mp4',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    }

    for (const [mime, ext] of Object.entries(extensions)) {
      if (mimeType.includes(mime)) {
        return ext
      }
    }

    // Determinar por categoría general
    if (mimeType.includes('audio')) return '.audio'
    if (mimeType.includes('video')) return '.video'
    if (mimeType.includes('image')) return '.img'

    return '.file'
  }

  /**
   * Enmascarar número de teléfono para logs (privacidad)
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return '****'
    return phoneNumber.substring(0, 4) + '****' + phoneNumber.substring(phoneNumber.length - 2)
  }
}

/**
 * Instancia singleton del repositorio
 */
export const whatsappRepository = new WhatsAppRepository()
